// Pure domain logic for tasks. No I/O, no framework — easy to unit-test.

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

// The board cycles status in a fixed order: todo -> doing -> done -> todo.
export function nextStatus(current: Status): Status {
  const order: Status[] = ['todo', 'doing', 'done'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

export const TITLE_MAX_LENGTH = 200;

// A valid title is a non-empty string (after trimming) no longer than the max length.
export function isValidTitle(title: unknown): title is string {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= TITLE_MAX_LENGTH;
}

export function normalizeTitle(title: string): string {
  return title.trim();
}
