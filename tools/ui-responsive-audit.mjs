/* Audit responsive de la webapp dans Edge (Windows) : chaque écran, à plusieurs tailles de téléphone et de tablette.
   Mesure : débordement horizontal, éléments qui sortent de l'écran, textes trop petits, zones tactiles trop petites,
   champs qui déclenchent le zoom d'iOS (police < 16 px). Captures dans le dossier donné.
   Lancer : node tools/ui-responsive-audit.mjs <dossier de sortie> [onglets séparés par des virgules] */
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url)), OUT = resolve(process.argv[2] || join(ROOT, '.tmp/responsive'));
const TABS = (process.argv[3] || 'now,audit,profile,bag,home,field,calc,gear,plan,notice,premium,map').split(',');
const SIZES = [['tel-360', 360, 740, true], ['tel-390', 390, 844, true], ['tel-430', 430, 932, true], ['tel-paysage', 844, 390, true],
  ['tab-768', 768, 1024, true], ['tab-820', 820, 1180, true], ['tab-1024', 1024, 1366, true], ['tab-paysage', 1180, 820, true], ['pc-1440', 1440, 900, false]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
await mkdir(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pbf': 'application/x-protobuf', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/\\/g, '/').replace(/^\/+/, '');
  try { const f = join(ROOT, p || 'index.html'), s = await stat(f); if (!s.isFile()) throw 0; res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); }
  catch { res.writeHead(404); res.end(); }
}).listen(8841, '127.0.0.1');
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9481', `--user-data-dir=${join(OUT, 'profil')}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let t; for (let i = 0; i < 160; i++) { try { t = await (await fetch('http://127.0.0.1:9481/json')).json(); if (t.find(x => x.type === 'page')) break; } catch (e) { } await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(), errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description); };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await cmd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result?.result?.value; };
await cmd('Runtime.enable'); await cmd('Page.enable');

// Compte d'essai hors ligne et données réalistes (profil rempli, inventaire, sacs, contacts).
await cmd('Page.navigate', { url: 'http://127.0.0.1:8841/index.html' }); await sleep(800);
await ev(`localStorage.setItem('holdout.dev.api', 'http://127.0.0.1:9')`);
await cmd('Page.navigate', { url: 'http://127.0.0.1:8841/index.html' }); await sleep(1500);
await ev(`(async () => { const g = () => document.querySelector('#authGate'); if (!g()) return;
  const f = g().querySelector('form[data-form="create"]'); f.elements.email.value = 'audit@example.org'; f.elements.password.value = 'mot de passe audit'; f.elements.password2.value = 'mot de passe audit'; f.requestSubmit();
  for (let i = 0; i < 100 && !g().querySelector('form[data-form="recovery-ok"]'); i++) await new Promise(r => setTimeout(r, 100));
  const r = g().querySelector('form[data-form="recovery-ok"]'); r.elements.ok.checked = true; r.requestSubmit(); })()`);
await sleep(800);
await ev(`(() => { const S = App.state; S.onboarded = true; Object.assign(S.profile, { adults: 2, children: 1, home: { lat: 45.76, lon: 4.84 } });
  S.inventory = [['Eau minérale 1,5 L (pack de 6)', 'eau', 4, 9, 0, '2027-05-01'], ['Riz long grain 1 kg', 'nourriture', 3, 0, 3500, '2028-01-01'], ['Conserves de lentilles cuisinées', 'nourriture', 8, 0, 450, '2026-11-15'], ['Piles AA alcalines', 'energie', 12, 0, 0, '']].map(([name, cat, qty, litres, kcal, expiry], i) => ({ id: 'i' + i, name, cat, qty, litres, kcal, expiry, where: 'Cellier' }));
  S.contacts = [{ id: 'c1', name: 'Marie Dupont-Lefèvre', phone: '06 12 34 56 78', role: 'Famille (hors zone)' }, { id: 'c2', name: 'Voisin', phone: '06 00 00 00 00', role: 'Voisinage' }];
  App.save(); })()`);
await ev(`App.go('bag')`); await sleep(300); await ev(`document.querySelector('[data-bagprefill]') && document.querySelector('[data-bagprefill]').click()`);
await ev(`App.go('home')`); await sleep(300); await ev(`document.querySelector('[data-act="homeessential"]') && document.querySelector('[data-act="homeessential"]').click()`);

const measure = `(() => {
  const W = innerWidth, vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length; };
  const inScroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
  const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const root = document.querySelector('.tab.on') || document.body, all = [...root.querySelectorAll('*'), ...document.querySelectorAll('#bottombar *, .workspace-bar *, .top *')].filter(vis);
  const out = all.filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > W + 1 || r.left < -1) && !inScroller(el); }).map(sel);
  const tiny = new Map(); for (const el of all) { if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const f = parseFloat(getComputedStyle(el).fontSize); if (f < 12) { const k = sel(el) + ' ' + f + 'px'; tiny.set(k, (tiny.get(k) || 0) + 1); } }
  const targets = all.filter(el => el.matches('button, a.btn, select, input:not([type=checkbox]):not([type=radio]), [role=tab], summary')).filter(el => { const r = el.getBoundingClientRect(); return r.height < 40 || (r.width < 40 && !el.matches('a')); }).map(el => sel(el) + ' ' + Math.round(el.getBoundingClientRect().width) + '×' + Math.round(el.getBoundingClientRect().height));
  const zoom = all.filter(el => el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea') && parseFloat(getComputedStyle(el).fontSize) < 16).length;
  const uniq = a => [...new Set(a)];
  return JSON.stringify({ overflow: document.documentElement.scrollWidth > W + 1 ? document.documentElement.scrollWidth - W : 0, out: uniq(out).slice(0, 6), tiny: [...tiny].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => k + ' ×' + n), targets: uniq(targets).slice(0, 6), targetCount: targets.length, zoomInputs: zoom, height: document.documentElement.scrollHeight });
})()`;
const report = {};
for (const [name, w, h, mobile] of SIZES) {
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await cmd('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  for (const tab of TABS) {
    await ev(`App.go('${tab}')`); await sleep(tab === 'map' ? 1500 : 250);
    const m = JSON.parse(await ev(measure)); report[name + ' ' + tab] = m;
    const r = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(tab === 'map' ? h : m.height, 2600), scale: 1 } });
    await writeFile(join(OUT, `${name}-${tab}.jpg`), Buffer.from(r.result.data, 'base64'));
  }
  if (mobile) { await ev(`App.go('now')`); }
}
await writeFile(join(OUT, 'rapport.json'), JSON.stringify({ report, errors }, null, 1));
// Synthèse par taille
for (const [name] of SIZES) {
  const rows = Object.entries(report).filter(([k]) => k.startsWith(name + ' '));
  console.log(`\n== ${name} : débordement sur ${rows.filter(([, m]) => m.overflow).map(([k]) => k.split(' ')[1]).join(', ') || 'aucun écran'} ; champs zoom iOS ${rows.reduce((a, [, m]) => a + m.zoomInputs, 0)} ; cibles < 40 px ${rows.reduce((a, [, m]) => a + m.targetCount, 0)}`);
  for (const [k, m] of rows) if (m.out.length || m.overflow) console.log(`  ${k.split(' ')[1]} : +${m.overflow}px, sort de l'écran : ${m.out.join(' | ')}`);
}
console.log('\nTextes < 12 px les plus fréquents (tel-390) :'); const tiny = new Map();
for (const [k, m] of Object.entries(report)) if (k.startsWith('tel-390')) for (const x of m.tiny) { const [s, n] = x.split(' ×'); tiny.set(s, (tiny.get(s) || 0) + +n); }
console.log([...tiny].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([s, n]) => `  ${s} ×${n}`).join('\n'));
console.log('\nCibles tactiles < 40 px (tel-390, exemples) :'); console.log([...new Set(Object.entries(report).filter(([k]) => k.startsWith('tel-390')).flatMap(([, m]) => m.targets))].slice(0, 18).map(s => '  ' + s).join('\n'));
console.log('\nErreurs JS :', errors.length ? errors : 'aucune');
ws.close(); edge.kill(); server.close(); process.exit(0);
