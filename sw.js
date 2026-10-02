/* Service worker : met l'application en cache pour un usage 100 % hors ligne (dont le moteur de carte, ses polices et icônes).
   Les tuiles de carte et points OSM sont gérés séparément dans IndexedDB (js/map.js). */
const VERSION = 'holdout-v33';
// Polices de la carte : latin, grec, cyrillique, arabe, tifinagh (noms de lieux affichés aussi dans leur écriture).
const FONTS = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'].flatMap(f => ['0-255', '256-511', '512-767', '768-1023', '1024-1279', '1280-1535', '1536-1791', '1792-2047', '7680-7935', '8192-8447', '11520-11775'].map(r => `assets/map/fonts/${f}/${r}.pbf`));
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/favicon-64.png', 'icons/logo-mark.png', 'icons/logo-mark-light.png', 'icons/icon-192.png', 'icons/terrain.svg',
  'lib/leaflet/leaflet.js', 'lib/leaflet/leaflet.css', 'lib/leaflet/images/layers.png', 'lib/leaflet/images/layers-2x.png',
  'lib/leaflet/images/marker-icon.png', 'lib/leaflet/images/marker-icon-2x.png', 'lib/leaflet/images/marker-shadow.png',
  'lib/capacitor.js', 'js/native.js',
  'lib/maplibre/maplibre-gl.js', 'lib/maplibre/maplibre-gl.css', 'lib/maplibre/leaflet-maplibre-gl.js', 'lib/maplibre/pmtiles.js', 'lib/maplibre/basemaps.js', 'lib/maplibre/maplibre-contour.js',
  'assets/map/sprites/light.json', 'assets/map/sprites/light.png', 'assets/map/sprites/light@2x.json', 'assets/map/sprites/light@2x.png',
  ...FONTS,
  'data/poi_europe.js', 'data/relief_europe.jpg',
  'js/config.js', 'js/osm-points.js', 'js/store.js', 'js/ui.js', 'js/knowledge.js', 'js/aps.js', 'js/gear.js', 'js/env.js', 'js/gear-tiers.js', 'js/shop.js', 'js/bags.js', 'js/calc.js', 'js/field.js', 'js/needs.js', 'js/profile.js', 'js/now.js', 'js/premium.js', 'js/vault-crypto.js', 'js/account.js', 'js/topo.js', 'js/map.js', 'js/app.js',
];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Réseau d'abord (pour recevoir les mises à jour), cache en secours hors ligne.
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
