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
  async function getTileBlob(prefix, tpl, c, allowNet = true) {
    const key = `${prefix}/${c.z}/${c.x}/${c.y}`;
    try { const b = await idb.get('tiles', key); if (b) return b; } catch (e) { /* IDB indisponible */ }
    if (!allowNet || !navigator.onLine) throw new Error('hors ligne');
    const r = await fetch(tileUrl(tpl, c), { mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.blob();
    try { await idb.put('tiles', key, b); } catch (e) { }
    return b;
  }

  /* Couche en ligne avec cache des seules tuiles consultées */
  const CachedTiles = L.TileLayer.extend({
    createTile(coords, done) {
      const img = document.createElement('img');
      img.alt = '';
      getTileBlob(this.options.prefix, this._url, coords, true).then(b => {
        const u = URL.createObjectURL(b);
        img.onload = () => { URL.revokeObjectURL(u); done(null, img); };
        img.onerror = () => done(new Error('image'), img);
        img.src = u;
      }).catch(err => done(err, img));
      return img;
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
    L.geoJSON(B.lakes, { pane: 'vec', interactive: false, style: { color: '#4f8fc4', weight: 0.6, fillColor: '#a9cbe6', fillOpacity: 0.9 } }).addTo(g);
    L.geoJSON(B.rivers, { pane: 'vec', interactive: false, style: f => ({ color: '#3b82c4', weight: f.properties.scalerank <= 3 ? 1.6 : f.properties.scalerank <= 6 ? 1 : 0.6, opacity: 0.85 }) }).addTo(g);
    L.geoJSON(B.boundaries, { pane: 'vec', interactive: false, style: { color: '#7a3b69', weight: 1.2, dashArray: '4 3', opacity: 0.8 } }).addTo(g);
    const roads = L.geoJSON(B.roads, { pane: 'vec', interactive: false, style: f => ({ color: '#b5462f', weight: f.properties.type === 'Major Highway' ? 1.4 : 0.8, opacity: 0.75 }) });
    const places = L.layerGroup();
    function refresh() {
      const z = map.getZoom(), minPop = z < 5 ? 2e6 : z < 6 ? 5e5 : z < 7 ? 1.5e5 : 0;
      places.clearLayers();
      if (z >= 6) { if (!g.hasLayer(roads)) g.addLayer(roads); } else if (g.hasLayer(roads)) g.removeLayer(roads);
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

  /* ---------- Téléchargement relief par zone ---------- */
  function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
  function lat2y(lat, z) { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)); }
  function tilesFor(bounds, zmin, zmax) {
    const list = [];
    for (let z = zmin; z <= zmax; z++) {
      const x0 = lon2x(bounds.getWest(), z), x1 = lon2x(bounds.getEast(), z), y0 = lat2y(Math.min(bounds.getNorth(), 85), z), y1 = lat2y(Math.max(bounds.getSouth(), -85), z);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) list.push({ z, x, y });
    }
    return list;
  }
  const MAX_TILES = 5000, AVG_KB = 60;
  function estimate() {
    const zmin = +$('#demZmin').value, zmax = +$('#demZmax').value;
    const n = zmax < zmin ? 0 : tilesFor(map.getBounds(), zmin, zmax).length;
    $('#demEstimate').textContent = `${n} tuiles ≈ ${Math.round(n * AVG_KB / 1024)} Mo (estimation)${n > MAX_TILES ? ` — au-delà de la limite de ${MAX_TILES} par lot : réduisez la zone ou le zoom max.` : ''}`;
    return n;
  }
  let dlAbort = false;
  async function downloadDem() {
    const st = $('#demStatus');
    const zmin = +$('#demZmin').value, zmax = +$('#demZmax').value;
    const list = tilesFor(map.getBounds(), zmin, zmax);
    if (!list.length) return;
    if (list.length > MAX_TILES) return st.textContent = 'Trop de tuiles : réduisez la zone ou le zoom max.';
    if (!navigator.onLine) return st.textContent = 'Connexion requise.';
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    dlAbort = false; let done = 0, fail = 0, i = 0;
    const worker = async () => {
      while (i < list.length && !dlAbort) {
        const c = list[i++];
        try { await getTileBlob('dem', TERRARIUM, c, true); } catch (e) { fail++; }
        done++; if (done % 10 === 0 || done === list.length) st.textContent = `${done}/${list.length} tuiles (${fail} échecs)…`;
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    st.textContent = dlAbort ? `Interrompu : ${done} tuiles traitées.` : `Terminé : ${done - fail} tuiles de relief disponibles hors ligne (${fail} échecs).`;
    storageInfo();
  }
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
    App.download('mes-points.gpx', `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Kit Survie" xmlns="http://www.topografix.com/GPX/1/1">\n${w}\n</gpx>`, 'application/gpx+xml');
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

  function panelHTML() {
    return `
    <details open><summary>Fonds & couches</summary>
      <p class="small">Utilisez le sélecteur en haut à droite de la carte. Le <b>relief Europe intégré</b> et le <b>fond vectoriel</b> fonctionnent sans aucune connexion.</p>
      <label>Rayon autour des sites nucléaires : <input id="nucKm" type="number" min="1" max="300" value="${nucRadiusKm()}" style="width:5em"> km</label>
      <p class="small muted">En France, le rayon des Plans particuliers d'intervention (PPI) des centrales est de 20 km (voir la Notice).</p>
    </details>
    <details><summary>Relief détaillé hors ligne (zone affichée)</summary>
      <p class="small">Télécharge les tuiles d'altitude de la zone visible (données ouvertes AWS Terrain Tiles). Elles restent ensuite disponibles hors ligne pour la couche « Relief MNT détaillé » et l'altitude au clic.</p>
      <label>Zoom min <select id="demZmin">${[5, 6, 7, 8, 9, 10].map(z => `<option ${z === 7 ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
      <label>Zoom max <select id="demZmax">${[8, 9, 10, 11, 12, 13].map(z => `<option ${z === 11 ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
      <div id="demEstimate" class="small"></div>
      <button id="btnDem" class="btn">Télécharger le relief</button> <button id="btnDemStop" class="btn ghost">Stop</button>
      <div id="demStatus" class="small"></div>
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
    map = L.map('map', { preferCanvas: true, zoomControl: true, worldCopyJump: false, minZoom: 3, maxZoom: 17 }).setView([46.6, 2.5], 5);
    map.createPane('basevec').style.zIndex = 250;
    map.createPane('vec').style.zIndex = 390;
    L.control.scale({ imperial: false }).addTo(map);

    const reliefImg = L.imageOverlay('data/relief_europe.jpg', RELIEF_BOUNDS, { attribution: ATTR_DEM, interactive: false });
    const reliefBase = L.layerGroup([reliefImg]);
    const vectorBase = L.layerGroup([buildCountries()]);
    const relief = new ReliefLayer({ maxNativeZoom: 13, maxZoom: 17, attribution: ATTR_DEM });
    const otm = new CachedTiles(OTM, { prefix: 'otm', maxZoom: 17, attribution: 'Carte : © <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA), données © contributeurs OpenStreetMap' });
    layers.bases = { 'Relief Europe intégré (hors ligne)': reliefBase, 'Europe vectorielle simple (hors ligne)': vectorBase, 'Relief MNT détaillé (zones téléchargées)': relief, 'OpenTopoMap (en ligne)': otm };

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
    ctrl = L.control.layers(layers.bases, overlays, { collapsed: true }).addTo(map);
    map.on('baselayerchange', e => { App.state.map = Object.assign(App.state.map || {}, { base: e.name }); App.save(); });

    $('#mapPanel').innerHTML = panelHTML();
    $('#nucKm').onchange = e => { App.state.map = Object.assign(App.state.map || {}, { nucKm: +e.target.value }); App.save(); const on = map.hasLayer(nucLayer); map.removeLayer(nucLayer); ctrl.removeLayer(nucLayer); nucLayer = buildNuclear(); ctrl.addOverlay(nucLayer, '☢ Sites nucléaires + rayon'); if (on) nucLayer.addTo(map); };
    ['demZmin', 'demZmax'].forEach(id => $('#' + id).onchange = estimate);
    map.on('moveend', estimate); estimate();
    $('#btnDem').onclick = downloadDem; $('#btnDemStop').onclick = () => dlAbort = true;
    $('#btnOsm').onclick = downloadOsm;
    $('#btnAdd').onclick = () => { addMode = !addMode; $('#btnAdd').classList.toggle('on', addMode); $('#btnAdd').textContent = addMode ? 'Cliquez sur la carte…' : 'Ajouter un point'; };
    $('#btnExpGeo').onclick = exportGeoJSON; $('#btnExpGpx').onclick = exportGPX;
    $('#impGeo').onchange = e => e.target.files[0] && importGeo(e.target.files[0]);
    $('#pmFile').onchange = e => e.target.files[0] && loadPmtiles(e.target.files[0]);
    $('#btnMeasure').onclick = toggleMeasure;
    $('#btnLocate').onclick = () => {
      if (!navigator.geolocation) return UI.notice('Géolocalisation indisponible sur cet appareil ou dans ce contexte.');
      navigator.geolocation.getCurrentPosition(p => {
        const ll = [p.coords.latitude, p.coords.longitude];
        L.circle(ll, { radius: p.coords.accuracy, color: '#0a84ff', weight: 1 }).addTo(map);
        L.circleMarker(ll, { radius: 7, color: '#fff', weight: 2, fillColor: '#0a84ff', fillOpacity: 1 }).addTo(map).bindPopup(`Vous êtes ici (± ${Math.round(p.coords.accuracy)} m)`).openPopup();
        map.setView(ll, Math.max(map.getZoom(), 12));
      }, err => UI.notice('Position indisponible : ' + err.message), { enableHighAccuracy: true, timeout: 20000 });
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
    init, show() { init(); setTimeout(() => map.invalidateSize(), 50); },
    MY_TYPES,
  };
})();
