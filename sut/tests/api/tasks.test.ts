import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

// Each test gets a fresh in-memory database, so tests never interfere.
function freshApp() {
  return createApp({ dbFile: ':memory:', enableTestReset: true });
}

describe('GET /api/health', () => {
  it('returns ok with an uptime', async () => {
    const res = await request(freshApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /api/tasks', () => {
  it('returns an empty list initially', async () => {
    const res = await request(freshApp()).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tasks: [] });
  });
});

describe('POST /api/tasks', () => {
  let app: ReturnType<typeof freshApp>;
  beforeEach(() => {
    app = freshApp();
  });

  it('creates a task with default status todo', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write a test' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Write a test', status: 'todo' });
    expect(res.body.id).toBeTruthy();
    expect(res.body.createdAt).toBeTruthy();
  });

  it('honours an explicit status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'In progress', status: 'doing' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('doing');
  });

  it('rejects a missing title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x', status: 'archived' });
    expect(res.status).toBe(400);
  });

  it('rejects unknown keys with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x', priority: 'high' });
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{ not json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_json');
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns a created task', async () => {
    const app = freshApp();
    const created = await request(app).post('/api/tasks').send({ title: 'Find me' });
    const res = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(freshApp()).get('/api/tasks/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('PATCH /api/tasks/:id', () => {
  let app: ReturnType<typeof freshApp>;
  let id: string;
  beforeEach(async () => {
    app = freshApp();
    const created = await request(app).post('/api/tasks').send({ title: 'Original' });
    id = created.body.id;
  });

  it('updates the status', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('updates the title', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Renamed');
  });

  it('rejects an empty body with 400', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).send({});
    expect(res.status).toBe(400);
  });

  it('rejects unknown keys with 400', async () => {
    const res = await request(app).patch(`/api/tasks/${id}`).send({ status: 'done', extra: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/tasks/nope').send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and then 404s', async () => {
    const app = freshApp();
    const created = await request(app).post('/api/tasks').send({ title: 'Delete me' });
    const del = await request(app).delete(`/api/tasks/${created.body.id}`);
    expect(del.status).toBe(204);
    const after = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it('returns 404 deleting an unknown id', async () => {
    const res = await request(freshApp()).delete('/api/tasks/nope');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/_reset', () => {
  it('clears all tasks when enabled', async () => {
    const app = freshApp();
    await request(app).post('/api/tasks').send({ title: 'temp' });
    const reset = await request(app).post('/api/_reset');
    expect(reset.status).toBe(204);
    const list = await request(app).get('/api/tasks');
    expect(list.body.tasks).toHaveLength(0);
  });

  it('is absent when disabled (404)', async () => {
    const app = createApp({ dbFile: ':memory:', enableTestReset: false });
    const res = await request(app).post('/api/_reset');
    expect(res.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('return a 404 error envelope', async () => {
    const res = await request(freshApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});
