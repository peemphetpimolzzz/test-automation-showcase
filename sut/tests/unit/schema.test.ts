import { describe, expect, it } from 'vitest';
import { createTaskSchema, updateTaskSchema } from '../../src/schemas/task';

describe('createTaskSchema', () => {
  it('accepts a valid body with just a title', () => {
    const result = createTaskSchema.safeParse({ title: 'Buy milk' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid body with title and status', () => {
    const result = createTaskSchema.safeParse({ title: 'Buy milk', status: 'doing' });
    expect(result.success).toBe(true);
  });

  it('trims the title', () => {
    const result = createTaskSchema.parse({ title: '  spaced  ' });
    expect(result.title).toBe('spaced');
  });

  it('rejects an empty title', () => {
    expect(createTaskSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects a missing title', () => {
    expect(createTaskSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an invalid status', () => {
    expect(createTaskSchema.safeParse({ title: 'x', status: 'archived' }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(createTaskSchema.safeParse({ title: 'x', priority: 'high' }).success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('accepts a status-only update', () => {
    expect(updateTaskSchema.safeParse({ status: 'done' }).success).toBe(true);
  });

  it('accepts a title-only update', () => {
    expect(updateTaskSchema.safeParse({ title: 'renamed' }).success).toBe(true);
  });

  it('rejects an empty body (must change something)', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(updateTaskSchema.safeParse({ status: 'done', extra: true }).success).toBe(false);
  });

  it('rejects an invalid status', () => {
    expect(updateTaskSchema.safeParse({ status: 'nope' }).success).toBe(false);
  });
});
