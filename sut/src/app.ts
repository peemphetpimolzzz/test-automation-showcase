import express, { type Express } from 'express';
import { TaskStore } from './db';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { createTasksRouter } from './routes/tasks';

export interface AppOptions {
  // ':memory:' for tests, a file path for runtime.
  dbFile?: string;
  // The test-only reset endpoint is gated by ENABLE_TEST_RESET=1.
  enableTestReset?: boolean;
}

export function createApp(options: AppOptions = {}): Express {
  const dbFile = options.dbFile ?? process.env.DB_FILE ?? ':memory:';
  const enableTestReset =
    options.enableTestReset ?? process.env.ENABLE_TEST_RESET === '1';

  const store = new TaskStore(dbFile);
  const app = express();
  app.use(express.json());

  const startedAt = Date.now();
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: (Date.now() - startedAt) / 1000 });
  });

  if (enableTestReset) {
    app.post('/api/_reset', (_req, res) => {
      store.reset();
      res.status(204).send();
    });
  }

  app.use('/api', createTasksRouter(store));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
