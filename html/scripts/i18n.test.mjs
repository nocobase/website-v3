// 语言文件的读写：特殊字符的译文能原样往返，仓库里的每个语言文件读出再写回不变（pnpm test）。
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';
import { I18N } from './lib/i18n.mjs';
import { toYaml } from './lib/yaml-io.mjs';

test('translations with special characters round-trip unchanged', () => {
  const data = {
    notes: 'Français（vouvoiement）\n术语：foundation = socle；# 不是注释\n',
    title: 'NocoBase : la plateforme « open source »',
    description: '"Quoted" and \'single\' — with: colons, # hashes, {app} and 100%',
    strings: {
      '000': 'Leading: colon',
      '001': '  leading spaces and trailing  ',
      '002': 'yes',
      '003': '123',
      '004': 'Line one\nLine two',
      '005': '<span class="m">HTML &amp; entities</span>',
      '099': '- dash',
      '100': '@at and `backtick`',
      '111': '',
    },
    ui: { '简体: 中文': '繁體：中文', '¥1,200': 'NT$1,200', 'null': 'true' },
  };
  const text = toYaml(data);
  assert.deepEqual(parse(text), data);
  // 编号按顺序写出（"100" 不会跑到 "000" 前面）
  assert.ok(text.indexOf('"000"') < text.indexOf('"099"') && text.indexOf('"099"') < text.indexOf('"100"'));
  assert.equal(toYaml(parse(text)), text);
});

test('every language file in src/i18n is written back byte for byte', () => {
  for (const f of readdirSync(I18N).filter(f => f.endsWith('.yaml'))) {
    const text = readFileSync(join(I18N, f), 'utf8');
    assert.equal(toYaml(parse(text)), text, f);
  }
});
