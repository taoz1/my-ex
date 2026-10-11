// 语法检查：所有 JS / MJS 文件都能被 Node 解析。
import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (/\.(m?js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = [...await walk('public/js'), ...await walk('backend'), ...await walk('scripts'), 'server.mjs'];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`语法检查通过：${files.length} 个文件`);
