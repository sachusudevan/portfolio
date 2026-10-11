import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => readFileSync(join(root, p), 'utf8');
export const exists = (p) => existsSync(join(root, p));
export const html = () => read('index.html');
export const tags = (src, name) => [...src.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
export const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
};
export const cssText = () =>
  ['css/tokens.css', 'css/base.css', 'css/sections.css'].filter(exists).map(read).join('\n');
