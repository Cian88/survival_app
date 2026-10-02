/* Test de bout en bout des comptes dans Edge (Windows) : app servie en local, serveur de comptes local (wrangler dev),
   plusieurs « appareils » (profils de navigateur séparés), passages hors ligne simulés.
   Lancer : node tools/account/e2e.mjs   (Edge et server/node_modules requis) */
import assert from 'node:assert/strict';
import http from 'node:http';
import { createReadStream, rmSync, mkdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const V = createRequire(import.meta.url)('../../js/vault-crypto.js');
const ROOT = fileURLToPath(new URL('../..', import.meta.url)), SERVER = join(ROOT, 'server'), WORK = join(tmpdir(), 'holdout-e2e-' + Date.now());
const APP_PORT = 8811, API_PORT = 8812, EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const WR = [process.execPath, join(SERVER, 'node_modules/wrangler/bin/wrangler.js')], STATE = join(WORK, 'd1');
const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(WORK, { recursive: true });

/* ---------- App et serveur locaux ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.pbf': 'application/x-protobuf' };
const app = http.createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/\\/g, '/').replace(/^\/+/, '');
  try { const f = join(ROOT, p || 'index.html'), s = await stat(f); if (!s.isFile()) throw 0; res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(res); }
  catch { res.writeHead(404); res.end(); }
}).listen(APP_PORT, '127.0.0.1');
/* Faux fournisseur Google : jetons signés par une clé de test, publiée comme le fait Google. */
const gkey = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const JWKS_PORT = API_PORT + 1, gjwk = { ...(await crypto.subtle.exportKey('jwk', gkey.publicKey)), kid: 'g1', alg: 'RS256', use: 'sig' };
const jwks = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'application/json' }); r.end(JSON.stringify({ keys: [gjwk] })); }).listen(JWKS_PORT, '127.0.0.1');
async function googleToken(claims) {
  const t = Math.floor(Date.now() / 1000), enc = o => V.b64u(new TextEncoder().encode(JSON.stringify(o)));
  const body = enc({ alg: 'RS256', kid: 'g1', typ: 'JWT' }) + '.' + enc({ iss: 'https://accounts.google.com', aud: 'test-web', iat: t, exp: t + 600, email_verified: true, ...claims });
  return body + '.' + V.b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', gkey.privateKey, new TextEncoder().encode(body)));
}
execFileSync(WR[0], [WR[1], 'd1', 'migrations', 'apply', 'holdout', '--local', '--persist-to', STATE], { cwd: SERVER, stdio: 'ignore' });
const api = spawn(WR[0], [WR[1], 'dev', '--local', '--port', String(API_PORT), '--persist-to', STATE, '--show-interactive-dev-session=false', '--var', 'MAIL_MODE:outbox', '--var', 'GOOGLE_CLIENT_IDS:test-web', '--var', `GOOGLE_JWKS_URL:http://127.0.0.1:${JWKS_PORT}/`], { cwd: SERVER, stdio: 'ignore' });
const API = `http://127.0.0.1:${API_PORT}`;
for (let i = 0; ; i++) { try { if ((await fetch(API + '/health')).ok) break; } catch (e) { } if (i > 120) throw new Error('serveur local absent'); await sleep(500); }
const outbox = to => JSON.parse(execFileSync(WR[0], [WR[1], 'd1', 'execute', 'holdout', '--local', '--persist-to', STATE, '--json', '--command', `SELECT body FROM outbox WHERE to_addr = '${to}' ORDER BY id DESC LIMIT 1`], { cwd: SERVER, encoding: 'utf8' }))[0].results[0].body;

/* ---------- Appareils : une instance d'Edge par profil ---------- */
let port = 9400;
async function device(name) {
  const dbg = port++, edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${join(WORK, name)}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); if (targets.length) break; } catch (e) { } await sleep(250); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(), errors = [], requests = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url); };
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(name + ' : ' + r.result.exceptionDetails.exception?.description); return r.result?.result?.value; };
  const until = async (expr, what, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(expr)) return; await sleep(250); } throw new Error(`${name} : attente dépassée (${what}) — vue ${await ev("document.querySelector('#authGate')?.dataset.view || 'app'")}, erreur ${await ev("document.querySelector('.auth-error')?.textContent || ''")}`); };
  await cmd('Runtime.enable'); await cmd('Network.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1100, height: 860, deviceScaleFactor: 1, mobile: false });
  const d = {
    name, ev, until, errors, requests, cmd,
    async open() { await cmd('Page.navigate', { url: `http://127.0.0.1:${APP_PORT}/index.html` }); await until(`!!window.Account && (document.querySelector('#authGate') || Account.user)`, 'démarrage'); },
    async offline(off) { await cmd('Network.emulateNetworkConditions', { offline: off, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await ev(`window.dispatchEvent(new Event('${off ? 'offline' : 'online'}'))`); },
    view: () => ev(`document.querySelector('#authGate')?.dataset.view || null`),
    async fill(form, values) {
      await until(`!!document.querySelector('#authGate form[data-form="${form}"]')`, 'formulaire ' + form);
      await ev(`(() => { const f = document.querySelector('#authGate form[data-form="${form}"]'); const v = ${JSON.stringify(values)};
        for (const [k, x] of Object.entries(v)) { const i = f.elements[k]; if (i.type === 'checkbox') i.checked = x; else i.value = x; } f.requestSubmit(); })()`);
    },
    async tab(t) { await ev(`document.querySelector('#authGate [data-ag="tab-${t}"]').click()`); },
    async acceptRecovery() { await until(`document.querySelector('#authGate')?.dataset.view === 'recovery'`, 'code de secours'); const code = await ev(`document.querySelector('.auth-code').textContent`); await d.fill('recovery-ok', { ok: true }); await until(`!document.querySelector('#authGate')`, 'entrée dans l\'app'); return code; },
    user: () => ev(`JSON.parse(JSON.stringify(Account.user))`),
    async synced(after = 0) { await until(`Account.user && Account.user.lastSync > ${after} && !Account.user.pending`, 'synchronisation', 40000); },
    close() { ws.close(); edge.kill(); },
  };
  await cmd('Page.navigate', { url: `http://127.0.0.1:${APP_PORT}/index.html` }); await sleep(800);
  await ev(`localStorage.setItem('holdout.dev.api', ${JSON.stringify(API)})`);
  return d;
}

try {
  /* 1. Création d'un compte e-mail, en ligne */
  const A = await device('A'); await A.open();
  assert.equal(await A.view(), 'start', 'Écran de connexion au premier lancement');
  assert.equal(await A.ev(`document.querySelector('#main').inert`), true, 'App inaccessible sans compte');
  await A.fill('create', { email: 'alice@test.org', password: 'court', password2: 'court' });
  await A.until(`/trop court/.test(document.querySelector('.auth-error')?.textContent || '')`, 'mot de passe trop court');
  await A.fill('create', { email: 'Alice@Test.org', password: 'mot de passe Alice 1', password2: 'mot de passe Alice 1' });
  const code = await A.acceptRecovery();
  let u = await A.user();
  assert.ok(u.token && !u.pending && u.email === 'alice@test.org' && u.keys.mode === 'password');
  assert.equal(await A.ev(`document.querySelector('#main').inert`), false);
  await A.ev(`App.state.contacts.push({ id: 'c1', name: 'Maman', phone: '0600000000', role: 'famille' }); App.state.onboarded = true; App.save()`);
  await A.synced();
  const vault = await (await fetch(API + '/vault', { headers: { Authorization: 'Bearer ' + u.token } })).json();
  assert.ok(vault.version >= 1 && !vault.data.includes('Maman'), 'Sauvegarde chiffrée sur le serveur');
  await A.ev(`App.go('profile')`);
  assert.match(await A.ev(`document.querySelector('#accountCard')?.innerText || ''`), /alice@test\.org[\s\S]*Sauvegarde chiffrée à jour/);
  console.log('PASS: création en ligne, code de secours, sauvegarde chiffrée envoyée, carte « Mon compte »');

  /* 2. Deuxième appareil : connexion, restauration, modifications croisées */
  const B = await device('B'); await B.open();
  await B.tab('login'); await B.fill('login', { email: 'alice@test.org', password: 'mot de passe Alice 1' });
  await B.until(`!document.querySelector('#authGate')`, 'connexion B'); await B.synced();
  assert.equal(await B.ev(`App.state.contacts.map(c => c.name).join()`), 'Maman', 'Données restaurées sur le 2e appareil');
  const tB = (await B.user()).lastSync;
  await B.ev(`App.state.inventory.push({ id: 'i1', name: 'Eau 5 L', cat: 'eau', qty: 4, litres: 5, kcal: 0 }); App.save()`); await B.ev(`Account.sync()`); await B.synced(tB);
  const tA = (await A.user()).lastSync;
  await A.ev(`App.state.notes.rdv = 'Église du village'; App.save()`); await A.ev(`Account.sync()`); await A.synced(tA);
  await B.ev(`Account.sync()`); await B.until(`App.state.notes.rdv === 'Église du village'`, 'fusion sur B');
  await A.ev(`Account.sync()`); await A.until(`App.state.inventory.some(i => i.name === 'Eau 5 L')`, 'fusion sur A');
  console.log('PASS: 2e appareil restauré, modifications des deux appareils fusionnées');

  /* 3. Déconnexion, puis reconnexion hors ligne */
  await B.ev(`document.querySelector('[data-acct="logout"]') || (App.go('profile'), 0)`);
  await B.ev(`App.go('profile')`); await B.ev(`document.querySelector('[data-acct="logout"]').click()`);
  await B.until(`!!document.querySelector('.modal [data-ok]')`, 'confirmation'); await B.ev(`document.querySelector('.modal [data-ok]').click()`);
  await B.until(`document.querySelector('#authGate')?.dataset.view === 'start'`, 'retour à l\'écran de connexion');
  await B.offline(true); const before = B.requests.length;
  await B.fill('login', { email: 'alice@test.org', password: 'mauvais mot de passe' });
  await B.until(`/incorrect/.test(document.querySelector('.auth-error')?.textContent || '')`, 'refus hors ligne');
  await B.fill('login', { email: 'alice@test.org', password: 'mot de passe Alice 1' });
  await B.until(`!document.querySelector('#authGate')`, 'connexion hors ligne');
  assert.equal(B.requests.slice(before).filter(x => x.startsWith(API)).length, 0, 'Aucune requête au serveur hors ligne');
  assert.equal(await B.ev(`App.state.notes.rdv`), 'Église du village');
  await B.offline(false); await B.synced();
  console.log('PASS: déconnexion, connexion hors ligne (mauvais mot de passe refusé), reprise de la synchro au retour du réseau');

  /* 4. Création de compte hors ligne, enregistrée au retour du réseau */
  const C = await device('C'); await C.open(); await C.offline(true);
  await C.fill('create', { email: 'carl@test.org', password: 'mot de passe Carl 1', password2: 'mot de passe Carl 1' });
  await C.acceptRecovery();
  u = await C.user(); assert.equal(u.pending, 'register'); assert.ok(!u.token);
  await C.ev(`App.state.contacts.push({ id: 'c9', name: 'Voisin', phone: '1', role: '' }); App.save()`);
  await C.offline(false); await C.synced();
  assert.equal((await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'carl@test.org', authKey: (await V.fromPassword('carl@test.org', 'mot de passe Carl 1')).authKey }) })).status, 200, 'Compte enregistré sur le serveur');
  console.log('PASS: compte créé hors ligne, utilisable aussitôt, enregistré et sauvegardé au retour du réseau');

  /* 5. Mot de passe oublié : nouveau mot de passe par e-mail, code de secours pour déverrouiller */
  await fetch(API + '/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alice@test.org' }) });
  const token = outbox('alice@test.org').match(/reset\?token=([A-Za-z0-9_-]+)/)[1];
  assert.equal((await fetch(API + '/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, authKey: (await V.fromPassword('alice@test.org', 'nouveau mot de passe A')).authKey }) })).status, 200);
  await A.ev(`Account.sync()`); await A.until(`Account.user.pending === 'relogin'`, 'session fermée détectée');
  await A.until(`!document.querySelector('#accountBanner').hidden`, 'bandeau de reconnexion');
  await A.ev(`document.querySelector('[data-acct="reconnect"]').click()`);
  await A.fill('login', { email: 'alice@test.org', password: 'nouveau mot de passe A' });
  await A.until(`document.querySelector('#authGate')?.dataset.view === 'recovery-enter'`, 'demande du code de secours');
  await A.fill('recovery-enter', { code: code.toLowerCase().replace(/-/g, ' ') });
  await A.until(`!document.querySelector('#authGate')`, 'déverrouillage par code'); await A.synced();
  await B.ev(`Account.sync()`); await B.until(`Account.user.pending === 'relogin'`, 'B déconnecté aussi');
  await B.ev(`document.querySelector('[data-acct="reconnect"]').click()`);
  await B.fill('login', { email: 'alice@test.org', password: 'nouveau mot de passe A' });
  await B.until(`!document.querySelector('#authGate')`, 'B reconnecté sans code (clés ré-emballées)');
  console.log('PASS: mot de passe oublié → code de secours une fois → clés ré-emballées pour les autres appareils');

  /* 6. Suppression du compte */
  await A.ev(`App.go('profile')`); await A.ev(`document.querySelector('[data-acct="delete"]').click()`);
  await A.until(`!!document.querySelector('.modal input')`, 'confirmation de suppression');
  await A.ev(`(() => { document.querySelector('.modal input').value = 'SUPPRIMER'; document.querySelector('.modal form').requestSubmit(); })()`);
  await A.until(`/Compte supprimé/.test(document.querySelector('.auth-error')?.textContent || '')`, 'compte supprimé');
  assert.equal((await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alice@test.org', authKey: (await V.fromPassword('alice@test.org', 'nouveau mot de passe A')).authKey }) })).status, 401);
  console.log('PASS: suppression du compte depuis l\'app');

  /* 7. Compte Google : phrase de chiffrement, reconnexion hors ligne avec la phrase, 2e appareil */
  const D = await device('D'); await D.open();
  const gtok = async () => ({ idToken: await googleToken({ sub: 'g-dora', email: 'dora@gmail.com' }) });
  await D.ev(`(async () => Account.loginWithIdToken('google', ${JSON.stringify(await gtok())}))()`);
  await D.until(`document.querySelector('#authGate')?.dataset.view === 'phrase-new'`, 'choix de la phrase');
  await D.fill('phrase-new', { phrase: 'une phrase de Dora', phrase2: 'autre phrase de Dora' });
  await D.until(`/correspondent pas/.test(document.querySelector('.auth-error')?.textContent || '')`, 'phrases différentes refusées');
  await D.fill('phrase-new', { phrase: 'une phrase de Dora', phrase2: 'une phrase de Dora' });
  await D.acceptRecovery();
  u = await D.user(); assert.equal(u.provider, 'google'); assert.equal(u.keys.mode, 'phrase');
  await D.ev(`App.state.contacts.push({ id: 'd1', name: 'Frère', phone: '2', role: '' }); App.save()`); await D.ev('Account.sync()'); await D.synced();
  await D.ev(`App.go('profile')`); await D.ev(`document.querySelector('[data-acct="logout"]').click()`);
  await D.until(`!!document.querySelector('.modal [data-ok]')`, 'confirmation'); await D.ev(`document.querySelector('.modal [data-ok]').click()`);
  await D.until(`document.querySelector('#authGate')?.dataset.view === 'start'`, 'écran de connexion');
  await D.offline(true);
  assert.equal(await D.ev(`!!document.querySelector('[data-ag="apple"]:not([disabled]), #gsiButton iframe')`), false, 'Google indisponible hors ligne');
  await D.ev(`document.querySelector('[data-ag="unlock-local"]').click()`);
  await D.fill('unlock', { secret: 'mauvaise phrase' });
  await D.until(`/incorrecte/.test(document.querySelector('.auth-error')?.textContent || '')`, 'phrase refusée');
  await D.fill('unlock', { secret: 'une phrase de Dora' });
  await D.until(`!document.querySelector('#authGate')`, 'déverrouillage hors ligne par la phrase');
  assert.equal((await D.user()).pending, 'oauth');
  await D.offline(false);
  await D.until(`!document.querySelector('#accountBanner').hidden && /Google/.test(document.querySelector('#accountBanner').textContent)`, 'bandeau « reconnectez Google »');
  await D.ev(`(async () => Account.loginWithIdToken('google', ${JSON.stringify(await gtok())}))()`);
  await D.until(`!document.querySelector('#authGate') && Account.user.token && !Account.user.pending`, 'reconnexion Google sans redemander la phrase');
  await D.synced();
  const E = await device('E'); await E.open();
  await E.ev(`(async () => Account.loginWithIdToken('google', ${JSON.stringify(await gtok())}))()`);
  await E.until(`document.querySelector('#authGate')?.dataset.view === 'unlock'`, 'phrase demandée sur le 2e appareil');
  await E.fill('unlock', { secret: 'une phrase de Dora' });
  await E.until(`!document.querySelector('#authGate')`, 'entrée'); await E.synced();
  assert.equal(await E.ev(`App.state.contacts.map(c => c.name).join()`), 'Frère');
  console.log('PASS: compte Google : phrase de chiffrement, reconnexion hors ligne par la phrase, bandeau de reconnexion, 2e appareil');

  for (const d of [A, B, C, D, E]) assert.deepEqual(d.errors, [], d.name + ' : erreurs JavaScript');
  console.log('PASS: aucune erreur JavaScript');
  for (const d of [A, B, C, D, E]) d.close();
} finally {
  api.kill(); app.close(); jwks.close();
  try { rmSync(WORK, { recursive: true, force: true }); } catch (e) { }
}
