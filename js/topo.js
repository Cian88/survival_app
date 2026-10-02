/* Fond topographique vectoriel, dessiné sur l'appareil (MapLibre GL dans Leaflet).
   - osm : fond OpenStreetMap au format Protomaps (fichier PMTiles, KS_CONFIG.map.osm).
   - mdem : altitudes Mapterhorn (Terrarium, WebP 512 px, détail 0–12) pour l'ombrage et les courbes de niveau.
   Les tuiles passent toutes par getTile(source, {z, x, y}) fourni par js/map.js : packs hors ligne et cache
   (IndexedDB) d'abord, puis lecture partielle du fichier PMTiles distant si la connexion le permet. */
(function () {
  const CFG = (window.KS_CONFIG && window.KS_CONFIG.map) || {};
  // Avant d'héberger le fond OSM (docs/TUILES.md), on peut tester avec un fichier local : localStorage['holdout.dev.osm'].
  const devOsm = () => { try { return localStorage.getItem('holdout.dev.osm') || ''; } catch (e) { return ''; } };
  const URLS = { osm: CFG.osm || devOsm(), mdem: CFG.terrain || 'https://download.mapterhorn.com/planet.pmtiles' };
  const ATTR = {
    osm: '<a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a>',
    mdem: 'Relief : <a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">© Mapterhorn</a> (IGN, CNIG, Copernicus…)',
  };

  /* ---------- Fichiers PMTiles distants ---------- */
  // Décompression neutre : on garde les octets tels qu'ils sont dans l'archive (gzip pour le fond OSM),
  // ce qui divise par deux la place des packs ; la décompression se fait à l'affichage.
  const raw = buf => Promise.resolve(buf);
  const archives = {};
  function archive(k) {
    if (!URLS[k]) throw new Error('fond de carte non configuré');
    return archives[k] || (archives[k] = new pmtiles.PMTiles(URLS[k], undefined, raw));
  }
  /* Tuile distante : Blob (type application/gzip si compressée), ou null si l'archive n'a pas cette tuile. */
  async function remote(k, c, signal) {
    const a = archive(k), h = await a.getHeader(), r = await a.getZxy(c.z, c.x, c.y, signal);
    if (!r) return null;
    return new Blob([r.data], { type: h.tileCompression === 2 ? 'application/gzip' : k === 'mdem' ? 'image/webp' : 'application/x-protobuf' });
  }
  async function bytes(blob) {
    if (blob.type !== 'application/gzip') return blob.arrayBuffer();
    return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  }

  /* ---------- Style façon OpenTopoMap ---------- */
  function flavor() {
    const f = basemaps.namedFlavor('light');
    return Object.assign(f, {
      background: 'rgba(0,0,0,0)', earth: '#f4f1ea', water: '#9ec7ec',
      wood_a: '#c3dbae', wood_b: '#b5d29c', park_a: '#d4e6c3', park_b: '#c8dfb4', scrub_a: '#dfe8c8', scrub_b: '#d5e2ba', glacier: '#eef6fb',
      highway: '#e9877a', highway_casing_early: '#b9574c', highway_casing_late: '#b9574c',
      major: '#f6c97f', major_casing_early: '#b98a3e', major_casing_late: '#b98a3e',
      minor_a: '#ffffff', minor_b: '#ffffff', railway: '#555555',
      landcover: Object.assign({}, f.landcover, { forest: 'rgba(190, 220, 170, 1)', grassland: 'rgba(228, 238, 208, 1)', barren: 'rgba(236, 230, 218, 1)', scrub: 'rgba(220, 232, 196, 1)', glacier: 'rgba(242, 248, 252, 1)', farmland: 'rgba(238, 240, 214, 1)' }),
    });
  }
  // Repères OpenTopoMap : sentiers en tirets brun foncé, ruisseaux bleus dès le détail 12, frontière violette.
  const RESTYLE = {
    roads_other: { minzoom: 12, paint: { 'line-color': '#6b3d1e', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 14, 1, 16, 1.6], 'line-dasharray': [2, 1.5] } },
    water_stream: { minzoom: 12, paint: { 'line-color': '#3d8fd6', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 1.4] } },
    water_river: { paint: { 'line-color': '#3d8fd6', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 0, 9.5, 1, 18, 12] } },
    boundaries_country: { paint: { 'line-color': '#a03aa0', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.2, 14, 3], 'line-opacity': 0.6 } },
  };
  function style(contourUrl) {
    const layers = basemaps.layers('osm', flavor(), { lang: 'fr' });
    for (const l of layers) if (RESTYLE[l.id]) Object.assign(l, RESTYLE[l.id]);
    const insertBefore = (id, ...add) => layers.splice(layers.findIndex(l => l.id === id), 0, ...add);
    insertBefore('water', { id: 'hillshade', type: 'hillshade', source: 'mdem',
      paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': '#4a3f2c', 'hillshade-highlight-color': '#ffffff', 'hillshade-accent-color': '#6b5a40' } });
    insertBefore('roads_tunnels_other_casing', { id: 'contours', type: 'line', source: 'contours', 'source-layer': 'contours',
      paint: { 'line-color': '#b07a4f', 'line-opacity': ['match', ['get', 'level'], 1, 0.75, 0.45], 'line-width': ['match', ['get', 'level'], 1, 1, 0.5] } });
    insertBefore('pois',
      { id: 'contour-labels', type: 'symbol', source: 'contours', 'source-layer': 'contours', filter: ['>', ['get', 'level'], 0],
        layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['number-format', ['get', 'ele'], {}], ' m'], 'text-font': ['Noto Sans Regular'], 'text-size': 10 },
        paint: { 'text-color': '#8a5a35', 'text-halo-color': '#f4f1ea', 'text-halo-width': 1.2 } },
      { id: 'peaks', type: 'symbol', source: 'osm', 'source-layer': 'pois', minzoom: 10, filter: ['in', ['get', 'kind'], ['literal', ['peak', 'volcano']]],
        layout: { 'icon-image': 'peak', 'icon-size': 0.8, 'text-optional': true, 'text-font': ['Noto Sans Medium'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 0.7],
          'text-field': ['concat', ['coalesce', ['get', 'name:fr'], ['get', 'name'], ''], ['case', ['has', 'elevation'], ['concat', '\n', ['to-string', ['round', ['to-number', ['get', 'elevation']]]], ' m'], '']] },
        paint: { 'text-color': '#4a3524', 'text-halo-color': '#f4f1ea', 'text-halo-width': 1.4 } });
    const base = new URL('assets/map/', document.baseURI).href;
    return {
      version: 8, glyphs: base + 'fonts/{fontstack}/{range}.pbf', sprite: base + 'sprites/light',
      sources: {
        osm: { type: 'vector', tiles: ['ks://osm/{z}/{x}/{y}'], maxzoom: 15, attribution: ATTR.osm },
        mdem: { type: 'raster-dem', tiles: ['ks://mdem/{z}/{x}/{y}'], tileSize: 512, maxzoom: 12, encoding: 'terrarium', attribution: ATTR.mdem },
        contours: { type: 'vector', tiles: [contourUrl], maxzoom: 15 },
      },
      layers,
    };
  }

  /* ---------- Couche Leaflet ---------- */
  // Courbes : équidistance par niveau de détail MapLibre (= niveau Leaflet − 1) : [courbe, courbe maîtresse].
  const THRESHOLDS = { 8: [200, 1000], 9: [200, 1000], 10: [100, 500], 11: [50, 250], 12: [20, 100], 13: [20, 100], 14: [10, 50], 15: [10, 50] };
  let contourUrl = null;
  function setup(getTile) {
    if (contourUrl) return;
    const parse = url => { const m = /^ks:\/\/(\w+)\/(\d+)\/(\d+)\/(\d+)/.exec(url); return [m[1], { z: +m[2], x: +m[3], y: +m[4] }]; };
    maplibregl.addProtocol('ks', async params => {
      const [k, c] = parse(params.url), b = await getTile(k, c);
      if (b && b.size) return { data: await bytes(b) };
      if (k === 'mdem') throw new Error('altitude absente');
      return { data: new ArrayBuffer(0) }; // tuile de fond vide (mer, hors de l'archive) ; MapLibre transfère chaque tampon à son worker
    });
    const dem = new mlcontour.DemSource({ url: 'ks://mdem/{z}/{x}/{y}', encoding: 'terrarium', maxzoom: 12, worker: false, cacheSize: 200 });
    // maplibre-contour n'a pas d'option publique pour lire les tuiles autrement que par fetch (testé avec la 0.1.1).
    dem.manager.getTile = async url => {
      const [k, c] = parse(url), b = await getTile(k, c);
      if (!b || !b.size) throw new Error('altitude absente');
      return { data: b };
    };
    dem.setupMaplibre(maplibregl);
    contourUrl = dem.contourProtocolUrl({ thresholds: THRESHOLDS, contourLayer: 'contours', elevationKey: 'ele', levelKey: 'level', extent: 4096, buffer: 1 });
  }
  const QUIET = /hors ligne|non configuré|absente|HTTP 404|AbortError|aborted/i;
  function layer(getTile) {
    setup(getTile);
    const l = L.maplibreGL({ style: style(contourUrl), maxZoom: 17, fadeDuration: 0 });
    l.on('add', () => {
      const gl = l.getMaplibreMap();
      // Les tuiles absentes hors ligne sont normales : seul le reste est signalé.
      if (!gl) return;
      gl.on('error', e => { const m = (e && e.error && e.error.message) || ''; if (!QUIET.test(m)) console.warn('Carte :', m); });
      // Icône absente du jeu Protomaps (ex. « townhall ») : image vide plutôt qu'un avertissement.
      gl.on('styleimagemissing', e => { if (!gl.hasImage(e.id)) gl.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) }); });
    });
    return l;
  }

  window.Topo = { URLS, ATTR, remote, layer, configured: k => !!URLS[k] };
})();
