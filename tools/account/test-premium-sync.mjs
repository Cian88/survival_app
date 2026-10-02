/* Régression : clés signées, rattachement différé et restauration sur un autre appareil.
   Exécution entièrement locale ; aucun compte ni secret de production. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
async function signed(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new TextEncoder().encode(body));
  return 'KS1.' + body + '.' + Buffer.from(sig).toString('base64url');
}
const admin = await signed({ v: 1, id: 'test-admin', plan: 'admin' });
const annual = await signed({ v: 1, id: 'test-annual', plan: 'annual', exp: Math.floor(Date.now() / 1000) + 86400 });
const lifetime = await signed({ v: 1, id: 'test-life', plan: 'lifetime' });
const expired = await signed({ v: 1, id: 'test-expired', plan: 'admin', exp: 1 });
const tampered = admin.slice(0, -20) + (admin.at(-20) === 'A' ? 'B' : 'A') + admin.slice(-19);
const source = name => readFileSync(new URL('../../js/' + name + '.js', import.meta.url), 'utf8');
const account = () => ({ id: 'test-user', email: 'test@example.org', provider: 'password', token: 'test-session', unlocked: true });

async function client({ storage = new Map(), licences = [], native = false, devAdmin = false } = {}) {
  if (!storage.has('holdout.account')) storage.set('holdout.account', JSON.stringify(account()));
  const remote = { licences: [...licences], posts: 0, fail: null, sessionExpired: false };
  const status = { textContent: '' };
  let gate = null;
  const body = { children: [], appendChild: el => { gate = el; body.children.push(el); } };
  const sandbox = {
    crypto, TextEncoder, TextDecoder, Uint8Array, atob, AbortController,
    setTimeout, clearTimeout, setInterval: () => 0,
    navigator: { onLine: false },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    KS_CONFIG: { licensePublicKeyJwk: pub, devAdmin, iap: {} },
    document: { body, querySelector: s => s === '#acctStatus' ? status : s === '#authGate' ? gate : null,
      createElement: () => ({ dataset: {}, setAttribute() {}, addEventListener() {}, querySelector: () => null, remove() { gate = null; } }), addEventListener() {} },
    addEventListener() {},
    App: { state: {}, refresh() {}, applyState() {} },
    Store: { idb: { get: async () => ({ testKey: true }) } },
    VaultCrypto: { same: (a, b) => JSON.stringify(a) === JSON.stringify(b), encryptState: async () => 'test-encrypted-vault' },
    fetch: async (url, opts) => {
      const path = new URL(url).pathname;
      if (path === '/auth/google') return { ok: true, json: async () => remote.login };
      if (path === '/me/licences') {
        remote.posts++;
        if (remote.fail === 'network') throw new Error('network');
        if (remote.fail) return { ok: false, status: 400, json: async () => ({ error: 'Licence refusée.', code: 'bad_licence' }) };
        const tok = JSON.parse(opts.body).licence;
        if (!remote.licences.includes(tok)) remote.licences.push(tok);
      }
      if (remote.sessionExpired) return { ok: false, status: 401, json: async () => ({ error: 'Session expirée.' }) };
      return { ok: true, json: async () => path === '/vault' ? { version: 1 } : { user: { emailVerified: true, providers: ['password'] }, licences: [...remote.licences] } };
    },
  };
  if (native) sandbox.Native = { isNative: true, Purchases: { getPurchases: async () => ({ purchases: [] }), getProducts: async () => ({ products: [] }) } };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(source('premium'), context);
  vm.runInContext(source('account'), context);
  await sandbox.Account.init(); // Hors ligne : charge la clé de données sans synchronisation concurrente.
  await new Promise(resolve => setImmediate(resolve));
  return { ...sandbox, remote, storage, status, connect: async () => { sandbox.navigator.onLine = true; await sandbox.Account.sync(); } };
}

const first = await client();
await first.Premium.activate(admin);
assert.equal(first.Premium.state.lic.plan, 'admin');
assert.equal(first.remote.posts, 0, 'Activation hors ligne sans requête');
assert.deepEqual(JSON.parse(first.storage.get('holdout.account')).pendingLicences, [admin], 'Attente persistée sur disque');
const reopened = await client({ storage: first.storage });
await reopened.connect();
assert.equal(reopened.remote.posts, 1, 'Reprise après fermeture et retour du réseau');
assert.deepEqual(JSON.parse(reopened.storage.get('holdout.account')).pendingLicences, []);
await reopened.Account.sync();
assert.equal(reopened.remote.posts, 1, 'Pas de rattachement en double');

const second = await client({ licences: [annual, lifetime, expired, tampered, admin] });
await second.connect();
assert.equal(second.Premium.state.token, admin, 'Clé admin prioritaire et restaurée sur un autre appareil');
assert.equal(second.remote.posts, 0, 'Restauration sans boucle de rattachement');
second.navigator.onLine = false;
await second.Premium.load();
assert.equal(second.Premium.isPremium(), true, 'Premium conservé hors ligne après restauration');

const upgrade = await client({ licences: [annual, admin] });
await upgrade.Premium.activate(annual, { fromAccount: true });
await upgrade.connect();
assert.equal(upgrade.Premium.state.token, admin, 'Clé admin retrouvée malgré une licence annuelle déjà active');

const legacy = await client();
await legacy.Premium.activate(admin, { fromAccount: true });
await legacy.connect();
assert.equal(legacy.remote.posts, 1, 'Ancienne clé locale rattachée automatiquement');

const failed = await client();
await failed.Premium.activate(admin);
failed.remote.fail = 'network';
await failed.connect();
assert.equal(failed.Premium.isPremium(), true, 'Panne serveur sans perte de Premium local');
assert.match(failed.status.textContent, /Rattachement au compte en attente/);
assert.deepEqual(JSON.parse(failed.storage.get('holdout.account')).pendingLicences, [admin]);
failed.remote.fail = 'bad_licence';
await failed.Account.sync();
assert.match(failed.status.textContent, /Licence refusée/, 'Refus serveur visible');
failed.remote.fail = null;
await failed.Account.sync();
assert.deepEqual(JSON.parse(failed.storage.get('holdout.account')).pendingLicences, []);
assert.equal(failed.Account.user.licenceError, null, 'Erreur effacée après reprise');

const invalid = await client({ licences: [expired, tampered] });
await invalid.connect();
assert.equal(invalid.Premium.isPremium(), false, 'Clés invalides ou expirées non restaurées');
await assert.rejects(() => invalid.Premium.activate(tampered));
assert.equal(invalid.remote.posts, 0, 'Clé falsifiée jamais envoyée');

const switched = await client();
await switched.Premium.activate(admin);
switched.remote.login = { user: { id: 'another-user', email: 'another@example.org' }, token: 'another-session', keys: { mode: 'phrase' }, licences: [] };
switched.navigator.onLine = true;
await switched.Account.loginWithIdToken('google', { idToken: 'test-id-token' });
assert.equal(switched.Account.user.id, 'another-user');
assert.equal(switched.storage.has('survie.licence'), false, 'Clé locale retirée au changement de compte');
assert.deepEqual(JSON.parse(switched.storage.get('holdout.account')).pendingLicences, [], 'Attente isolée par compte');

const same = await client();
await same.Premium.activate(admin);
same.remote.login = { user: { id: 'test-user', email: 'test@example.org' }, token: 'renewed-session', keys: { mode: 'phrase' }, licences: [] };
same.navigator.onLine = true;
await same.Account.loginWithIdToken('google', { idToken: 'test-id-token' });
assert.deepEqual(JSON.parse(same.storage.get('holdout.account')).pendingLicences, [admin], 'Attente conservée à la reconnexion du même compte');

const ios = await client({ licences: [admin], native: true });
await ios.connect();
assert.equal(ios.Premium.isPremium(), false, 'Admin réservé aux builds iOS internes');
const iosInternal = await client({ licences: [admin], native: true, devAdmin: true });
await iosInternal.connect();
assert.equal(iosInternal.Premium.state.token, admin, 'Admin restauré sur un build iOS interne');
console.log('PASS: activation hors ligne, reprise après fermeture, restauration admin, priorité, migration, erreurs visibles et vérification des signatures');
