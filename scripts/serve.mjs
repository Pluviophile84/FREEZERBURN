import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = process.argv.includes('--dist') ? resolve(root, 'dist') : root;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
// Serve only public files, never the Git directory or handoff documents.
const allowed = new Set(['index.html', 'styles.css', 'app.js', 'launch-config.js', 'assets/brand/FREEZERBURN_logo_avatar_v1.png']);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!allowed.has(file) || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const body = await readFile(resolve(base, file));
    res.writeHead(200, { 'Content-Type': types[extname(file)], 'Content-Length': body.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`FREEZERBURN static server listening on ${host}:${port} (${process.argv.includes('--dist') ? 'dist' : 'source'}).`));
