import { z } from 'zod';
import { STATUSES, TITLE_MAX_LENGTH } from '../domain/task';

// Request schemas are strict: unknown keys are rejected so typos surface as 400s.
export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
    status: z.enum(STATUSES).optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(TITLE_MAX_LENGTH).optional(),
    status: z.enum(STATUSES).optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.status !== undefined, {
    message: 'At least one of title or status must be provided',
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Response schemas — used by the contract tests to assert the live API shape.
export const taskResponseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(STATUSES),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const taskListResponseSchema = z
  .object({
    tasks: z.array(taskResponseSchema),
  })
  .strict();

export const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    uptime: z.number(),
  })
  .strict();

export const errorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
      })
      .strict(),
  })
  .strict();
