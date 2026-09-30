/* Service worker : met l'application en cache pour un usage 100 % hors ligne.
   Les tuiles de carte et points OSM sont gérés séparément dans IndexedDB (js/map.js). */
const VERSION = 'tenir-v11';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg',
  'lib/leaflet/leaflet.js', 'lib/leaflet/leaflet.css', 'lib/leaflet/images/layers.png', 'lib/leaflet/images/layers-2x.png',
  'lib/leaflet/images/marker-icon.png', 'lib/leaflet/images/marker-icon-2x.png', 'lib/leaflet/images/marker-shadow.png',
  'lib/capacitor.js', 'js/native.js', 'lib/pmtiles.js', 'lib/protomaps-leaflet.js',
  'data/base_europe.js', 'data/poi_europe.js', 'data/relief_europe.jpg',
  'js/config.js', 'js/store.js', 'js/ui.js', 'js/knowledge.js', 'js/aps.js', 'js/gear.js', 'js/env.js', 'js/bags.js', 'js/calc.js', 'js/field.js', 'js/needs.js', 'js/profile.js', 'js/now.js', 'js/premium.js', 'js/map.js', 'js/app.js',
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
