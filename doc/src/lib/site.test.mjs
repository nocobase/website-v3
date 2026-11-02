import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadContent } from './content.mjs';
import { getSite, resetSite } from './site.mjs';

vi.mock('./content.mjs', async original => {
  const actual = await original();
  return { ...actual, loadContent: vi.fn(actual.loadContent) };
});

const CACHE = Symbol.for('nocobase.doc.site');

describe('getSite', () => {
  beforeEach(() => { delete globalThis[CACHE]; });
  afterEach(() => { delete globalThis[CACHE]; vi.restoreAllMocks(); });

  it('keeps the site model until resetSite()', () => {
    const first = getSite();
    expect(getSite()).toBe(first);
    resetSite();
    expect(getSite()).not.toBe(first);
  });

  it('throws when the content is invalid and there is no valid model', () => {
    loadContent.mockImplementationOnce(() => { throw new Error('invalid content'); });
    expect(() => getSite()).toThrow('invalid content');
  });

  it('reports invalid content once, keeps the last valid model and recovers', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = getSite();
    loadContent.mockImplementationOnce(() => { throw new Error('invalid content'); }).mockImplementationOnce(() => { throw new Error('invalid content'); });
    resetSite();
    expect(getSite()).toBe(first);
    expect(getSite()).toBe(first);
    expect(error).toHaveBeenCalledTimes(1);
    const next = getSite();
    expect(next).not.toBe(first);
    expect(getSite()).toBe(next);
  });
});
