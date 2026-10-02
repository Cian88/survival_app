/* Regression checks for offline packs, without remote requests or user storage. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Blob } from 'node:buffer';
import { TextEncoder, TextDecoder } from 'node:util';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const OsmPoints = createRequire(import.meta.url)('../js/osm-points.js');
const source = await readFile(new URL('../js/map.js', import.meta.url), 'utf8');
const exposed = source.replace('  window.SurvivalMap = {', '  window.PackTests = { boxAround, distKm, packEstimate, packTasks, downloadPack, deletePack, exportPack, importPack, getTileBlob, clearBrowseCache, CONCURRENCY, TSRC, abort() { packAbort = true; } };\n  window.SurvivalMap = {');
/* Topo.remote stands in for the remote PMTiles archives: it returns a tile, or null when the archive has none. */
function harness({ failStorage = false, online = true, missing = () => false } = {}) {
  const data = { tiles: new Map(), packs: new Map(), osm: new Map() };
  const stats = { fetches: 0, active: 0, maxActive: 0, asked: [] };
  const blob = new Blob(['tile'], { type: 'application/gzip' });
  const idb = {
    async get(store, key) { return data[store].get(key); },
    async put(store, key, value) { if (failStorage && store === 'tiles') { const e = new Error('Quota exceeded'); e.name = 'QuotaExceededError'; throw e; } data[store].set(key, value); },
    async all(store) { return [...data[store].values()]; },
    async keys(store) { return [...data[store].keys()]; },
    async del(store, key) { data[store].delete(key); },
    async putMany(store, entries) { for (const [k, v] of entries) data[store].set(k, v); },
  };
  const Topo = {
    async remote(k, c) {
      stats.fetches++; stats.asked.push([k, c.z]); stats.active++; stats.maxActive = Math.max(stats.maxActive, stats.active);
      await Promise.resolve(); stats.active--;
      return missing(k, c) ? null : blob;
    },
  };
  const context = vm.createContext({
    window: {}, document: {}, Store: { idb }, Topo, L: {}, OsmPoints,
    navigator: { onLine: online, storage: { async persist() { return true; } } },
    Blob, TextEncoder, TextDecoder, console,
  });
  vm.runInContext(exposed, context, { filename: 'map.js' });
  return { api: context.window.PackTests, data, stats, blob };
}
const key = ([src, c]) => src + '/' + c.z + '/' + c.x + '/' + c.y;

const meta = { key: 'large', name: 'Large pack', bbox: [46, 2, 47.5, 3.5], zmin: 15, zmax: 15, srcs: ['osm'] };
const large = harness();
const estimate = large.api.packEstimate(meta.bbox, meta.zmin, meta.zmax, meta.srcs);
assert.ok(estimate.n > 25000, 'Regression must exceed the former tile cap');
let lastProgress;
const downloaded = await large.api.downloadPack(meta, (...args) => { lastProgress = args; });
assert.equal(downloaded.count, estimate.n);
assert.equal(downloaded.complete, true);
assert.equal(large.data.tiles.size, estimate.n);
assert.equal(large.stats.fetches, estimate.n);
assert.ok(large.stats.maxActive <= large.api.CONCURRENCY && large.api.CONCURRENCY === 6, 'Remote reads stay bounded to 6 in parallel');
assert.deepEqual(lastProgress, [estimate.n, estimate.n, 0]);
const beforeCache = large.stats.fetches;
await large.api.downloadPack(meta);
assert.equal(large.stats.fetches, beforeCache, 'Existing tiles are reused');
console.log('PASS: ' + estimate.n + ' tiles downloaded, persisted and reused above the former cap');

const sizes = harness();
const srcs = ['osm', 'mdem'];
for (const bbox of [[45, 1, 46, 2], [60, 10, 61, 11], [-20, -40, -19, -39]]) {
  const tasks = [...sizes.api.packTasks(bbox, 0, 15, srcs)];
  const estimate = sizes.api.packEstimate(bbox, 0, 15, srcs);
  assert.equal(estimate.n, tasks.length, 'Count matches source-specific zoom coverage');
  assert.equal(estimate.mb, Math.round(tasks.reduce((kb, [src]) => kb + ({ osm: 4, mdem: 140 })[src], 0) / 1024));
  assert.equal(Math.max(...tasks.filter(([s]) => s === 'osm').map(([, c]) => c.z)), 15, 'OSM vector tiles stop at 15');
  assert.equal(Math.max(...tasks.filter(([s]) => s === 'mdem').map(([, c]) => c.z)), 12, 'Elevation tiles stop at 12');
  assert.ok(tasks.some(([, c]) => c.z === 0), 'Packs include the low zooms, so the area stays visible when zooming out offline');
}
const huge = sizes.api.packEstimate([-85, -180, 85, 180], 0, 15, srcs);
assert.ok(huge.n > 1e9, 'Huge estimates do not allocate per-tile tasks');
const lazy = sizes.api.packTasks([-85, -180, 85, 180], 0, 15, srcs);
assert.equal(typeof lazy.next, 'function');
assert.equal(lazy.next().done, false);
console.log('PASS: arithmetic estimates, per-source zoom limits and lazy generation');

const wideBox = sizes.api.boxAround(46.6, 2.5, 1000);
assert.ok(Math.abs((wideBox[0] + wideBox[2]) / 2 - 46.6) < 0.00001);
assert.ok(Math.abs((wideBox[1] + wideBox[3]) / 2 - 2.5) < 0.00001);
for (const lat of [wideBox[0], wideBox[2]]) assert.ok(Math.abs(sizes.api.distKm(46.6, 2.5, lat, 2.5) - 1000) < 2);
for (const lon of [wideBox[1], wideBox[3]]) assert.ok(Math.abs(sizes.api.distKm(46.6, 2.5, 46.6, lon) - 1000) < 15);
const wideEstimate = sizes.api.packEstimate(wideBox, 0, 15, srcs);
assert.ok(wideEstimate.n > 5e6 && Number.isFinite(wideEstimate.mb));
console.log('PASS: 1,000 km coverage (' + wideEstimate.n.toLocaleString('en') + ' tiles, ~' + Math.round(wideEstimate.mb / 1024) + ' GB) estimated without tile allocation');

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
assert.equal(await (await rendering.api.getTileBlob('osm', { z: 1, x: 1, y: 1 })).text(), 'tile', 'Display still works when storage is full');
const offline = harness({ online: false });
await assert.rejects(offline.api.downloadPack(meta), /connexion requise/);
await assert.rejects(offline.api.getTileBlob('osm', { z: 1, x: 1, y: 1 }), /hors ligne/);
assert.equal(offline.stats.fetches, 0);
console.log('PASS: storage failure is reported, rendering still works, offline download is rejected');

// Tiles absent from the archive (sea, outside coverage) are remembered as empty and count as done.
const sea = harness({ missing: (k, c) => (c.x + c.y) % 3 === 0 });
const seaMeta = { key: 'sea', name: 'Sea', bbox: [43, 4, 43.2, 4.2], zmin: 0, zmax: 15, srcs };
const seaPack = await sea.api.downloadPack(seaMeta);
assert.equal(seaPack.complete, true);
const empties = [...sea.data.tiles.values()].filter(b => b.size === 0).length;
assert.ok(empties > 0 && empties < sea.data.tiles.size);
const seaAsked = sea.stats.fetches;
await sea.api.downloadPack(seaMeta);
assert.equal(sea.stats.fetches, seaAsked, 'Empty tiles are not requested again');
console.log('PASS: tiles missing from the archive are stored as empty and not re-requested');

const overlap = harness();
const a = { key: 'a', name: 'A', bbox: [0, 0, 5, 5], zmin: 6, zmax: 15, srcs: ['mdem'] };
const b = { key: 'b', name: 'B', bbox: [2, 2, 6, 6], zmin: 7, zmax: 15, srcs: ['mdem'] };
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
for (const saved of imported.data.tiles.values()) { assert.equal(await saved.text(), 'tile'); assert.equal(saved.type, 'application/gzip', 'Compressed tiles keep their type through export/import'); }
console.log('PASS: shared-tile deletion and KSPACK export/import round trip');

const legacy = harness();
for (const old of [{ key: 'old', name: 'IGN', bbox: [46, 2, 46.2, 2.2], zmin: 6, zmax: 12, srcs: ['ign_plan', 'dem'] }, { key: 'otm', name: 'OTM', bbox: [46, 2, 46.1, 2.1], zmin: 6, zmax: 15, srcs: ['otm'] }]) {
  legacy.data.packs.set(old.key, old);
  for (const t of legacy.api.packTasks(old.bbox, old.zmin, old.zmax, old.srcs)) legacy.data.tiles.set(key(t), legacy.blob);
  assert.ok(legacy.data.tiles.size > 0);
  await assert.rejects(harness().api.importPack(await legacy.api.exportPack(old.key)), /ancienne version/);
  await legacy.api.deletePack(old.key);
  assert.equal(legacy.data.tiles.size, 0, 'Legacy IGN, relief and OpenTopoMap packs can still be deleted with their tiles');
}
console.log('PASS: legacy packs are refused on import and fully deletable');

const browse = harness();
const kept = { key: 'k', name: 'K', bbox: [46, 2, 46.1, 2.1], zmin: 10, zmax: 15, srcs };
browse.data.packs.set(kept.key, kept);
const packKeys = [...browse.api.packTasks(kept.bbox, kept.zmin, kept.zmax, kept.srcs)].map(key);
for (const k of packKeys) browse.data.tiles.set(k, browse.blob);
for (const k of ['osm/12/0/0', 'mdem/12/1/1', 'otm/13/4200/2900', 'dem/11/1/1']) browse.data.tiles.set(k, browse.blob);
assert.equal(await browse.api.clearBrowseCache(), 4);
assert.deepEqual(new Set(browse.data.tiles.keys()), new Set(packKeys));
console.log('PASS: browse cache cleared for current and legacy sources, pack tiles kept');
