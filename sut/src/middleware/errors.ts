import type { NextFunction, Request, Response } from 'express';

// Stable error envelope: every error response is { error: { code, message } }.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: 'Resource not found' } });
}

// Express recognises error middleware by its four-arg signature; keep `_next`.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Malformed JSON bodies arrive here as SyntaxError from express.json().
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } });
    return;
  }
  res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
}
