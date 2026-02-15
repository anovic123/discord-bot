import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  discordIdSchema,
  hexColorSchema,
  validate,
  numberInRange,
} from './index';

describe('sanitizeString', () => {
  it('should remove < and > characters', () => {
    expect(sanitizeString('hello <script>alert</script>')).toBe('hello scriptalert/script');
  });

  it('should remove control characters', () => {
    expect(sanitizeString('hello\x00\x1Fworld')).toBe('helloworld');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should truncate to 2000 characters', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeString(long)).toHaveLength(2000);
  });
});

describe('discordIdSchema', () => {
  it('should accept valid Discord IDs (17-20 digits)', () => {
    expect(discordIdSchema.safeParse('12345678901234567').success).toBe(true);
    expect(discordIdSchema.safeParse('12345678901234567890').success).toBe(true);
  });

  it('should reject invalid Discord IDs', () => {
    expect(discordIdSchema.safeParse('1234').success).toBe(false);
    expect(discordIdSchema.safeParse('abc').success).toBe(false);
    expect(discordIdSchema.safeParse('123456789012345678901').success).toBe(false);
    expect(discordIdSchema.safeParse('').success).toBe(false);
  });
});

describe('hexColorSchema', () => {
  it('should accept valid hex colors with #', () => {
    expect(hexColorSchema.safeParse('#FF00AA').success).toBe(true);
    expect(hexColorSchema.safeParse('#ff00aa').success).toBe(true);
  });

  it('should accept valid hex colors without #', () => {
    expect(hexColorSchema.safeParse('FF00AA').success).toBe(true);
  });

  it('should reject invalid hex colors', () => {
    expect(hexColorSchema.safeParse('#GG00AA').success).toBe(false);
    expect(hexColorSchema.safeParse('#FFF').success).toBe(false);
    expect(hexColorSchema.safeParse('').success).toBe(false);
  });
});

describe('validate', () => {
  it('should return success with parsed data on valid input', () => {
    const result = validate(discordIdSchema, '12345678901234567');
    expect(result).toEqual({ success: true, data: '12345678901234567' });
  });

  it('should return failure with error message on invalid input', () => {
    const result = validate(discordIdSchema, 'bad');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid Discord ID');
    }
  });
});

describe('numberInRange', () => {
  const schema = numberInRange(1, 100);

  it('should accept numbers within range', () => {
    expect(schema.safeParse(1).success).toBe(true);
    expect(schema.safeParse(50).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);
  });

  it('should reject numbers outside range', () => {
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(101).success).toBe(false);
  });
});
