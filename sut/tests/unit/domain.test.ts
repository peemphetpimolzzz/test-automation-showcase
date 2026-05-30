import { describe, expect, it } from 'vitest';
import {
  isStatus,
  isValidTitle,
  nextStatus,
  normalizeTitle,
  TITLE_MAX_LENGTH,
} from '../../src/domain/task';

describe('nextStatus', () => {
  it('cycles todo -> doing -> done -> todo', () => {
    expect(nextStatus('todo')).toBe('doing');
    expect(nextStatus('doing')).toBe('done');
    expect(nextStatus('done')).toBe('todo');
  });
});

describe('isStatus', () => {
  it('accepts the three valid statuses', () => {
    expect(isStatus('todo')).toBe(true);
    expect(isStatus('doing')).toBe(true);
    expect(isStatus('done')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isStatus('archived')).toBe(false);
    expect(isStatus('')).toBe(false);
    expect(isStatus(42)).toBe(false);
    expect(isStatus(undefined)).toBe(false);
  });
});

describe('isValidTitle', () => {
  it('accepts a normal title', () => {
    expect(isValidTitle('Write tests')).toBe(true);
  });

  it('accepts a title at the max length', () => {
    expect(isValidTitle('a'.repeat(TITLE_MAX_LENGTH))).toBe(true);
  });

  it('rejects empty or whitespace-only titles', () => {
    expect(isValidTitle('')).toBe(false);
    expect(isValidTitle('   ')).toBe(false);
  });

  it('rejects titles longer than the max length', () => {
    expect(isValidTitle('a'.repeat(TITLE_MAX_LENGTH + 1))).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidTitle(123)).toBe(false);
    expect(isValidTitle(null)).toBe(false);
  });
});

describe('normalizeTitle', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeTitle('  hello  ')).toBe('hello');
  });
});
