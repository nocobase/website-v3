// 语言文件（content/i18n/*.yaml）的读写。写回时键的顺序照传入的对象（编号 000、001……按编号排），块样式，不折行，中文不转义，同样的内容每次写出来都一样。
// 用 Map 写出，是因为 JavaScript 对象会把 "100" 这样像数组下标的键排到最前面。
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

export const readYaml = f => parse(readFileSync(f, 'utf8')) ?? {};

const isId = k => /^\d{3}$/.test(k);
function toMap(v) {
  if (Array.isArray(v)) return v.map(toMap);
  if (!v || typeof v !== 'object') return v;
  let keys = Object.keys(v);
  if (keys.length && keys.every(isId)) keys = keys.sort();
  return new Map(keys.map(k => [k, toMap(v[k])]));
}
export const toYaml = data => stringify(toMap(data), { lineWidth: 0, minContentWidth: 0 });
export const writeYaml = (f, data) => writeFileSync(f, toYaml(data));
