// 本地开发服务器：静态文件（public/、assets/）+ /api。零依赖。
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleApi } from './backend/api.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
export const MIME = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

// 把 URL 路径映射到磁盘文件；越界或不支持的类型返回 null。
export function resolveFile(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }
  if (rel === '/') rel = '/index.html';
  const base = rel.startsWith('/assets/') ? ROOT : path.join(ROOT, 'public');
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep)) return null;
  const ext = path.extname(file).slice(1).toLowerCase();
  return MIME[ext] ? { file, type: MIME[ext] } : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname.startsWith('/api/')) {
      const init = { method: req.method, headers: req.headers };
      if (!['GET', 'HEAD'].includes(req.method)) Object.assign(init, { body: Readable.toWeb(req), duplex: 'half' });
      const result = await handleApi(new Request(url, init), process.env);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(await result.text());
      return;
    }
    const hit = resolveFile(url.pathname);
    if (!hit) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(hit.file).catch(() => null);
    if (!body) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': hit.type, 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Unable to load page');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '0.0.0.0', () => console.log(`第四个版本: http://localhost:${PORT}`));
}
