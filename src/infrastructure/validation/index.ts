import { z } from 'zod';

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 2000);
}

export const discordIdSchema = z.string().regex(/^\d{17,20}$/, 'Invalid Discord ID');

export const usernameSchema = z
  .string()
  .min(1)
  .max(32)
  .transform(sanitizeString);

export const reasonSchema = z
  .string()
  .max(512)
  .transform(sanitizeString)
  .optional()
  .default('Не указано');

export const messageSchema = z
  .string()
  .min(1)
  .max(2000)
  .transform(sanitizeString);

export function numberInRange(min: number, max: number) {
  return z.number().min(min).max(max);
}

export const urlSchema = z.string().url().max(2048);

export const hexColorSchema = z.string().regex(/^#?[0-9A-Fa-f]{6}$/, 'Invalid hex color');

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((i) => i.message).join(', '),
  };
}
