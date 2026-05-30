import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { Status, Task } from './domain/task';

// A thin repository over better-sqlite3. The runtime uses a file-backed DB;
// tests pass ':memory:' for a fresh, isolated store per test.
export class TaskStore {
  private readonly db: Database.Database;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id        TEXT PRIMARY KEY,
        title     TEXT NOT NULL,
        status    TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  }

  list(): Task[] {
    return this.db
      .prepare('SELECT id, title, status, createdAt, updatedAt FROM tasks ORDER BY createdAt ASC, id ASC')
      .all() as Task[];
  }

  get(id: string): Task | undefined {
    return this.db
      .prepare('SELECT id, title, status, createdAt, updatedAt FROM tasks WHERE id = ?')
      .get(id) as Task | undefined;
  }

  create(title: string, status: Status): Task {
    const now = new Date().toISOString();
    const task: Task = { id: randomUUID(), title, status, createdAt: now, updatedAt: now };
    this.db
      .prepare('INSERT INTO tasks (id, title, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)')
      .run(task.id, task.title, task.status, task.createdAt, task.updatedAt);
    return task;
  }

  update(id: string, changes: { title?: string; status?: Status }): Task | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const updated: Task = {
      ...existing,
      title: changes.title ?? existing.title,
      status: changes.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };
    this.db
      .prepare('UPDATE tasks SET title = ?, status = ?, updatedAt = ? WHERE id = ?')
      .run(updated.title, updated.status, updated.updatedAt, id);
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }

  reset(): void {
    this.db.exec('DELETE FROM tasks');
  }
}
