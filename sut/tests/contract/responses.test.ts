import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import {
  errorResponseSchema,
  healthResponseSchema,
  taskListResponseSchema,
  taskResponseSchema,
} from '../../src/schemas/task';

// Contract tests: assert that live responses parse against the published response
// schemas. If the API shape drifts, these fail even when status codes are fine.
function freshApp() {
  return createApp({ dbFile: ':memory:', enableTestReset: true });
}

describe('response contracts', () => {
  it('GET /api/health matches the health schema', async () => {
    const res = await request(freshApp()).get('/api/health');
    expect(healthResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('GET /api/tasks matches the task-list schema', async () => {
    const app = freshApp();
    await request(app).post('/api/tasks').send({ title: 'Listed task' });
    const res = await request(app).get('/api/tasks');
    expect(taskListResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('POST /api/tasks matches the task schema', async () => {
    const res = await request(freshApp()).post('/api/tasks').send({ title: 'Made task' });
    expect(taskResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('PATCH /api/tasks/:id matches the task schema', async () => {
    const app = freshApp();
    const created = await request(app).post('/api/tasks').send({ title: 'Patch me' });
    const res = await request(app).patch(`/api/tasks/${created.body.id}`).send({ status: 'done' });
    expect(taskResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('validation errors match the error schema', async () => {
    const res = await request(freshApp()).post('/api/tasks').send({});
    expect(errorResponseSchema.safeParse(res.body).success).toBe(true);
  });

  it('not-found errors match the error schema', async () => {
    const res = await request(freshApp()).get('/api/tasks/missing');
    expect(errorResponseSchema.safeParse(res.body).success).toBe(true);
  });
});
