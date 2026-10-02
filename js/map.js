/* Carte topographique Europe, utilisable hors ligne.
   Couches :
   - Relief Europe intégré (image pré-calculée depuis les tuiles d'altitude Terrarium, 100 % hors ligne)
   - Fond vectoriel intégré (Natural Earth : pays, frontières, fleuves, lacs, routes, villes)
   - Relief MNT détaillé (tuiles Terrarium AWS Open Data, téléchargeables par zone et stockées dans IndexedDB)
   - OpenTopoMap (en ligne ; seules les tuiles consultées sont gardées en cache, pas de téléchargement de masse)
   - Fichier PMTiles local (extrait Protomaps / OSM importé par l'utilisateur)
   - Points d'intérêt : nucléaire, barrages, centrales (intégrés) + points OSM téléchargés par zone + mes points */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const idb = Store.idb;

  const TERRARIUM = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';
  const OTM = 'https://tile.opentopomap.org/{z}/{x}/{y}.png';
  const IGN = (layer, style) => `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=${style}&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}`;
  const ATTR_IGN = 'Carte : © <a href="https://cartes.gouv.fr" target="_blank" rel="noopener">IGN – Géoplateforme</a> (Licence Ouverte Etalab 2.0)';
  /* Sources téléchargeables en « pack » hors ligne. kb = taille moyenne estimée d'une tuile. */
  const TSRC = {
    ign_plan: { tpl: IGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'normal'), kb: 60, max: 19, label: 'IGN Plan topographique (France : routes, chemins, courbes de niveau, toponymes)' },
    ign_shad: { tpl: IGN('ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW', 'estompage_grayscale'), kb: 20, max: 15, label: 'IGN Estompage du relief (France)' },
    dem: { tpl: TERRARIUM, kb: 60, max: 13, label: 'Relief et altitudes (toute l\'Europe)' },
  };
  const OVERPASS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ];
  const RELIEF_BOUNDS = [[31.952162238024968, -25.3125], [72.3957057065326, 47.8125]]; // emprise de l'image z7 (tuiles x 55–80, y 26–51)
  const ATTR_DEM = 'Altitude : <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles (Mapzen/AWS)</a> — EU-DEM Copernicus, SRTM/GMTED USGS, ETOPO1 NOAA, © Kartverket, © Environment Agency…';
  const ATTR_NE = 'Fond : <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a> (domaine public)';

  const OSM_CATS = {
    eau: { label: 'Eau (fontaines, sources, puits, points d\'eau)', color: '#1f78d1', q: ['node["amenity"="drinking_water"]', 'node["natural"="spring"]', 'nwr["man_made"="water_well"]', 'nwr["amenity"="water_point"]', 'node["man_made"="water_tap"]', 'nwr["man_made"="water_tower"]'] },
    sante: { label: 'Santé (hôpitaux, pharmacies, médecins, défibrillateurs)', color: '#d62728', q: ['nwr["amenity"~"^(hospital|clinic|pharmacy|doctors)$"]', 'node["emergency"="defibrillator"]'] },
    secours: { label: 'Secours & abris (pompiers, police, mairies, refuges, points de rassemblement)', color: '#9467bd', q: ['nwr["amenity"~"^(police|fire_station|townhall)$"]', 'nwr["amenity"="shelter"]["shelter_type"!~"^(public_transport|picnic_shelter)$"]', 'nwr["emergency"="assembly_point"]', 'nwr["tourism"~"^(alpine_hut|wilderness_hut)$"]'] },
    energie: { label: 'Énergie (centrales, postes électriques HT, stations-service)', color: '#e6a100', q: ['nwr["power"="plant"]', 'nwr["power"="substation"]["substation"!~"^(minor_distribution|distribution)$"]', 'nwr["amenity"="fuel"]'] },
    dangers: { label: 'Dangers (industrie chimique/pétrolière, dépôts, zones militaires, barrages)', color: '#111111', q: ['nwr["industrial"~"^(refinery|chemical|oil|gas|fuel)$"]', 'nwr["man_made"="storage_tank"]["content"~"oil|gas|fuel|chemical|petroleum"]', 'nwr["landuse"="military"]', 'nwr["hazard"]', 'nwr["waterway"="dam"]'] },
    ravito: { label: 'Ravitaillement (supermarchés, quincailleries, marchés)', color: '#2ca02c', q: ['nwr["shop"~"^(supermarket|convenience|hardware|doityourself|outdoor)$"]', 'nwr["amenity"="marketplace"]'] },
  };
  const MY_TYPES = {
    rdv: { label: 'Point de rendez-vous', color: '#ff7f0e' },
    base: { label: 'Base / refuge', color: '#8c564b' },
    cache: { label: 'Cache de matériel', color: '#7f7f7f' },
    eau: { label: 'Point d\'eau vérifié', color: '#1f78d1' },
    danger: { label: 'Danger / à éviter', color: '#000000' },
    itineraire: { label: 'Étape d\'itinéraire', color: '#17becf' },
    autre: { label: 'Autre', color: '#e377c2' },
  };

  let rings = null, map, ctrl, layers = {}, osmGroups = {}, myLayer, nucLayer, measure = null, addMode = false, pmLayer = null;

  /* ---------- Tuiles avec cache IndexedDB ---------- */
  function tileUrl(tpl, c) { return tpl.replace('{z}', c.z).replace('{x}', c.x).replace('{y}', c.y); }
  async function getTileBlob(prefix, tpl, c, allowNet = true, requireStorage = false) {
    const key = `${prefix}/${c.z}/${c.x}/${c.y}`;
    const storageFailure = cause => {
      const err = new Error('Stockage local indisponible ou plein : libérez de l’espace sur cet appareil.', { cause });
      err.name = 'TileStorageError';
      return err;
    };
    try { const b = await idb.get('tiles', key); if (b) return b; } catch (e) { if (requireStorage) throw storageFailure(e); }
    if (!allowNet || !navigator.onLine) throw new Error('hors ligne');
    const r = await fetch(tileUrl(tpl, c), { mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob();
    try { await idb.put('tiles', key, b); } catch (e) { if (requireStorage) throw storageFailure(e); }
    return b;
  }

  /* Couche tuilée « cache d'abord » : tuiles des packs hors ligne, puis réseau si disponible.
     Hors ligne, si un zoom n'a pas été téléchargé, on agrandit la tuile parente la plus proche. */
  const CachedTiles = L.TileLayer.extend({
    createTile(coords, done) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const ctx = cv.getContext('2d'), prefix = this.options.prefix, url = this._url;
      const draw = (b, dz) => createImageBitmap(b).then(bmp => {
        if (!dz) ctx.drawImage(bmp, 0, 0, 256, 256);
        else { const k = 1 << dz, sz = 256 / k; ctx.drawImage(bmp, (coords.x & (k - 1)) * sz, (coords.y & (k - 1)) * sz, sz, sz, 0, 0, 256, 256); }
        done(null, cv);
      }).catch(e => done(e, cv));
      getTileBlob(prefix, url, coords, true).then(b => draw(b, 0)).catch(async err => {
        for (let dz = 1; dz <= 6 && coords.z - dz >= 0; dz++) {
          try { const b = await getTileBlob(prefix, url, { z: coords.z - dz, x: coords.x >> dz, y: coords.y >> dz }, false); return draw(b, dz); } catch (e) { }
        }
        done(err, cv);
      });
      return cv;
    },
  });

  /* Relief ombré calculé à partir des altitudes Terrarium */
  function decode(data) {
    const n = data.length / 4, e = new Float32Array(n);
    for (let i = 0; i < n; i++) e[i] = data[i * 4] * 256 + data[i * 4 + 1] + data[i * 4 + 2] / 256 - 32768;
    return e;
  }
  const STOPS = [[-6000, [150, 180, 210]], [-200, [185, 210, 230]], [-0.5, [200, 222, 238]], [0, [172, 204, 146]], [200, [206, 222, 160]], [500, [232, 222, 164]], [1000, [214, 184, 128]], [1800, [184, 146, 108]], [2800, [222, 214, 206]], [4000, [250, 250, 250]]];
  function tint(h) {
    if (h <= STOPS[0][0]) return STOPS[0][1];
    for (let i = 1; i < STOPS.length; i++) {
      if (h <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], t = (h - a) / (b - a);
        return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t];
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  function renderRelief(canvas, elev, z, y) {
    const ctx = canvas.getContext('2d'), out = ctx.createImageData(256, 256), d = out.data;
    const n = Math.pow(2, z), lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 0.5) / n)));
    const res = 156543.03392 * Math.cos(lat) / n, zf = z < 9 ? 3 : z < 12 ? 2 : 1.5;
    const zen = Math.PI / 4, az = 135 * Math.PI / 180, cz = Math.cos(zen), sz = Math.sin(zen);
    for (let r = 0; r < 256; r++) for (let c = 0; c < 256; c++) {
      const i = r * 256 + c, h = elev[i];
      const l = elev[r * 256 + Math.max(c - 1, 0)], rr = elev[r * 256 + Math.min(c + 1, 255)];
      const u = elev[Math.max(r - 1, 0) * 256 + c], dn = elev[Math.min(r + 1, 255) * 256 + c];
      const dx = (rr - l) / (2 * res), dy = (dn - u) / (2 * res);
      const slope = Math.atan(zf * Math.hypot(dx, dy)), aspect = Math.atan2(dy, -dx);
      const sh = Math.max(0, cz * Math.cos(slope) + sz * Math.sin(slope) * Math.cos(az - aspect));
      const col = tint(h), f = h <= 0 ? 1 : 0.45 + 0.65 * sh;
      d[i * 4] = Math.min(255, col[0] * f); d[i * 4 + 1] = Math.min(255, col[1] * f); d[i * 4 + 2] = Math.min(255, col[2] * f); d[i * 4 + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }
  async function blobToElev(b) {
    const bmp = await createImageBitmap(b);
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bmp, 0, 0);
    return decode(cx.getImageData(0, 0, 256, 256).data);
  }
  const ReliefLayer = L.GridLayer.extend({
    createTile(coords, done) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      getTileBlob('dem', TERRARIUM, coords, this.options.online !== false)
        .then(blobToElev).then(e => { renderRelief(cv, e, coords.z, coords.y); done(null, cv); })
        .catch(err => done(err, cv));
      return cv;
    },
  });

  /* Altitude d'un point (utilise le cache puis le réseau) */
  async function elevationAt(latlng) {
    const z = 11, n = Math.pow(2, z);
    const xf = (latlng.lng + 180) / 360 * n, lr = latlng.lat * Math.PI / 180;
    const yf = (1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n;
    for (const zz of [11, 10, 9, 8, 7, 6]) {
      const k = Math.pow(2, z - zz), x = Math.floor(xf / k), y = Math.floor(yf / k);
      try {
        const b = await getTileBlob('dem', TERRARIUM, { z: zz, x, y }, zz === 11);
        const e = await blobToElev(b);
        const px = Math.min(255, Math.floor((xf / k - x) * 256)), py = Math.min(255, Math.floor((yf / k - y) * 256));
        return { h: Math.round(e[py * 256 + px]), z: zz };
      } catch (err) { /* essayer un niveau plus grossier */ }
    }
    return null;
  }

  /* ---------- Fond vectoriel intégré ---------- */
  function buildBase() {
    const B = window.BASE_EUROPE;
    const g = L.layerGroup();
    // Données généralisées (Natural Earth) : utiles jusqu'au zoom 10, masquées au-delà pour ne pas brouiller les cartes détaillées.
    const coarse = [
      L.geoJSON(B.lakes, { pane: 'vec', interactive: false, style: { color: '#4f8fc4', weight: 0.6, fillColor: '#a9cbe6', fillOpacity: 0.9 } }),
      L.geoJSON(B.rivers, { pane: 'vec', interactive: false, style: f => ({ color: '#3b82c4', weight: f.properties.scalerank <= 3 ? 1.6 : f.properties.scalerank <= 6 ? 1 : 0.6, opacity: 0.85 }) }),
      L.geoJSON(B.boundaries, { pane: 'vec', interactive: false, style: { color: '#7a3b69', weight: 1.2, dashArray: '4 3', opacity: 0.8 } }),
    ];
    const roads = L.geoJSON(B.roads, { pane: 'vec', interactive: false, style: f => ({ color: '#b5462f', weight: f.properties.type === 'Major Highway' ? 1.4 : 0.8, opacity: 0.75 }) });
    const places = L.layerGroup();
    function refresh() {
      const z = map.getZoom(), minPop = z < 5 ? 2e6 : z < 6 ? 5e5 : z < 7 ? 1.5e5 : 0;
      places.clearLayers();
      coarse.forEach(l => { if (z <= 10) { if (!g.hasLayer(l)) g.addLayer(l); } else if (g.hasLayer(l)) g.removeLayer(l); });
      if (z >= 6 && z <= 10) { if (!g.hasLayer(roads)) g.addLayer(roads); } else if (g.hasLayer(roads)) g.removeLayer(roads);
      if (z > 10) return;
      const b = map.getBounds().pad(0.2);
      for (const f of B.places.features) {
        const p = f.properties, [lon, lat] = f.geometry.coordinates;
        if ((p.pop_max || 0) < minPop || !b.contains([lat, lon])) continue;
        L.circleMarker([lat, lon], { pane: 'vec', radius: p.pop_max > 1e6 ? 3.5 : 2.5, color: '#222', weight: 1, fillColor: '#fff', fillOpacity: 1, interactive: false })
          .bindTooltip(esc(p.name), { permanent: true, direction: 'right', className: 'place-label', offset: [4, 0] }).addTo(places);
      }
    }
    g.addLayer(places);
    g.on('add', () => { map.on('zoomend moveend', refresh); refresh(); });
    g.on('remove', () => map.off('zoomend moveend', refresh));
    return g;
  }
  function buildCountries() {
    return L.layerGroup([
      L.geoJSON(window.BASE_EUROPE.countries, { pane: 'basevec', interactive: false, style: { color: '#9a9a8a', weight: 0.8, fillColor: '#efeadb', fillOpacity: 1 } }),
    ]);
  }

  /* ---------- Points intégrés : nucléaire, barrages, centrales ---------- */
  function nucRadiusKm() { return +(App.state.map && App.state.map.nucKm) || 20; }
  function buildNuclear() {
    const g = L.layerGroup();
    const skip = /annulé|abandonné|projet/i;
    for (const p of POI_EUROPE.nuclear) {
      if (p.state && skip.test(p.state) && !/construction/.test(p.state)) continue;
      const active = p.state && /fonctionnement|construction/.test(p.state);
      const color = active ? '#d40000' : p.state ? '#8a6d00' : '#e05a00';
      const pop = `<b>☢ ${esc(p.name)}</b><br>${esc(p.country)}<br>Statut (Wikidata) : ${esc(p.state || 'non renseigné')}${p.cap ? `<br>Puissance : ${p.cap} MW` : ''}${p.start ? `<br>Mise en service : ${p.start}` : ''}${p.end ? `<br>Fin : ${p.end}` : ''}<br><a href="https://www.wikidata.org/wiki/${p.id}" target="_blank" rel="noopener">Fiche Wikidata</a>`;
      L.circle([p.lat, p.lon], { radius: nucRadiusKm() * 1000, color, weight: 1, fillOpacity: 0.06, dashArray: '5 4', interactive: false }).addTo(g);
      L.circleMarker([p.lat, p.lon], { radius: 6, color: '#000', weight: 1, fillColor: color, fillOpacity: 1 }).bindPopup(pop).addTo(g);
    }
    return g;
  }
  function buildDams() {
    const g = L.layerGroup();
    for (const p of POI_EUROPE.dams) {
      L.circleMarker([p.lat, p.lon], { radius: 5, color: '#003f7f', weight: 2, fillColor: '#7fb8ff', fillOpacity: 1 })
        .bindPopup(`<b>Barrage : ${esc(p.name)}</b><br>${esc(p.country)}<br>Hauteur : ${p.height_m} m<br>Risque : rupture → onde de submersion en aval (voir PPI/DDRM local).<br><a href="https://www.wikidata.org/wiki/${p.id}" target="_blank" rel="noopener">Wikidata</a>`).addTo(g);
    }
    return g;
  }
  const FUEL_COLORS = { 'Hydraulique': '#1f77b4', 'Charbon': '#3b3b3b', 'Gaz': '#ff7f0e', 'Fioul': '#8c564b', 'Éolien': '#17becf', 'Solaire': '#e6c200', 'Biomasse': '#2ca02c', 'Déchets': '#7f7f7f', 'Géothermie': '#d62728' };
  function buildPlants() {
    const g = L.layerGroup();
    for (const p of POI_EUROPE.powerplants) {
      L.circleMarker([p.lat, p.lon], { radius: Math.min(8, 2 + Math.sqrt(p.mw) / 8), color: '#333', weight: 0.5, fillColor: FUEL_COLORS[p.fuel] || '#bbb', fillOpacity: 0.9 })
        .bindPopup(`<b>⚡ ${esc(p.name)}</b><br>${esc(p.country)}<br>${esc(p.fuel)} — ${p.mw} MW<br><small>Source : WRI GPPD (données 2021)</small>`).addTo(g);
    }
    return g;
  }

  /* ---------- Points OSM par zone (Overpass) ---------- */
  function osmPopup(e, cat) {
    const t = e.tags || {}, keys = ['name', 'amenity', 'natural', 'man_made', 'emergency', 'power', 'industrial', 'shop', 'tourism', 'landuse', 'hazard', 'drinking_water', 'opening_hours', 'phone', 'operator', 'content', 'plant:source'];
    const rows = keys.filter(k => t[k]).map(k => `<tr><td>${esc(k)}</td><td>${esc(t[k])}</td></tr>`).join('');
    return `<b>${esc(t.name || OSM_CATS[cat].label.split(' (')[0])}</b><table class="tags">${rows}</table><small><a href="https://www.openstreetmap.org/${e.type}/${e.id}" target="_blank" rel="noopener">OSM ${e.type}/${e.id}</a> — données © contributeurs OpenStreetMap (ODbL). Vérifiez sur place (ex. potabilité de l'eau).</small>`;
  }
  async function renderOsm() {
    for (const k in osmGroups) osmGroups[k].clearLayers();
    let zones = [];
    try { zones = await idb.all('osm'); } catch (e) { }
    const seen = new Set();
    for (const z of zones) for (const e of z.elements) {
      const id = e.type + e.id + e.cat; if (seen.has(id)) continue; seen.add(id);
      const c = OSM_CATS[e.cat]; if (!c) continue;
      L.circleMarker([e.lat, e.lon], { radius: 5, color: '#fff', weight: 1, fillColor: c.color, fillOpacity: 1 }).bindPopup(osmPopup(e, e.cat)).addTo(osmGroups[e.cat]);
    }
    renderZones(zones);
  }
  function renderZones(zones) {
    const el = $('#osmZones'); if (!el) return;
    el.innerHTML = zones.length ? zones.map(z => `<li><span>${esc(z.name)} — ${z.elements.length} pts — ${new Date(z.date).toLocaleDateString('fr-FR')}</span> <button class="link" data-zone="${esc(z.key)}">voir</button> <button class="link danger" data-delzone="${esc(z.key)}">suppr.</button></li>`).join('') : '<li class="muted">Aucune zone enregistrée.</li>';
    el.onclick = async ev => {
      const k = ev.target.dataset.zone, d = ev.target.dataset.delzone;
      if (k) { const z = zones.find(x => x.key === k); map.fitBounds([[z.bbox[0], z.bbox[1]], [z.bbox[2], z.bbox[3]]]); }
      if (d && await UI.confirm('Supprimer cette zone et ses points ?', 'Supprimer')) { await idb.del('osm', d); renderOsm(); }
    };
  }
  async function downloadOsm() {
    const cats = [...document.querySelectorAll('[name=osmcat]:checked')].map(i => i.value);
    const st = $('#osmStatus');
    if (!cats.length) return st.textContent = 'Cochez au moins une catégorie.';
    if (!Premium.isPremium()) { let z = []; try { z = await idb.all('osm'); } catch (e) { } if (z.length >= Premium.LIMITS.osmZones) return Premium.upsell('La version gratuite comprend une zone de points hors ligne. Premium : zones illimitées.'); }
    if (map.getZoom() < 9) return st.textContent = 'Zoomez davantage (niveau ≥ 9, soit une zone d\'environ 100 km) pour limiter la charge sur les serveurs Overpass.';
    if (!navigator.onLine) return st.textContent = 'Connexion requise pour télécharger. Les zones déjà enregistrées restent disponibles hors ligne.';
    const b = map.getBounds(), bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(v => +v.toFixed(4));
    const bb = bbox.join(',');
    const parts = cats.flatMap(c => OSM_CATS[c].q.map(q => `${q}(${bb});`)).join('');
    const query = `[out:json][timeout:90];(${parts});out center tags;`;
    st.textContent = 'Téléchargement en cours…';
    let data = null, lastErr;
    for (const ep of OVERPASS) {
      try {
        const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 100000);
        st.textContent = 'Téléchargement en cours (' + new URL(ep).hostname + ')…';
        const r = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ac.signal }).finally(() => clearTimeout(timer));
        if (!r.ok) throw new Error('HTTP ' + r.status);
        data = await r.json(); break;
      } catch (e) { lastErr = e; }
    }
    if (!data) return st.textContent = 'Échec Overpass (' + (lastErr && lastErr.message) + '). Réessayez plus tard.';
    const classify = t => {
      if (t.amenity === 'drinking_water' || t.natural === 'spring' || t.man_made === 'water_well' || t.amenity === 'water_point' || t.man_made === 'water_tap' || t.man_made === 'water_tower') return 'eau';
      if (/^(hospital|clinic|pharmacy|doctors)$/.test(t.amenity) || t.emergency === 'defibrillator') return 'sante';
      if (t.industrial || t.man_made === 'storage_tank' || t.landuse === 'military' || t.hazard || t.waterway === 'dam') return 'dangers';
      if (t.power || t.amenity === 'fuel') return 'energie';
      if (/^(police|fire_station|townhall|shelter)$/.test(t.amenity) || t.emergency === 'assembly_point' || t.tourism) return 'secours';
      if (t.shop || t.amenity === 'marketplace') return 'ravito';
      return null;
    };
    const elements = [];
    for (const e of data.elements || []) {
      const lat = e.lat != null ? e.lat : e.center && e.center.lat, lon = e.lon != null ? e.lon : e.center && e.center.lon;
      const cat = classify(e.tags || {});
      if (lat == null || !cat || !cats.includes(cat)) continue;
      elements.push({ type: e.type, id: e.id, lat: +lat.toFixed(6), lon: +lon.toFixed(6), cat, tags: e.tags });
    }
    const ans = await UI.ask('Enregistrer la zone', [{ name: 'n', label: 'Nom de la zone (ex. « Domicile », « Maison de famille »)', value: 'Zone ' + new Date().toLocaleDateString('fr-FR') }], 'Enregistrer');
    const name = (ans && ans.n) || 'Zone ' + new Date().toLocaleDateString('fr-FR');
    const key = 'z' + Date.now();
    await idb.put('osm', key, { key, name, bbox, date: Date.now(), cats, elements });
    st.textContent = `${elements.length} points enregistrés pour « ${name} » (disponibles hors ligne).`;
    for (const c of cats) if (!map.hasLayer(osmGroups[c])) map.addLayer(osmGroups[c]);
    renderOsm();
  }

  /* ---------- Géométrie ---------- */
  function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
  function lat2y(lat, z) { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)); }
  function tileBounds(bb, z) { // bb = [sud, ouest, nord, est]
    return { x0: lon2x(bb[1], z), x1: lon2x(bb[3], z), y0: lat2y(Math.min(bb[2], 85), z), y1: lat2y(Math.max(bb[0], -85), z) };
  }
  function* tilesForBox(bb, zmin, zmax) {
    for (let z = zmin; z <= zmax; z++) {
      const { x0, x1, y0, y1 } = tileBounds(bb, z);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) yield { z, x, y };
    }
  }
  function boxAround(lat, lon, km) {
    const dl = km / 111.32, dg = km / (111.32 * Math.cos(lat * Math.PI / 180));
    return [lat - dl, lon - dg, lat + dl, lon + dg].map(v => +v.toFixed(5));
  }
  function distKm(a, b, c, d) {
    const R = 6371, t = Math.PI / 180, x = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function bearing(a, b, c, d) {
    const t = Math.PI / 180, y = Math.sin((d - b) * t) * Math.cos(c * t), x = Math.cos(a * t) * Math.sin(c * t) - Math.sin(a * t) * Math.cos(c * t) * Math.cos((d - b) * t);
    return (Math.atan2(y, x) / t + 360) % 360;
  }
  const inBox = (bb, lat, lon) => lat >= bb[0] && lat <= bb[2] && lon >= bb[1] && lon <= bb[3];

  /* ---------- Packs de cartes hors ligne ---------- */
  function* packTasks(bb, zmin, zmax, srcs) {
    for (const k of srcs) for (const c of tilesForBox(bb, zmin, Math.min(zmax, TSRC[k].max))) yield [k, c];
  }
  function packEstimate(bb, zmin, zmax, srcs) {
    let n = 0, kb = 0;
    for (const k of srcs) for (let z = zmin; z <= Math.min(zmax, TSRC[k].max); z++) {
      const { x0, x1, y0, y1 } = tileBounds(bb, z);
      const count = Math.max(0, x1 - x0 + 1) * Math.max(0, y1 - y0 + 1);
      n += count; kb += count * TSRC[k].kb;
    }
    return { n, mb: Math.round(kb / 1024) };
  }
  let packAbort = false, packDownloading = false;
  async function downloadPack(meta, onProg) {
    const tasks = packTasks(meta.bbox, meta.zmin, meta.zmax, meta.srcs);
    const total = packEstimate(meta.bbox, meta.zmin, meta.zmax, meta.srcs).n;
    if (!navigator.onLine) throw new Error('connexion requise pour télécharger');
    if (navigator.storage && navigator.storage.persist) { try { await navigator.storage.persist(); } catch (e) { } }
    packAbort = false; let done = 0, fail = 0, storageError = null;
    const worker = async () => {
      while (!packAbort) {
        const task = tasks.next(); if (task.done) break;
        const [k, c] = task.value;
        try { await getTileBlob(k, TSRC[k].tpl, c, true, true); }
        catch (e) { fail++; if (e.name === 'TileStorageError') { storageError = e; packAbort = true; } }
        done++; if (onProg && (done % 20 === 0 || done === total)) onProg(done, total, fail);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    const rec = Object.assign({}, meta, { key: meta.key || 'p' + Date.now(), date: Date.now(), count: done - fail, fail, complete: !packAbort && fail === 0 });
    await idb.put('packs', rec.key, rec);
    if (storageError) throw storageError;
    return rec;
  }
  async function listPacks() { try { return await idb.all('packs'); } catch (e) { return []; } }
  async function deletePack(key) {
    const p = await idb.get('packs', key); if (!p) return;
    const others = (await listPacks()).filter(x => x.key !== key);
    const shared = new Map();
    for (const o of others) for (const k of o.srcs) for (let z = o.zmin; z <= Math.min(o.zmax, TSRC[k].max); z++) {
      const key = `${k}/${z}`;
      if (!shared.has(key)) shared.set(key, []);
      shared.get(key).push(tileBounds(o.bbox, z));
    }
    for (const [k, c] of packTasks(p.bbox, p.zmin, p.zmax, p.srcs)) {
      if ((shared.get(`${k}/${c.z}`) || []).some(b => c.x >= b.x0 && c.x <= b.x1 && c.y >= b.y0 && c.y <= b.y1)) continue;
      try { await idb.del('tiles', `${k}/${c.z}/${c.x}/${c.y}`); } catch (e) { }
    }
    await idb.del('packs', key);
  }
  /* Export d'un pack dans un fichier unique (copie sur clé USB, autre appareil) :
     "KSPACK1\n" + longueur de l'en-tête (uint32) + en-tête JSON + tuiles concaténées. */
  async function exportPack(key) {
    const p = await idb.get('packs', key), parts = [], index = [];
    let off = 0;
    for (const [k, c] of packTasks(p.bbox, p.zmin, p.zmax, p.srcs)) {
      const tk = `${k}/${c.z}/${c.x}/${c.y}`, b = await idb.get('tiles', tk).catch(() => null);
      if (!b) continue;
      index.push([tk, off, b.size, b.type]); parts.push(b); off += b.size;
    }
    const head = new TextEncoder().encode(JSON.stringify({ meta: p, index })), len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, head.length);
    return new Blob([new TextEncoder().encode('KSPACK1\n'), len, head, ...parts], { type: 'application/octet-stream' });
  }
  async function importPack(file, onProg) {
    const magic = new TextDecoder().decode(await file.slice(0, 8).arrayBuffer());
    if (magic !== 'KSPACK1\n') throw new Error('fichier non reconnu');
    const hl = new DataView(await file.slice(8, 12).arrayBuffer()).getUint32(0);
    const { meta, index } = JSON.parse(new TextDecoder().decode(await file.slice(12, 12 + hl).arrayBuffer()));
    const base = 12 + hl; let batch = [];
    for (let i = 0; i < index.length; i++) {
      const [tk, o, l, t] = index[i];
      batch.push([tk, file.slice(base + o, base + o + l, t)]);
      if (batch.length === 200 || i === index.length - 1) {
        const resolved = await Promise.all(batch.map(async ([k, b]) => [k, new Blob([await b.arrayBuffer()], { type: b.type })]));
        await idb.putMany('tiles', resolved); batch = []; if (onProg) onProg(i + 1, index.length);
      }
    }
    await idb.put('packs', meta.key, meta);
    return meta;
  }

  /* ---------- Proximité (utilisable sans afficher la carte) ---------- */
  async function coverage(lat, lon) {
    const packs = (await listPacks()).filter(p => inBox(p.bbox, lat, lon));
    let zones = []; try { zones = (await idb.all('osm')).filter(z => inBox(z.bbox, lat, lon)); } catch (e) { }
    return { packs, zones };
  }
  async function nearest(lat, lon, cats, n = 3) {
    const out = {}, add = (cat, item) => (out[cat] = out[cat] || []).push(item);
    let zones = []; try { zones = await idb.all('osm'); } catch (e) { }
    const seen = new Set();
    for (const z of zones) for (const e of z.elements) {
      if (!cats.includes(e.cat) || seen.has(e.type + e.id)) continue; seen.add(e.type + e.id);
      const t = e.tags || {};
      add(e.cat, { name: t.name || t.amenity || t.natural || t.man_made || t.emergency || t.shop || t.power || t.tourism || e.cat, kind: t.amenity || t.natural || t.man_made || t.emergency || t.shop || t.power || t.tourism || t.industrial || t.landuse || '', lat: e.lat, lon: e.lon, d: distKm(lat, lon, e.lat, e.lon), b: bearing(lat, lon, e.lat, e.lon) });
    }
    if (cats.includes('nucleaire')) for (const p of POI_EUROPE.nuclear) { if (p.state && /annulé|abandonné|projet/i.test(p.state)) continue; add('nucleaire', { name: p.name, kind: p.state || 'statut non renseigné', lat: p.lat, lon: p.lon, d: distKm(lat, lon, p.lat, p.lon), b: bearing(lat, lon, p.lat, p.lon) }); }
    if (cats.includes('barrage')) for (const p of POI_EUROPE.dams) add('barrage', { name: p.name, kind: p.height_m + ' m', lat: p.lat, lon: p.lon, d: distKm(lat, lon, p.lat, p.lon), b: bearing(lat, lon, p.lat, p.lon) });
    for (const k in out) out[k] = out[k].sort((a, b) => a.d - b.d).slice(0, n);
    return out;
  }
  const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const cardinal = b => CARD[Math.round(b / 45) % 8];

  async function storageInfo() {
    const el = $('#storageInfo'); if (!el) return;
    let txt = '';
    try { const n = await idb.count('tiles'); txt += `${n} tuiles en cache. `; } catch (e) { txt += 'IndexedDB indisponible. '; }
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      txt += `Stockage utilisé : ${(e.usage / 1048576).toFixed(0)} Mo / quota ${(e.quota / 1048576).toFixed(0)} Mo.`;
      if (navigator.storage.persisted) txt += (await navigator.storage.persisted()) ? ' Stockage persistant : oui.' : ' Stockage persistant : non (le navigateur peut effacer le cache s\'il manque de place).';
    }
    el.textContent = txt;
  }

  /* ---------- Mes points ---------- */
  function myPoints() { App.state.points = App.state.points || []; return App.state.points; }
  function renderMine() {
    myLayer.clearLayers();
    for (const p of myPoints()) {
      const t = MY_TYPES[p.type] || MY_TYPES.autre;
      L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'my-pin', html: `<span style="background:${t.color}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] }) })
        .bindPopup(`<b>${esc(p.name)}</b><br>${esc(t.label)}<br>${esc(p.note || '')}<br><small>${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</small><br><button class="link" data-rings="${p.id}">Cercles de marche 10/20/30 km</button> · <button class="link danger" data-delpt="${p.id}">Supprimer</button>`).addTo(myLayer);
    }
    const el = $('#myList');
    if (el) el.innerHTML = myPoints().length ? myPoints().map(p => `<li><button class="link" data-goto="${p.id}">${esc(p.name)}</button> <small class="muted">${esc((MY_TYPES[p.type] || MY_TYPES.autre).label)}</small></li>`).join('') : '<li class="muted">Aucun point. Cliquez sur « Ajouter un point » puis sur la carte.</li>';
  }
  async function addPoint(latlng) {
    const o = await UI.ask('Nouveau point — ' + (MY_TYPES[$('#myType').value] || MY_TYPES.autre).label, [{ name: 'name', label: 'Nom du point', required: true }, { name: 'note', label: 'Note (facultatif)' }], 'Ajouter');
    if (!o || !o.name) return;
    const name = o.name, type = $('#myType').value, note = o.note || '';
    myPoints().push({ id: 'p' + Date.now(), name, type, note, lat: latlng.lat, lon: latlng.lng });
    App.save(); renderMine();
  }
  function exportGeoJSON() {
    const fc = { type: 'FeatureCollection', features: myPoints().map(p => ({ type: 'Feature', properties: { name: p.name, type: p.type, note: p.note }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } })) };
    App.download('mes-points.geojson', JSON.stringify(fc, null, 1), 'application/geo+json');
  }
  function exportGPX() {
    const w = myPoints().map(p => `<wpt lat="${p.lat}" lon="${p.lon}"><name>${esc(p.name)}</name><desc>${esc((MY_TYPES[p.type] || MY_TYPES.autre).label + (p.note ? ' — ' + p.note : ''))}</desc></wpt>`).join('\n');
    App.download('mes-points.gpx', `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Holdout" xmlns="http://www.topografix.com/GPX/1/1">\n${w}\n</gpx>`, 'application/gpx+xml');
  }
  function importGeo(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const txt = r.result;
        if (/<gpx/i.test(txt)) {
          const doc = new DOMParser().parseFromString(txt, 'application/xml');
          doc.querySelectorAll('wpt').forEach((w, i) => myPoints().push({ id: 'p' + Date.now() + i, name: (w.querySelector('name') || {}).textContent || 'Point GPX', type: 'autre', note: (w.querySelector('desc') || {}).textContent || '', lat: +w.getAttribute('lat'), lon: +w.getAttribute('lon') }));
        } else {
          const fc = JSON.parse(txt);
          (fc.features || []).filter(f => f.geometry && f.geometry.type === 'Point').forEach((f, i) => myPoints().push({ id: 'p' + Date.now() + i, name: f.properties.name || 'Point', type: MY_TYPES[f.properties.type] ? f.properties.type : 'autre', note: f.properties.note || '', lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }));
        }
        App.save(); renderMine();
      } catch (e) { UI.notice('Fichier non reconnu (GeoJSON ou GPX attendu).'); }
    };
    r.readAsText(file);
  }

  /* ---------- PMTiles local ---------- */
  async function loadPmtiles(file) {
    const st = $('#pmStatus');
    try {
      const src = new pmtiles.FileSource(file), p = new pmtiles.PMTiles(src), h = await p.getHeader();
      if (pmLayer) { map.removeLayer(pmLayer); ctrl.removeLayer(pmLayer); }
      if (h.tileType === 1) pmLayer = protomapsL.leafletLayer({ url: p, flavor: 'light', lang: 'fr', attribution: '© OpenStreetMap (ODbL), <a href="https://protomaps.com">Protomaps</a>' });
      else pmLayer = pmtiles.leafletRasterLayer(p, { attribution: 'Fichier PMTiles local', maxNativeZoom: h.maxZoom });
      ctrl.addBaseLayer(pmLayer, 'Fichier local : ' + file.name);
      Object.values(layers.bases).forEach(l => map.hasLayer(l) && map.removeLayer(l));
      pmLayer.addTo(map);
      st.textContent = `Chargé : ${file.name} (zooms ${h.minZoom}–${h.maxZoom}, ${h.tileType === 1 ? 'vectoriel' : 'raster'}). À recharger à chaque ouverture (le navigateur ne peut pas relire le fichier seul).`;
      if (h.minLon != null) map.fitBounds([[h.minLat, h.minLon], [h.maxLat, h.maxLon]]);
    } catch (e) { st.textContent = 'Impossible de lire ce fichier PMTiles : ' + e.message; }
  }

  /* ---------- Outils ---------- */
  function toggleMeasure() {
    const btn = $('#btnMeasure');
    if (measure) { map.removeLayer(measure.layer); measure = null; btn.classList.remove('on'); $('#measureOut').textContent = ''; return; }
    measure = { pts: [], layer: L.layerGroup().addTo(map) }; btn.classList.add('on');
    $('#measureOut').textContent = 'Cliquez sur la carte pour tracer ; re-cliquez sur « Mesurer » pour terminer.';
  }
  function measureClick(ll) {
    measure.pts.push(ll); measure.layer.clearLayers();
    L.polyline(measure.pts, { color: '#e00', weight: 3 }).addTo(measure.layer);
    measure.pts.forEach(p => L.circleMarker(p, { radius: 3, color: '#e00' }).addTo(measure.layer));
    let d = 0; for (let i = 1; i < measure.pts.length; i++) d += map.distance(measure.pts[i - 1], measure.pts[i]);
    $('#measureOut').textContent = `Distance : ${(d / 1000).toFixed(2)} km — à pied ≈ ${(d / 1000 / 4).toFixed(1)} h à 4 km/h sur terrain plat (hors dénivelé).`;
  }
  function dms(v, pos, neg) { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 3600 - m * 60).toFixed(1); return `${d}°${m}'${s}"${v >= 0 ? pos : neg}`; }

  let gpsFix = null;
  function getGPS() {
    return Native.getPosition().then(p => (gpsFix = Object.assign(p, { t: Date.now() })));
  }
  function homeLL() { const h = (App.state.profile || {}).home; return h && isFinite(h.lat) && isFinite(h.lon) && (h.lat || h.lon) ? h : null; }
  const packUI = {
    async bbox() {
      const z = $('#pkZone').value, km = +$('#pkKm').value;
      if (z === 'view') { const b = map.getBounds(); return [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]; }
      if (z === 'home') { const h = homeLL(); if (!h) throw new Error('domicile non renseigné (onglet Mon profil)'); return boxAround(h.lat, h.lon, km); }
      const g = gpsFix || await getGPS(); return boxAround(g.lat, g.lon, km);
    },
    srcs: () => [...document.querySelectorAll('[name=pksrc]:checked')].map(i => i.value),
    async estimate() {
      const el = $('#pkEst'); if (!el) return;
      try {
        if ($('#pkZone').value === 'gps' && !gpsFix) { el.textContent = 'Position GPS demandée au téléchargement.'; return; }
        const e = packEstimate(await packUI.bbox(), 6, +$('#pkZ').value, packUI.srcs());
        el.innerHTML = `${e.n.toLocaleString('fr-FR')} tuiles ≈ <b>${e.mb.toLocaleString('fr-FR')} Mo</b> (estimation) — sans plafond de tuiles.`;
      } catch (err) { el.textContent = err.message; }
    },
    async download() {
      const st = $('#pkStatus');
      if (packDownloading) return;
      packDownloading = true; $('#btnPack').disabled = true;
      try {
        if (!Premium.isPremium()) {
          const L = Premium.LIMITS;
          if ((await listPacks()).length >= L.packs) return Premium.upsell(`La version gratuite comprend ${L.packs} pack de carte hors ligne. Premium : packs illimités (domicile, travail, famille, itinéraires).`);
          if (+$('#pkKm').value > L.packKm || +$('#pkZ').value > L.packZoom) return Premium.upsell(`En gratuit, un pack couvre jusqu'à ${L.packKm} km et le détail ${L.packZoom}. Premium : jusqu'à 50 km et le détail 16.`);
        }
        const bbox = await packUI.bbox(), srcs = packUI.srcs();
        if (!srcs.length) return st.textContent = 'Choisissez au moins une source.';
        const z = $('#pkZone').value, km = +$('#pkKm').value;
        const def = z === 'home' ? `Domicile (${km} km)` : z === 'gps' ? `Position du ${new Date().toLocaleDateString('fr-FR')} (${km} km)` : 'Zone ' + new Date().toLocaleDateString('fr-FR');
        const o = await UI.ask('Nom du pack', [{ name: 'n', label: 'Nom (ex. « Domicile », « Chez mes parents »)', value: def }], 'Télécharger');
        if (!o) return;
        st.textContent = 'Téléchargement…';
        const rec = await downloadPack({ name: o.n || def, bbox, zmin: 6, zmax: +$('#pkZ').value, srcs }, (d, n, f) => { st.textContent = `${d.toLocaleString('fr-FR')} / ${n.toLocaleString('fr-FR')} tuiles (${f} échecs)…`; });
        st.textContent = `Pack « ${rec.name} » : ${rec.count.toLocaleString('fr-FR')} tuiles disponibles hors ligne${rec.fail ? ` (${rec.fail} échecs : relancez pour compléter)` : ''}.`;
        if (!map.hasLayer(layers.bases['IGN topographique – France (packs hors ligne)']) && srcs.some(k => k.startsWith('ign'))) { Object.values(layers.bases).forEach(l => map.hasLayer(l) && map.removeLayer(l)); layers.bases['IGN topographique – France (packs hors ligne)'].addTo(map); }
        packUI.list(); storageInfo();
      } catch (err) { st.textContent = 'Impossible : ' + err.message; packUI.list(); storageInfo(); }
      finally { packDownloading = false; $('#btnPack').disabled = false; }
    },
    async list() {
      const el = $('#packList'); if (!el) return;
      const packs = await listPacks();
      el.innerHTML = packs.length ? packs.map(p => `<li><b>${esc(p.name)}</b> — ${p.count.toLocaleString('fr-FR')} tuiles, détail ${p.zmax}, ${new Date(p.date).toLocaleDateString('fr-FR')}${p.complete ? '' : ' <span class="danger">incomplet</span>'}<br><button class="link" data-pkgo="${p.key}">voir</button> · <button class="link" data-pkexp="${p.key}">exporter</button> · <button class="link danger" data-pkdel="${p.key}">supprimer</button></li>`).join('') : '<li class="muted">Aucun pack. Commencez par votre domicile.</li>';
      el.onclick = async ev => {
        const d = ev.target.dataset, p = packs.find(x => x.key === (d.pkgo || d.pkexp || d.pkdel));
        if (!p) return;
        if (d.pkgo) map.fitBounds([[p.bbox[0], p.bbox[1]], [p.bbox[2], p.bbox[3]]]);
        if (d.pkexp && !Premium.gate('L\'export de packs (clé USB, autre appareil) fait partie de Premium.')) return;
        if (d.pkexp && Native.isNative) { $('#pkStatus').textContent = 'Préparation du fichier…'; const b = await exportPack(p.key); await Native.saveFile(p.name.replace(/[^\w-]+/g, '_') + '.kspack', b); $('#pkStatus').textContent = ''; return; }
        if (d.pkexp) { $('#pkStatus').textContent = 'Préparation du fichier…'; const b = await exportPack(p.key); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = p.name.replace(/[^\w-]+/g, '_') + '.kspack'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); $('#pkStatus').textContent = `Fichier prêt (${Math.round(b.size / 1048576)} Mo).`; }
        if (d.pkdel && await UI.confirm(`Supprimer le pack « ${p.name} » et ses tuiles ?`, 'Supprimer')) { await deletePack(p.key); packUI.list(); storageInfo(); }
      };
      const h = homeLL(), cov = $('#packCover');
      if (cov) cov.innerHTML = h ? (packs.some(p => inBox(p.bbox, h.lat, h.lon)) ? '✅ Votre domicile est couvert par un pack hors ligne.' : '⚠ Votre domicile n\'est couvert par aucun pack hors ligne.') : 'Renseignez votre domicile dans « Mon profil » pour préparer sa carte en un clic.';
    },
    async import(file) {
      const st = $('#pkStatus');
      if (!Premium.gate('L\'import de packs fait partie de Premium.')) return;
      try { const m = await importPack(file, (i, n) => { st.textContent = `Import : ${i} / ${n} tuiles…`; }); st.textContent = `Pack « ${m.name} » importé.`; packUI.list(); storageInfo(); }
      catch (err) { st.textContent = 'Import impossible : ' + err.message; }
    },
  };

  function panelHTML() {
    return `
    <details open><summary>Fonds & couches</summary>
      <p class="small">Utilisez le sélecteur de couches sur la carte. Le <b>relief Europe intégré</b> et le <b>fond vectoriel</b> fonctionnent sans aucune connexion.</p>
      <label>Rayon autour des sites nucléaires : <input id="nucKm" type="number" min="1" max="300" value="${nucRadiusKm()}" style="width:5em"> km</label>
      <p class="small muted">En France, le rayon des Plans particuliers d'intervention (PPI) des centrales est de 20 km (voir la Notice).</p>
    </details>
    <details open class="packbox"><summary>📥 Cartes hors ligne (sans Internet)</summary>
      <p class="small">Téléchargez <b>avant</b> une crise les cartes de vos zones (domicile, travail, famille, itinéraires). Elles restent sur l'appareil et s'affichent ensuite <b>sans connexion</b>. En France, la carte IGN officielle (routes, chemins, courbes de niveau, lieux-dits) ; ailleurs en Europe, le relief.</p>
      <div class="small" id="packCover"></div>
      <label>Zone <select id="pkZone"><option value="home">Autour de mon domicile (profil)</option><option value="gps">Autour de ma position GPS</option><option value="view">Zone affichée à l'écran</option></select></label>
      <label>Rayon <select id="pkKm">${[5, 10, 20, 30, 50].map(k => `<option ${k === 20 ? 'selected' : ''}>${k}</option>`).join('')}</select> km</label>
      <label>Détail max <select id="pkZ">${[[12, '12 – vue d\'ensemble'], [13, '13 – routes, villages'], [14, '14 – chemins (≈ 1:25 000)'], [15, '15 – rando détaillée'], [16, '16 – très détaillé']].map(([z, t]) => `<option value="${z}" ${z === 15 ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      ${Object.entries(TSRC).map(([k, t]) => `<label class="chk"><input type="checkbox" name="pksrc" value="${k}" ${k !== 'dem' ? 'checked' : ''}>${t.label}</label>`).join('')}
      <div id="pkEst" class="small"></div>
      <button id="btnPack" class="btn">Télécharger ce pack</button> <button id="btnPackStop" class="btn ghost">Stop</button>
      <div id="pkStatus" class="small"></div>
      <ul id="packList" class="zones"></ul>
      <label class="btn ghost file">Importer un pack (.kspack)<input id="pkImport" type="file" accept=".kspack" hidden></label>
      <p class="small muted">Sources : IGN – Géoplateforme (Licence Ouverte Etalab 2.0) ; Terrain Tiles (AWS Open Data). Le SCAN 25 IGN (carte « TOP 25 » numérique) n'est pas téléchargeable hors ligne (droits de diffusion, selon l'IGN) ; le Plan IGN l'est librement. Exportez un pack pour le copier sur une clé USB ou un autre appareil.</p>
    </details>
    <details><summary>Points OSM hors ligne (zone affichée)</summary>
      <p class="small">Récupère depuis OpenStreetMap (API Overpass) les points utiles de la zone visible et les enregistre sur l'appareil.</p>
      ${Object.entries(OSM_CATS).map(([k, c]) => `<label class="chk"><input type="checkbox" name="osmcat" value="${k}" ${k !== 'ravito' ? 'checked' : ''}><i style="background:${c.color}"></i>${c.label}</label>`).join('')}
      <button id="btnOsm" class="btn">Télécharger les points</button>
      <div id="osmStatus" class="small"></div>
      <ul id="osmZones" class="zones"></ul>
    </details>
    <details><summary>Mes points (RDV, caches, itinéraires)</summary>
      <select id="myType">${Object.entries(MY_TYPES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('')}</select>
      <button id="btnAdd" class="btn">Ajouter un point</button>
      <ul id="myList" class="zones"></ul>
      <p class="small muted">Astuce (méthode APS) : ouvrez un point (domicile, base) → « Cercles de marche 10/20/30 km » pour repérer itinéraires, points d'eau et de repli à une journée de marche.</p>
      <button id="btnExpGeo" class="btn ghost">Export GeoJSON</button> <button id="btnExpGpx" class="btn ghost">Export GPX</button>
      <label class="btn ghost file">Importer GeoJSON/GPX<input id="impGeo" type="file" accept=".geojson,.json,.gpx" hidden></label>
    </details>
    <details><summary>Outils</summary>
      <button id="btnLocate" class="btn">Ma position (GPS)</button> <button id="btnMeasure" class="btn">Mesurer</button>
      <div id="measureOut" class="small"></div>
      <div id="clickInfo" class="small">Cliquez sur la carte pour obtenir coordonnées et altitude.</div>
    </details>
    <details><summary>Carte détaillée hors ligne (fichier PMTiles)</summary>
      <p class="small">Pour une carte routière détaillée de toute l'Europe sans connexion, chargez un extrait <b>.pmtiles</b> (voir la Notice, section Carte). Le fichier reste sur votre appareil.</p>
      <label class="btn ghost file">Choisir un fichier .pmtiles<input id="pmFile" type="file" accept=".pmtiles" hidden></label>
      <div id="pmStatus" class="small"></div>
    </details>
    <details><summary>Stockage & sources</summary>
      <div id="storageInfo" class="small"></div>
      <button id="btnClearOtm" class="btn ghost">Vider le cache OpenTopoMap</button> <button id="btnClearDem" class="btn ghost">Vider le cache relief</button>
      <p class="small muted">${ATTR_NE}. ${ATTR_DEM}. Nucléaire & barrages : Wikidata (CC0), extraction du 30/09/2026 — statuts parfois non renseignés. Centrales : WRI Global Power Plant Database v1.3.0 (CC BY 4.0, données 2021). Points OSM : © contributeurs OpenStreetMap (ODbL). OpenTopoMap : CC-BY-SA.</p>
    </details>`;
  }

  function init() {
    if (map) return;
    map = L.map('map', { preferCanvas: true, zoomControl: false, worldCopyJump: false, minZoom: 3, maxZoom: 17 }).setView([46.6, 2.5], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // The map follows the viewport, including mobile rotation and split-screen resizing.
    if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize({ pan: false })).observe($('#map'));
    map.createPane('basevec').style.zIndex = 250;
    map.createPane('vec').style.zIndex = 390;
    L.control.scale({ imperial: false }).addTo(map);
    // Flèche du nord, toujours affichée : la carte (projection Web Mercator) n'est jamais tournée, le haut est donc le nord géographique.
    const North = L.Control.extend({
      onAdd() {
        const d = L.DomUtil.create('div', 'leaflet-control north-arrow');
        d.title = 'Nord géographique : le haut de la carte. La carte ne tourne jamais. Le nord magnétique indiqué par une boussole s\'en écarte de quelques degrés (déclinaison magnétique, variable selon le lieu et l\'année).';
        d.setAttribute('role', 'img'); d.setAttribute('aria-label', 'Nord en haut de la carte');
        d.innerHTML = '<svg viewBox="0 0 32 44" width="30" height="41" aria-hidden="true"><text x="16" y="11" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">N</text><path d="M16 14 L24 40 L16 34 L8 40 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 14 L16 34 L8 40 Z" fill="currentColor"/></svg>';
        L.DomEvent.disableClickPropagation(d);
        return d;
      },
    });
    new North({ position: 'bottomleft' }).addTo(map);

    const reliefImg = L.imageOverlay('data/relief_europe.jpg', RELIEF_BOUNDS, { attribution: ATTR_DEM, interactive: false });
    const reliefBase = L.layerGroup([reliefImg]);
    const vectorBase = L.layerGroup([buildCountries()]);
    const relief = new ReliefLayer({ maxNativeZoom: 13, maxZoom: 17, attribution: ATTR_DEM });
    const otm = new CachedTiles(OTM, { prefix: 'otm', maxZoom: 17, attribution: 'Carte : © <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA), données © contributeurs OpenStreetMap' });
    const ignPlan = new CachedTiles(TSRC.ign_plan.tpl, { prefix: 'ign_plan', maxZoom: 18, maxNativeZoom: 18, attribution: ATTR_IGN });
    const ignShad = new CachedTiles(TSRC.ign_shad.tpl, { prefix: 'ign_shad', maxZoom: 18, maxNativeZoom: 15, opacity: 0.45, className: 'blend-multiply' });
    const ignTopo = L.layerGroup([ignPlan, ignShad]);
    layers.bases = { 'IGN topographique – France (packs hors ligne)': ignTopo, 'Relief Europe intégré (hors ligne)': reliefBase, 'Europe vectorielle simple (hors ligne)': vectorBase, 'Relief MNT détaillé (zones téléchargées)': relief, 'OpenTopoMap (en ligne)': otm };

    const net = buildBase().addTo(map);
    nucLayer = buildNuclear();
    for (const k in OSM_CATS) osmGroups[k] = L.layerGroup();
    myLayer = L.layerGroup().addTo(map);
    const overlays = {
      'Fleuves, lacs, routes, frontières, villes': net,
      '☢ Sites nucléaires + rayon': nucLayer.addTo(map),
      'Grands barrages (≥ 50 m)': buildDams(),
      '⚡ Centrales électriques ≥ 50 MW': buildPlants(),
      'Mes points': myLayer,
    };
    for (const [k, c] of Object.entries(OSM_CATS)) overlays[`<i class="dot" style="background:${c.color}"></i>OSM : ${c.label.split(' (')[0]}`] = osmGroups[k].addTo(map);
    const start = (App.state.map && App.state.map.base) || 'Relief Europe intégré (hors ligne)';
    (layers.bases[start] || reliefBase).addTo(map);
    ctrl = L.control.layers(layers.bases, overlays, { collapsed: true, position: 'topleft' }).addTo(map);
    map.on('baselayerchange', e => { App.state.map = Object.assign(App.state.map || {}, { base: e.name }); App.save(); });

    $('#mapPanel').innerHTML = panelHTML();
    $('#nucKm').onchange = e => { App.state.map = Object.assign(App.state.map || {}, { nucKm: +e.target.value }); App.save(); const on = map.hasLayer(nucLayer); map.removeLayer(nucLayer); ctrl.removeLayer(nucLayer); nucLayer = buildNuclear(); ctrl.addOverlay(nucLayer, '☢ Sites nucléaires + rayon'); if (on) nucLayer.addTo(map); };
    ['pkZone', 'pkKm', 'pkZ'].forEach(id => $('#' + id).onchange = packUI.estimate);
    document.querySelectorAll('[name=pksrc]').forEach(i => i.onchange = packUI.estimate);
    map.on('moveend', () => $('#pkZone').value === 'view' && packUI.estimate()); packUI.estimate(); packUI.list();
    $('#btnPack').onclick = packUI.download; $('#btnPackStop').onclick = () => { packAbort = true; };
    $('#pkImport').onchange = e => e.target.files[0] && packUI.import(e.target.files[0]);
    $('#btnOsm').onclick = downloadOsm;
    $('#btnAdd').onclick = () => { addMode = !addMode; $('#btnAdd').classList.toggle('on', addMode); $('#btnAdd').textContent = addMode ? 'Cliquez sur la carte…' : 'Ajouter un point'; };
    $('#btnExpGeo').onclick = exportGeoJSON; $('#btnExpGpx').onclick = exportGPX;
    $('#impGeo').onchange = e => e.target.files[0] && importGeo(e.target.files[0]);
    $('#pmFile').onchange = e => e.target.files[0] && loadPmtiles(e.target.files[0]);
    $('#btnMeasure').onclick = toggleMeasure;
    $('#btnLocate').onclick = () => {
      getGPS().then(p => {
        const ll = [p.lat, p.lon];
        L.circle(ll, { radius: p.acc || 0, color: '#0a84ff', weight: 1 }).addTo(map);
        L.circleMarker(ll, { radius: 7, color: '#fff', weight: 2, fillColor: '#0a84ff', fillOpacity: 1 }).addTo(map).bindPopup(`Vous êtes ici (± ${Math.round(p.acc || 0)} m)`).openPopup();
        map.setView(ll, Math.max(map.getZoom(), 12));
      }).catch(err => UI.notice('Position indisponible : ' + err.message));
    };
    $('#btnClearOtm').onclick = async () => { if (await UI.confirm('Vider le cache OpenTopoMap ?', 'Vider')) { await idb.deletePrefix('tiles', 'otm/'); storageInfo(); } };
    $('#btnClearDem').onclick = async () => { if (await UI.confirm('Vider le cache relief ?', 'Vider')) { await idb.deletePrefix('tiles', 'dem/'); storageInfo(); } };
    $('#mapPanel').addEventListener('click', e => {
      const g = e.target.dataset.goto; if (g) { const p = myPoints().find(x => x.id === g); map.setView([p.lat, p.lon], 14); }
    });
    map.on('popupopen', e => {
      const b = e.popup.getElement().querySelector('[data-delpt]');
      const r = e.popup.getElement().querySelector('[data-rings]');
      if (r) r.onclick = () => {
        const p = myPoints().find(x => x.id === r.dataset.rings); if (!p) return;
        if (rings) map.removeLayer(rings);
        rings = L.layerGroup([10, 20, 30].flatMap(km => [
          L.circle([p.lat, p.lon], { radius: km * 1000, color: '#ff7f0e', weight: 2, fill: false, dashArray: '8 6', interactive: false }),
          L.circleMarker([p.lat + km / 111.32, p.lon], { radius: 0, opacity: 0, interactive: false }).bindTooltip(km + ' km', { permanent: true, direction: 'top', className: 'place-label' }),
        ])).addTo(map);
        map.fitBounds(L.latLng(p.lat, p.lon).toBounds(62000)); map.closePopup();
      };
      if (b) b.onclick = () => { App.state.points = myPoints().filter(p => p.id !== b.dataset.delpt); App.save(); renderMine(); map.closePopup(); };
    });
    map.on('click', async e => {
      if (measure) return measureClick(e.latlng);
      if (addMode) { addMode = false; $('#btnAdd').classList.remove('on'); $('#btnAdd').textContent = 'Ajouter un point'; return addPoint(e.latlng); }
      const { lat, lng } = e.latlng, el = $('#clickInfo');
      el.innerHTML = `${lat.toFixed(5)}, ${lng.toFixed(5)}<br>${dms(lat, 'N', 'S')} ${dms(lng, 'E', 'O')}<br>Altitude : calcul…`;
      const h = await elevationAt(e.latlng);
      el.innerHTML = el.innerHTML.replace('Altitude : calcul…', h ? `Altitude ≈ ${h.h} m <span class="muted">(MNT, zoom ${h.z}${h.z < 10 ? ', précision grossière' : ''})</span>` : 'Altitude : indisponible hors ligne pour cette zone (téléchargez le relief).');
    });
    renderMine(); renderOsm(); storageInfo();
  }

  window.SurvivalMap = {
    nearest, coverage, listPacks, getGPS, distKm, bearing, cardinal, elevationAt,
    focus(lat, lon, z, label) { init(); App.go('map'); setTimeout(() => { map.invalidateSize(); map.setView([lat, lon], z || 14); if (label) L.popup().setLatLng([lat, lon]).setContent(esc(label)).openOn(map); }, 80); },
    init, show() { init(); setTimeout(() => map.invalidateSize(), 50); },
    MY_TYPES,
  };
})();
