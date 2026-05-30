import { Router } from 'express';
import type { TaskStore } from '../db';
import { ApiError } from '../middleware/errors';
import { createTaskSchema, updateTaskSchema } from '../schemas/task';

export function createTasksRouter(store: TaskStore): Router {
  const router = Router();

  router.get('/tasks', (_req, res) => {
    res.json({ tasks: store.list() });
  });

  router.post('/tasks', (req, res) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'validation_error', parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const task = store.create(parsed.data.title, parsed.data.status ?? 'todo');
    res.status(201).json(task);
  });

  router.get('/tasks/:id', (req, res) => {
    const task = store.get(req.params.id);
    if (!task) throw new ApiError(404, 'not_found', 'Task not found');
    res.json(task);
  });

  router.patch('/tasks/:id', (req, res) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'validation_error', parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const updated = store.update(req.params.id, parsed.data);
    if (!updated) throw new ApiError(404, 'not_found', 'Task not found');
    res.json(updated);
  });

  router.delete('/tasks/:id', (req, res) => {
    const deleted = store.delete(req.params.id);
    if (!deleted) throw new ApiError(404, 'not_found', 'Task not found');
    res.status(204).send();
  });

  return router;
}
