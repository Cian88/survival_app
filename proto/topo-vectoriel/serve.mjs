/* Petit serveur local du prototype : node proto/topo-vectoriel/serve.mjs, puis http://localhost:8790 */
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url)), PORT = +process.env.PORT || 8790;
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.pbf': 'application/x-protobuf', '.pmtiles': 'application/octet-stream' };
http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(ROOT, path || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Content-Length': s.size });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end(); }
}).listen(PORT, '127.0.0.1', () => console.log(`Prototype : http://localhost:${PORT}`));
