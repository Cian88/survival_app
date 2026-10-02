/* Prototype : carte topographique vectorielle, hors ligne, sur les Pyrénées autour d'Andorre.
   - Fond : extrait Protomaps (OpenStreetMap vectoriel, détail 0 à 15), style Protomaps recoloré façon OpenTopoMap.
   - Relief : altitudes Mapterhorn (Terrarium, WebP 512 px), détail 0 à 12 (planète) et 13 (fichier régional).
   - Ombrage et courbes de niveau calculés sur l'appareil (MapLibre + maplibre-contour).
   Les trois fichiers sont téléchargés une fois, gardés dans IndexedDB, puis lus localement :
   c'est le fonctionnement visé pour des packs hors ligne dans l'application. */
import * as maplibregl from './lib/maplibre-gl.mjs';

const { PMTiles, Protocol } = window.pmtiles;
const $ = s => document.querySelector(s);
const BBOX = [1.30, 42.40, 2.10, 42.95]; // ouest, sud, est, nord
const FILES = [
  { key: 'osm', url: 'data/osm.pmtiles', label: 'Fond OSM vectoriel (détail 0–15)' },
  { key: 't12', url: 'data/terrain-z12.pmtiles', label: 'Altitudes ≤ détail 12 (≈ 14 m)' },
  { key: 't13', url: 'data/terrain-z13.pmtiles', label: 'Altitudes détail 13 (≈ 7 m)' },
];
const OTM_RASTER_MB = 235; // même zone, détail 6 à 15, à 35 Ko par tuile (voir js/map.js)

/* ---------- Stockage local des fichiers (IndexedDB) ---------- */
const db = new Promise((resolve, reject) => {
  const r = indexedDB.open('proto-topo', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('files');
  r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
});
const tx = (mode, fn) => db.then(d => new Promise((resolve, reject) => {
  const t = d.transaction('files', mode), req = fn(t.objectStore('files'));
  t.oncomplete = () => resolve(req && req.result); t.onerror = () => reject(t.error);
}));
const idbGet = k => tx('readonly', s => s.get(k)).catch(() => null);
const idbPut = (k, v) => tx('readwrite', s => s.put(v, k));

async function loadFile(f, onProgress) {
  const cached = await idbGet(f.key);
  if (cached) return { blob: cached, from: 'stockage local' };
  const r = await fetch(f.url);
  if (!r.ok) throw new Error(`${f.url} : HTTP ${r.status}`);
  const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), parts = [];
  let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onProgress(got, total); }
  const blob = new Blob(parts);
  try { await idbPut(f.key, blob); return { blob, from: 'téléchargé puis stocké' }; }
  catch (e) { return { blob, from: 'téléchargé (stockage local refusé : ' + e.message + ')' }; }
}

/* Source PMTiles lue dans un Blob local, sans réseau. */
class BlobSource {
  constructor(key, blob) { this.key = key; this.blob = blob; }
  getKey() { return this.key; }
  async getBytes(offset, length) { return { data: await this.blob.slice(offset, offset + length).arrayBuffer() }; }
}

/* ---------- Style façon OpenTopoMap ---------- */
function flavor() {
  const f = basemaps.namedFlavor('light');
  return Object.assign(f, {
    background: '#f4f1ea', earth: '#f4f1ea', water: '#9ec7ec',
    wood_a: '#c3dbae', wood_b: '#b5d29c', park_a: '#d4e6c3', park_b: '#c8dfb4', scrub_a: '#dfe8c8', scrub_b: '#d5e2ba', glacier: '#eef6fb',
    highway: '#e9877a', highway_casing_early: '#b9574c', highway_casing_late: '#b9574c',
    major: '#f6c97f', major_casing_early: '#b98a3e', major_casing_late: '#b98a3e',
    minor_a: '#ffffff', minor_b: '#ffffff', other: '#7a4f2e', railway: '#555555',
    landcover: Object.assign({}, f.landcover, { forest: 'rgba(190, 220, 170, 1)', grassland: 'rgba(228, 238, 208, 1)', barren: 'rgba(236, 230, 218, 1)', scrub: 'rgba(220, 232, 196, 1)', glacier: 'rgba(242, 248, 252, 1)', farmland: 'rgba(238, 240, 214, 1)' }),
  });
}

function style() {
  const layers = basemaps.layers('protomaps', flavor(), { lang: 'fr' });
  // Repères OpenTopoMap : sentiers en tirets brun foncé, ruisseaux bleus dès le détail 12, frontière violette.
  const restyle = {
    roads_other: { minzoom: 12, paint: { 'line-color': '#6b3d1e', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 14, 1, 16, 1.6], 'line-dasharray': [2, 1.5] } },
    water_stream: { minzoom: 12, paint: { 'line-color': '#3d8fd6', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 1.4] } },
    water_river: { paint: { 'line-color': '#3d8fd6', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 0, 9.5, 1, 18, 12] } },
    boundaries_country: { paint: { 'line-color': '#a03aa0', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 3], 'line-opacity': 0.6 } },
  };
  for (const l of layers) if (restyle[l.id]) Object.assign(l, restyle[l.id]);
  const at = id => layers.findIndex(l => l.id === id);
  const insertBefore = (id, ...add) => layers.splice(at(id), 0, ...add);
  insertBefore('water', {
    id: 'hillshade', type: 'hillshade', source: 'terrain',
    paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': '#4a3f2c', 'hillshade-highlight-color': '#ffffff', 'hillshade-accent-color': '#6b5a40' },
  });
  insertBefore('roads_tunnels_other_casing',
    { id: 'contours', type: 'line', source: 'contours', 'source-layer': 'contours',
      paint: { 'line-color': '#b07a4f', 'line-opacity': ['match', ['get', 'level'], 1, 0.75, 0.45], 'line-width': ['match', ['get', 'level'], 1, 1, 0.5] } });
  insertBefore('pois',
    { id: 'contour-labels', type: 'symbol', source: 'contours', 'source-layer': 'contours', filter: ['>', ['get', 'level'], 0],
      layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['number-format', ['get', 'ele'], {}], ' m'], 'text-font': ['Noto Sans Regular'], 'text-size': 10 },
      paint: { 'text-color': '#8a5a35', 'text-halo-color': '#f4f1ea', 'text-halo-width': 1.2 } },
    { id: 'peaks', type: 'symbol', source: 'protomaps', 'source-layer': 'pois', minzoom: 11,
      filter: ['in', ['get', 'kind'], ['literal', ['peak', 'volcano']]],
      layout: { 'icon-image': 'peak', 'icon-size': 0.8,
        'text-field': ['concat', ['coalesce', ['get', 'name:fr'], ['get', 'name'], ''], ['case', ['has', 'elevation'], ['concat', '\n', ['to-string', ['round', ['to-number', ['get', 'elevation']]]], ' m'], '']],
        'text-font': ['Noto Sans Medium'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 0.7], 'text-optional': true },
      paint: { 'text-color': '#4a3524', 'text-halo-color': '#f4f1ea', 'text-halo-width': 1.4 } });
  layers.push({ id: 'otm-ref', type: 'raster', source: 'otm', layout: { visibility: 'none' } });
  return {
    version: 8,
    glyphs: './assets/fonts/{fontstack}/{range}.pbf',
    sprite: new URL('./assets/sprites/light', location.href).href,
    sources: {
      protomaps: { type: 'vector', url: 'pmtiles://osm', attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org/copyright">contributeurs OpenStreetMap</a>' },
      terrain: { type: 'raster-dem', tiles: ['terrain://{z}/{x}/{y}'], tileSize: 512, encoding: 'terrarium', maxzoom: 13, bounds: BBOX, attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>' },
      contours: { type: 'vector', tiles: [contourUrl], maxzoom: 15, bounds: BBOX },
      otm: { type: 'raster', tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 17, attribution: '© OpenTopoMap (CC-BY-SA)' },
    },
    layers,
  };
}

/* ---------- Démarrage ---------- */
let contourUrl;
async function start() {
  const st = $('#status'), archives = {}, sizes = {};
  for (const f of FILES) {
    const { blob, from } = await loadFile(f, (g, t) => { st.textContent = `${f.label} : ${(g / 1048576).toFixed(0)}${t ? ' / ' + (t / 1048576).toFixed(0) : ''} Mo…`; });
    archives[f.key] = new PMTiles(new BlobSource(f.key, blob)); sizes[f.key] = { mb: blob.size / 1048576, from };
  }
  const total = Object.values(sizes).reduce((a, s) => a + s.mb, 0);
  $('#sizes').innerHTML = FILES.map(f => `<tr><td>${f.label}</td><td>${sizes[f.key].mb.toFixed(0)} Mo</td></tr>`).join('')
    + `<tr><td><b>Total du pack</b></td><td><b>${total.toFixed(0)} Mo</b></td></tr><tr><td class="muted">Même zone en images OpenTopoMap (détail 6–15)</td><td class="muted">≈ ${OTM_RASTER_MB} Mo</td></tr>`;
  st.textContent = 'Fichiers : ' + [...new Set(Object.values(sizes).map(s => s.from))].join(', ') + '. Aucune requête réseau pour la carte.';

  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  protocol.add(archives.osm);

  // Altitudes : détail ≤ 12 dans l'extrait planète, détail 13 dans le fichier régional.
  const terrainTile = async (z, x, y, signal) => {
    const r = await (z >= 13 ? archives.t13 : archives.t12).getZxy(z, x, y, signal);
    if (!r) throw new Error(`pas d'altitude pour ${z}/${x}/${y}`);
    return r.data;
  };
  const zxy = url => url.replace(/^terrain:\/\//, '').split('/').map(Number);
  maplibregl.addProtocol('terrain', async (params, ac) => ({ data: await terrainTile(...zxy(params.url), ac.signal) }));

  // Courbes de niveau : maplibre-contour lit les mêmes altitudes (lecteur local au lieu de fetch).
  const dem = new mlcontour.DemSource({ url: 'terrain://{z}/{x}/{y}', encoding: 'terrarium', maxzoom: 13, worker: false, cacheSize: 200 });
  dem.manager.getTile = async (url, ac) => ({ data: new Blob([await terrainTile(...zxy(url), ac.signal)], { type: 'image/webp' }) });
  dem.setupMaplibre(maplibregl);
  contourUrl = dem.contourProtocolUrl({
    thresholds: { 9: [200, 1000], 10: [100, 500], 11: [50, 250], 12: [50, 250], 13: [20, 100], 14: [20, 100], 15: [10, 50] },
    contourLayer: 'contours', elevationKey: 'ele', levelKey: 'level', extent: 4096, buffer: 1,
  });

  const map = new maplibregl.Map({
    container: 'map', style: style(), center: [1.65, 42.72], zoom: 11.5, minZoom: 8, maxZoom: 16.9,
    maxBounds: [[BBOX[0] - 0.15, BBOX[1] - 0.1], [BBOX[2] + 0.15, BBOX[3] + 0.1]], attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  const showZoom = () => { $('#zoom').textContent = `Détail ${map.getZoom().toFixed(1)} · ${map.getCenter().lat.toFixed(4)}, ${map.getCenter().lng.toFixed(4)}`; };
  map.on('move', showZoom); showZoom();
  window.protoMap = map; // pour les vérifications automatiques

  const toggle = (btn, ids, on) => { btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); ids.forEach(id => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')); };
  $('#btnOtm').onclick = e => toggle(e.currentTarget, ['otm-ref'], !e.currentTarget.classList.contains('on'));
  $('#btnShade').onclick = e => toggle(e.currentTarget, ['hillshade'], !e.currentTarget.classList.contains('on'));
  $('#btnContours').onclick = e => toggle(e.currentTarget, ['contours', 'contour-labels'], !e.currentTarget.classList.contains('on'));
  $('#btnClear').onclick = async () => { await tx('readwrite', s => s.clear()); location.reload(); };
}

if (matchMedia('(max-width: 600px)').matches) $('details.panel').open = false; // carte d'abord sur téléphone
start().catch(e => { $('#status').textContent = 'Erreur : ' + e.message; console.error(e); });
