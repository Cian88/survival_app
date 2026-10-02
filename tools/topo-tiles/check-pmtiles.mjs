/* Vérifie qu'un fichier PMTiles hébergé est lisible par l'application (KS_CONFIG.map.osm ou .terrain).
   Usage : node tools/topo-tiles/check-pmtiles.mjs <url> [osm|terrain]
   Contrôles : lecture partielle (HTTP 206), CORS pour l'app iOS et la webapp (y compris la requête préalable
   OPTIONS avec l'en-tête Range), en-tête PMTiles v3, type de tuiles et niveaux de détail attendus. Trois requêtes. */
const [url, kind = 'osm'] = process.argv.slice(2);
if (!url) { console.error('Usage : node tools/topo-tiles/check-pmtiles.mjs <url> [osm|terrain]'); process.exit(2); }
const ORIGINS = ['capacitor://localhost', 'https://holdout.example']; // app iOS, webapp (toute origine HTTPS)
const EXPECT = { osm: { type: 1, label: 'vectoriel (MVT)', maxZoom: 15 }, terrain: { type: 4, label: 'WebP', maxZoom: 12 } }[kind];
const TYPES = { 0: 'inconnu', 1: 'vectoriel (MVT)', 2: 'PNG', 3: 'JPEG', 4: 'WebP', 5: 'AVIF' };
let ok = true;
const fail = m => { ok = false; console.log('✗ ' + m); }, pass = m => console.log('✓ ' + m), note = m => console.log('! ' + m);
const allowed = (h, o) => { const a = h.get('access-control-allow-origin'); return a === '*' || a === o; };

let head;
for (const origin of ORIGINS) {
  const r = await fetch(url, { headers: { Origin: origin, Range: 'bytes=0-126' } }).catch(e => fail(`réseau : ${e.message}`));
  if (!r) break;
  if (r.status !== 206) fail(`lecture partielle refusée (HTTP ${r.status}, 206 attendu)`);
  if (!allowed(r.headers, origin)) fail(`CORS absent pour ${origin} (Access-Control-Allow-Origin: ${r.headers.get('access-control-allow-origin') || 'absent'})`);
  else pass(`CORS accepté pour ${origin}`);
  head = head || new Uint8Array(await r.arrayBuffer());
}
const pre = await fetch(url, { method: 'OPTIONS', headers: { Origin: ORIGINS[1], 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'range' } }).catch(() => null);
// Une lecture Range simple n'exige pas de requête préalable selon la norme Fetch (Chrome, Edge : vérifié avec Mapterhorn).
// Un navigateur qui en enverrait une échouerait : à vérifier sur iPhone, et à autoriser sur notre propre stockage.
if (!pre || !pre.ok || !allowed(pre.headers, ORIGINS[1]) || !/range|\*/i.test(pre.headers.get('access-control-allow-headers') || '')) note(`requête préalable OPTIONS refusée (HTTP ${pre ? pre.status : 'réseau'}) : sans effet sur Chrome et Edge ; à tester sur iPhone. Sur notre stockage, autoriser GET et l'en-tête Range`);
else pass('requête préalable OPTIONS acceptée (en-tête Range autorisé)');

if (head && head.length >= 102) {
  const magic = new TextDecoder().decode(head.slice(0, 7));
  if (magic !== 'PMTiles' || head[7] !== 3) fail(`ce n'est pas un fichier PMTiles v3 (« ${magic} », version ${head[7]})`);
  else {
    const type = head[99], minZ = head[100], maxZ = head[101];
    pass(`PMTiles v3, tuiles ${TYPES[type] || type}, détail ${minZ} à ${maxZ}`);
    if (type !== EXPECT.type) fail(`tuiles ${TYPES[type] || type} : ${EXPECT.label} attendu pour « ${kind} »`);
    if (maxZ < EXPECT.maxZoom) note(`détail maximal ${maxZ} : l'application en attend ${EXPECT.maxZoom} pour « ${kind} »`);
  }
}
console.log(ok ? 'RÉSULTAT : fichier lisible par l\'application.' : 'RÉSULTAT : fichier NON lisible par l\'application, voir les ✗ ci-dessus.');
process.exit(ok ? 0 : 1);
