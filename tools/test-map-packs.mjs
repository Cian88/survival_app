/* Regression checks for offline packs, without remote requests or user storage. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Blob } from 'node:buffer';
import { TextEncoder, TextDecoder } from 'node:util';
import vm from 'node:vm';
const source = await readFile(new URL('../js/map.js', import.meta.url), 'utf8');
const exposed = source.replace('  window.SurvivalMap = {', '  window.PackTests = { packEstimate, packTasks, downloadPack, deletePack, exportPack, importPack, getTileBlob, abort() { packAbort = true; } };\n  window.SurvivalMap = {');
function harness({ failStorage = false, online = true } = {}) {
  const data = { tiles: new Map(), packs: new Map(), osm: new Map() };
  const stats = { fetches: 0, active: 0, maxActive: 0 };
  const blob = new Blob(['tile'], { type: 'image/png' });
  const idb = {
    async get(store, key) { return data[store].get(key); },
    async put(store, key, value) { if (failStorage && store === 'tiles') { const e = new Error('Quota exceeded'); e.name = 'QuotaExceededError'; throw e; } data[store].set(key, value); },
    async all(store) { return [...data[store].values()]; },
    async del(store, key) { data[store].delete(key); },
    async putMany(store, entries) { for (const [k, v] of entries) data[store].set(k, v); },
  };
  const context = vm.createContext({
    window: {}, document: {}, Store: { idb },
    L: { TileLayer: { extend() {} }, GridLayer: { extend() {} } },
    navigator: { onLine: online, storage: { async persist() { return true; } } },
    Blob, TextEncoder, TextDecoder, console,
    async fetch() { stats.fetches++; stats.active++; stats.maxActive = Math.max(stats.maxActive, stats.active); await Promise.resolve(); stats.active--; return { ok: true, async blob() { return blob; } }; },
  });
  vm.runInContext(exposed, context, { filename: 'map.js' });
  return { api: context.window.PackTests, data, stats, blob };
}
const meta = { key: 'large', name: 'Large pack', bbox: [46, 2, 47, 3], zmin: 16, zmax: 16, srcs: ['ign_plan'] };
const large = harness();
const estimate = large.api.packEstimate(meta.bbox, meta.zmin, meta.zmax, meta.srcs);
assert.ok(estimate.n > 25000, 'Regression must exceed the former tile cap');
let lastProgress;
const downloaded = await large.api.downloadPack(meta, (...args) => { lastProgress = args; });
assert.equal(downloaded.count, estimate.n);
assert.equal(downloaded.complete, true);
assert.equal(large.data.tiles.size, estimate.n);
assert.equal(large.stats.fetches, estimate.n);
assert.ok(large.stats.maxActive <= 6, 'Large packs keep request concurrency bounded');
assert.deepEqual(lastProgress, [estimate.n, estimate.n, 0]);
const beforeCache = large.stats.fetches;
await large.api.downloadPack(meta);
assert.equal(large.stats.fetches, beforeCache, 'Existing tiles are reused');
console.log('PASS: ' + estimate.n + ' tiles downloaded, persisted and reused above the former cap');

const sizes = harness();
for (const bbox of [[45, 1, 46, 2], [60, 10, 61, 11], [-20, -40, -19, -39]]) {
  const srcs = ['ign_plan', 'ign_shad', 'dem'];
  const tasks = [...sizes.api.packTasks(bbox, 6, 14, srcs)];
  const estimate = sizes.api.packEstimate(bbox, 6, 14, srcs);
  assert.equal(estimate.n, tasks.length, 'Count matches source-specific zoom coverage');
  assert.equal(estimate.mb, Math.round(tasks.reduce((kb, [src]) => kb + ({ ign_plan: 60, ign_shad: 20, dem: 60 })[src], 0) / 1024));
}
const huge = sizes.api.packEstimate([-85, -180, 85, 180], 6, 16, ['ign_plan', 'dem']);
assert.ok(huge.n > 1e9, 'Huge estimates do not allocate per-tile tasks');
const lazy = sizes.api.packTasks([-85, -180, 85, 180], 6, 16, ['ign_plan', 'dem']);
assert.equal(typeof lazy.next, 'function');
assert.equal(lazy.next().done, false);
console.log('PASS: arithmetic estimates, source zoom limits and lazy generation');

const interrupted = harness();
const partial = await interrupted.api.downloadPack(meta, done => { if (done >= 20) interrupted.api.abort(); });
assert.equal(partial.complete, false);
assert.ok(partial.count >= 20 && partial.count < estimate.n);
const previousFetches = interrupted.stats.fetches;
const resumed = await interrupted.api.downloadPack(meta);
assert.equal(resumed.count, estimate.n);
assert.equal(resumed.complete, true);
assert.equal(interrupted.stats.fetches - previousFetches, estimate.n - partial.count);
console.log('PASS: cancellation and completion using previously saved tiles');

const quota = harness({ failStorage: true });
await assert.rejects(quota.api.downloadPack(meta), { name: 'TileStorageError' });
assert.ok(quota.stats.fetches <= 6, 'Storage failure stops scheduling further requests');
assert.equal(quota.data.tiles.size, 0);
assert.equal(quota.data.packs.get(meta.key).count, 0);
assert.equal(quota.data.packs.get(meta.key).complete, false);
const rendering = harness({ failStorage: true });
await rendering.api.getTileBlob('ign_plan', 'mock/{z}/{x}/{y}', { z: 1, x: 1, y: 1 });
const offline = harness({ online: false });
await assert.rejects(offline.api.downloadPack(meta), /connexion requise/);
assert.equal(offline.stats.fetches, 0);
console.log('PASS: storage failure is reported, rendering still works, offline download is rejected');

const overlap = harness();
const a = { key: 'a', name: 'A', bbox: [0, 0, 5, 5], zmin: 6, zmax: 8, srcs: ['ign_plan', 'dem'] };
const b = { key: 'b', name: 'B', bbox: [2, 2, 6, 6], zmin: 7, zmax: 8, srcs: ['ign_plan'] };
const key = ([src, c]) => src + '/' + c.z + '/' + c.x + '/' + c.y;
for (const p of [a, b]) { overlap.data.packs.set(p.key, p); for (const t of overlap.api.packTasks(p.bbox, p.zmin, p.zmax, p.srcs)) overlap.data.tiles.set(key(t), overlap.blob); }
const remaining = new Set([...overlap.api.packTasks(b.bbox, b.zmin, b.zmax, b.srcs)].map(key));
await overlap.api.deletePack(a.key);
assert.equal(overlap.data.packs.has(a.key), false);
assert.deepEqual(new Set(overlap.data.tiles.keys()), remaining, 'Deleting a pack preserves all tiles shared with remaining packs');
const exported = await overlap.api.exportPack(b.key);
const imported = harness();
await imported.api.importPack(exported);
assert.deepEqual(new Set(imported.data.tiles.keys()), remaining);
assert.equal(imported.data.packs.get(b.key).name, b.name);
for (const saved of imported.data.tiles.values()) assert.equal(await saved.text(), 'tile');
console.log('PASS: shared-tile deletion and KSPACK export/import round trip');
