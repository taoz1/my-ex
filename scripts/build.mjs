// 打包成单文件 Worker：dist/server/index.js（静态文件内嵌，API 走服务端）。
// 图片素材以 base64 内嵌；素材很多时包会变大，部署前请留意体积。
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
const TEXT = new Set(['html', 'js', 'css', 'svg']);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const assets = {};
let bytes = 0;
for (const [root, prefix] of [['public', ''], ['assets', 'assets/']]) {
  for (const file of await walk(root)) {
    const ext = path.extname(file).slice(1).toLowerCase();
    if (!MIME[ext]) continue;
    const urlPath = '/' + prefix + path.relative(root, file).split(path.sep).join('/');
    const data = await readFile(file);
    bytes += (await stat(file)).size;
    assets[urlPath] = TEXT.has(ext)
      ? { body: data.toString('utf8'), type: MIME[ext] }
      : { base64: data.toString('base64'), type: MIME[ext] };
  }
}
assets['/'] = assets['/index.html'];

const cards = await readFile('backend/npc-cards.mjs', 'utf8');
const api = (await readFile('backend/api.mjs', 'utf8')).replace(/^import .*npc-cards\.mjs';\n/m, '');
const worker = `${cards}\n${api}
const assets = ${JSON.stringify(assets)};
const decode = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return handleApi(request, env);
    const asset = assets[path];
    if (!asset) return new Response('Not found', { status: 404 });
    const body = asset.base64 ? decode(asset.base64) : asset.body;
    return new Response(body, { headers: { 'Content-Type': asset.type, 'X-Content-Type-Options': 'nosniff' } });
  },
};
`;
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', worker);
console.log(`Built dist/server/index.js（${Object.keys(assets).length} 个文件，原始 ${(bytes / 1024).toFixed(0)} KB）`);
