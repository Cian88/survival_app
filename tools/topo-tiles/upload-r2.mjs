/* Envoie un gros fichier (PMTiles) dans R2 par le Worker temporaire tools/topo-tiles/upload-worker.
   Usage : UPLOAD_KEY=… node tools/topo-tiles/upload-r2.mjs <fichier> <nom de l'objet> <url du Worker>
   - Parties de 90 Mio, 3 en parallèle, 5 essais par partie.
   - Reprise : l'avancement est gardé dans <fichier>.upload.json ; relancer la même commande continue l'envoi.
   - À la fin, la taille de l'objet dans R2 est comparée à celle du fichier. */
import { open, stat, readFile, writeFile, rm } from 'node:fs/promises';

const [file, key, worker] = process.argv.slice(2), token = process.env.UPLOAD_KEY;
if (!file || !key || !worker || !token) { console.error('Usage : UPLOAD_KEY=… node tools/topo-tiles/upload-r2.mjs <fichier> <objet> <url du Worker>'); process.exit(2); }
const PART = 90 * 1024 * 1024, PARALLEL = 3, TRIES = 5;
const api = async (method, path, params, body) => {
  const u = new URL(path, worker); u.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  const r = await fetch(u, { method, body, headers: { Authorization: `Bearer ${token}` }, duplex: 'half' });
  if (!r.ok) throw new Error(`${method} ${path} : HTTP ${r.status} ${await r.text()}`);
  return r.json();
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const size = (await stat(file)).size, count = Math.ceil(size / PART), stateFile = file + '.upload.json';
let state = await readFile(stateFile, 'utf8').then(JSON.parse).catch(() => null);
if (!state || state.key !== key || state.size !== size || state.partSize !== PART) {
  const { uploadId } = await api('POST', '/create');
  state = { key, size, partSize: PART, uploadId, parts: {} };
  await writeFile(stateFile, JSON.stringify(state));
  console.log(`Nouvel envoi : ${key}, ${(size / 1e9).toFixed(1)} Go en ${count} parties.`);
} else console.log(`Reprise : ${Object.keys(state.parts).length} / ${count} parties déjà envoyées.`);

const fh = await open(file), todo = [];
for (let n = 1; n <= count; n++) if (!state.parts[n]) todo.push(n);
const t0 = Date.now(); let sent = 0;
async function send(n) {
  const len = Math.min(PART, size - (n - 1) * PART), buf = Buffer.alloc(len);
  await fh.read(buf, 0, len, (n - 1) * PART);
  for (let i = 1; ; i++) {
    try {
      const p = await api('PUT', '/part', { uploadId: state.uploadId, part: n }, buf);
      state.parts[n] = p.etag; await writeFile(stateFile, JSON.stringify(state));
      sent += len;
      const done = Object.keys(state.parts).length, mbs = sent / 1048576 / ((Date.now() - t0) / 1000);
      console.log(`partie ${n} envoyée (${done} / ${count}) — ${mbs.toFixed(1)} Mo/s, reste ≈ ${Math.round((size - done * PART) / 1048576 / mbs / 60)} min`);
      return;
    } catch (e) {
      if (i >= TRIES) throw e;
      console.log(`partie ${n} : essai ${i} échoué (${e.message}), nouvel essai…`); await sleep(5000 * i);
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, async () => { while (todo.length) await send(todo.shift()); }));
await fh.close();

const parts = Object.entries(state.parts).map(([n, etag]) => ({ partNumber: +n, etag })).sort((a, b) => a.partNumber - b.partNumber);
const done = await api('POST', '/complete', { uploadId: state.uploadId }, JSON.stringify(parts));
const head = await api('GET', '/head');
if (!head || head.size !== size) { console.error(`✗ Taille dans R2 (${head && head.size}) différente du fichier (${size}).`); process.exit(1); }
await rm(stateFile);
console.log(`✓ ${key} : ${(done.size / 1e9).toFixed(2)} Go dans R2, taille vérifiée.`);
