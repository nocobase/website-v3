import { afterEach, describe, expect, it } from 'vitest';
import { activateLanguage, contentPattern, languageOfPath, limitLanguages } from './dev-languages.mjs';

const languages = [{ code: 'en', dir: '' }, { code: 'zh-CN', dir: 'zh-CN' }, { code: 'ja-JP', dir: 'ja-JP' }];

afterEach(() => { delete globalThis[Symbol.for('nocobase.doc.activeLanguages')]; });

describe('contentPattern', () => {
  it('matches every language unless limited, as in a build', () => {
    expect(contentPattern(languages)).toEqual(['**/*.md']);
  });

  it('skips the languages that are not active', () => {
    limitLanguages('en');
    expect(contentPattern(languages)).toEqual(['**/*.md', '!zh-CN/**', '!ja-JP/**']);
    activateLanguage('zh-CN');
    expect(contentPattern(languages)).toEqual(['**/*.md', '!ja-JP/**']);
  });
});

describe('languageOfPath', () => {
  it('finds the language with its own directory', () => {
    expect(languageOfPath('/zh-CN/', languages)?.code).toBe('zh-CN');
    expect(languageOfPath('/zh-CN', languages)?.code).toBe('zh-CN');
    expect(languageOfPath('/ja-JP/core/', languages)?.code).toBe('ja-JP');
  });

  it('leaves out the default language and look-alike addresses', () => {
    expect(languageOfPath('/', languages)).toBeUndefined();
    expect(languageOfPath('/core/', languages)).toBeUndefined();
    expect(languageOfPath('/zh-CN-old/', languages)).toBeUndefined();
  });
});
