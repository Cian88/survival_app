/* Tests de bout en bout du serveur de comptes : Worker et D1 locaux (wrangler dev), faux serveur de clés Google/Apple.
   Lancer : cd server && npm test */
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const V = createRequire(import.meta.url)('../../js/vault-crypto.js');
const DIR = fileURLToPath(new URL('..', import.meta.url)), STATE = '.wrangler/test-state', PORT = 8787 + Math.floor(Math.random() * 200), JWKS_PORT = PORT + 1000;
const WR = [process.execPath, [fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url))]];
const b64u = V.b64u, te = new TextEncoder();

/* ---------- Clés de test : Google, Apple (RS256), licences (ES256) ---------- */
const rsa = () => crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const keys = { google: await rsa(), apple: await rsa(), rogue: await rsa() };
const jwk = async (k, kid) => ({ ...(await crypto.subtle.exportKey('jwk', k.publicKey)), kid, alg: 'RS256', use: 'sig' });
const JWKS = { '/google': { keys: [await jwk(keys.google, 'g1')] }, '/apple': { keys: [await jwk(keys.apple, 'a1')] } };
const jwksServer = http.createServer((q, r) => { r.writeHead(JWKS[q.url] ? 200 : 404, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(JWKS[q.url] || {})); }).listen(JWKS_PORT, '127.0.0.1');
async function idToken(k, kid, claims) {
  const t = Math.floor(Date.now() / 1000), body = b64u(te.encode(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }))) + '.' + b64u(te.encode(JSON.stringify({ iat: t, exp: t + 600, ...claims })));
  return body + '.' + b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k.privateKey, te.encode(body)));
}
const lic = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
async function licence(payload) {
  const body = b64u(te.encode(JSON.stringify(payload)));
  return 'KS1.' + body + '.' + b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, lic.privateKey, te.encode(body)));
}

/* ---------- Worker local ---------- */
rmSync(new URL('../' + STATE, import.meta.url), { recursive: true, force: true });
execFileSync(WR[0], [...WR[1], 'd1', 'migrations', 'apply', 'holdout', '--local', '--persist-to', STATE], { cwd: DIR, stdio: 'ignore' });
const pub = await crypto.subtle.exportKey('jwk', lic.publicKey);
const vars = { MAIL_MODE: 'outbox', GOOGLE_CLIENT_IDS: 'test-web,test-ios', GOOGLE_JWKS_URL: `http://127.0.0.1:${JWKS_PORT}/google`, APPLE_AUDIENCES: 'com.holdout.app', APPLE_JWKS_URL: `http://127.0.0.1:${JWKS_PORT}/apple`, LICENCE_PUBLIC_JWK: JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }) };
const dev = spawn(WR[0], [...WR[1], 'dev', '--local', '--port', String(PORT), '--persist-to', STATE, '--show-interactive-dev-session=false', ...Object.entries(vars).flatMap(([k, v]) => ['--var', `${k}:${v}`])], { cwd: DIR, stdio: ['ignore', 'pipe', 'pipe'] });
let devLog = ''; dev.stdout.on('data', d => devLog += d); dev.stderr.on('data', d => devLog += d);
const API = `http://127.0.0.1:${PORT}`;
for (let i = 0; ; i++) { try { if ((await fetch(API + '/health')).ok) break; } catch (e) { } if (i > 120) { console.error(devLog); throw new Error('wrangler dev ne démarre pas'); } await new Promise(r => setTimeout(r, 500)); }
const finish = code => { dev.kill(); jwksServer.close(); process.exit(code); };
process.on('uncaughtException', e => { console.error(e); console.error(devLog.slice(-3000)); finish(1); });
process.on('unhandledRejection', e => { console.error(e); console.error(devLog.slice(-3000)); finish(1); });

const call = async (method, path, body, token) => {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch (e) { json = text; }
  return { status: r.status, body: json };
};
const outbox = to => JSON.parse(execFileSync(WR[0], [...WR[1], 'd1', 'execute', 'holdout', '--local', '--persist-to', STATE, '--json', '--command', `SELECT subject, body FROM outbox WHERE to_addr = '${to}' ORDER BY id DESC LIMIT 1`], { cwd: DIR, encoding: 'utf8' }))[0].results[0];
const link = (mail, path) => new URL(mail.body.match(new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`))[0]);

/* ---------- E-mail et mot de passe ---------- */
const alice = { id: crypto.randomUUID(), email: 'Alice@Example.org', ...(await V.fromPassword('alice@example.org', 'mot de passe d alice', V.ITER)) };
let r = await call('POST', '/auth/register', { id: alice.id, email: alice.email, authKey: alice.authKey, device: 'test' });
assert.equal(r.status, 201); assert.equal(r.body.user.email, 'alice@example.org'); assert.equal(r.body.user.emailVerified, false);
assert.deepEqual(r.body.user.providers, ['password']); assert.equal(r.body.keys, null); assert.equal(r.body.vault, null);
let aliceToken = r.body.token;
assert.equal((await call('POST', '/auth/register', { id: crypto.randomUUID(), email: 'alice@example.org', authKey: alice.authKey })).body.code, 'email_taken');
assert.equal((await call('POST', '/auth/register', { id: 'pas-un-uuid', email: 'b@example.org', authKey: alice.authKey })).status, 400);
const verifyMail = outbox('alice@example.org');
assert.match(verifyMail.subject, /Confirmez/);
let page = await fetch(API + link(verifyMail, '/auth/verify').pathname + link(verifyMail, '/auth/verify').search);
assert.equal(page.status, 200); assert.match(await page.text(), /Adresse confirmée/);
assert.equal((await call('GET', '/me', null, aliceToken)).body.user.emailVerified, true);
assert.equal((await fetch(API + link(verifyMail, '/auth/verify').pathname + link(verifyMail, '/auth/verify').search)).status, 400, 'Lien à usage unique');
console.log('PASS: inscription, adresse en double refusée, e-mail de confirmation à usage unique');

assert.equal((await call('POST', '/auth/login', { email: 'alice@example.org', authKey: (await V.fromPassword('alice@example.org', 'faux', 1000)).authKey })).status, 401);
r = await call('POST', '/auth/login', { email: ' ALICE@example.org', authKey: alice.authKey, device: 'téléphone' });
assert.equal(r.status, 200); assert.ok(r.body.token && r.body.token !== aliceToken);
const bob = await V.fromPassword('bob@example.org', 'mot de passe de bob', 1000);
await call('POST', '/auth/register', { id: crypto.randomUUID(), email: 'bob@example.org', authKey: bob.authKey });
const codes = [];
for (let i = 0; i < 11; i++) codes.push((await call('POST', '/auth/login', { email: 'bob@example.org', authKey: alice.authKey })).status);
assert.deepEqual(codes, [...Array(10).fill(401), 429], 'Limite : 10 tentatives par adresse et par quart d\'heure');
console.log('PASS: connexion, mauvais mot de passe refusé, tentatives limitées');

/* ---------- Sauvegarde chiffrée et clés ---------- */
assert.deepEqual((await call('GET', '/vault', null, aliceToken)).body, { version: 0 });
assert.equal((await call('PUT', '/vault', { baseVersion: 0, data: '{"v":1,"ct":"a"}' }, aliceToken)).body.version, 1);
r = await call('PUT', '/vault', { baseVersion: 0, data: '{"v":1,"ct":"b"}' }, aliceToken);
assert.equal(r.status, 409); assert.equal(r.body.version, 1, 'Conflit signalé avec la version du serveur');
assert.equal((await call('PUT', '/vault', { baseVersion: 1, data: '{"v":1,"ct":"c"}' }, aliceToken)).body.version, 2);
assert.equal((await call('GET', '/vault', null, aliceToken)).body.data, '{"v":1,"ct":"c"}');
assert.equal((await call('PUT', '/vault', { baseVersion: 2, data: 'x'.repeat(1600000) }, aliceToken)).status, 400, 'Taille limitée');
const k1 = { v: 1, mode: 'password', bySecret: { iv: 'a', ct: 'b' }, byRecovery: { iv: 'c', ct: 'd' } };
assert.equal((await call('PUT', '/vault/keys', { keys: k1, create: true }, aliceToken)).status, 200);
r = await call('PUT', '/vault/keys', { keys: { ...k1, mode: 'autre' }, create: true }, aliceToken);
assert.equal(r.status, 409); assert.deepEqual(r.body.keys, k1, 'Deux appareils ne peuvent pas créer chacun leurs clés');
assert.equal((await call('PUT', '/vault/keys', { keys: { ...k1, bySecret: { iv: 'e', ct: 'f' } } }, aliceToken)).status, 200);
r = await call('GET', '/me', null, aliceToken);
assert.equal(r.body.keys.bySecret.ct, 'f'); assert.equal(r.body.vault.version, 2);
console.log('PASS: sauvegarde versionnée (conflits détectés), clés créées une seule fois puis remplaçables');

/* ---------- Google ---------- */
const g = claims => idToken(keys.google, 'g1', { iss: 'https://accounts.google.com', aud: 'test-web', ...claims });
r = await call('POST', '/auth/google', { idToken: await g({ sub: 'g-alice', email: 'alice@example.org', email_verified: true }) });
assert.equal(r.status, 200); assert.equal(r.body.user.id, alice.id, 'Même adresse confirmée : même compte');
assert.deepEqual(r.body.user.providers.sort(), ['google', 'password']); assert.equal(r.body.created, false);
assert.equal((await call('POST', '/auth/google', { idToken: await g({ sub: 'g-alice', email: 'alice@example.org', email_verified: true, aud: 'test-ios' }) })).body.user.id, alice.id, 'Client iOS accepté');
r = await call('POST', '/auth/google', { idToken: await g({ sub: 'g-carol', email: 'carol@gmail.com', email_verified: true }) });
assert.equal(r.body.created, true); assert.equal(r.body.user.emailVerified, true); assert.deepEqual(r.body.user.providers, ['google']);
assert.equal((await call('POST', '/auth/google', { idToken: await g({ sub: 'x', aud: 'autre-appli' }) })).status, 401, 'Mauvaise application');
assert.equal((await call('POST', '/auth/google', { idToken: await g({ sub: 'x', exp: Math.floor(Date.now() / 1000) - 3600 }) })).status, 401, 'Jeton expiré');
assert.equal((await call('POST', '/auth/google', { idToken: await idToken(keys.rogue, 'g1', { iss: 'https://accounts.google.com', aud: 'test-web', sub: 'x' }) })).status, 401, 'Signature contrefaite');
assert.equal((await call('POST', '/auth/google', { idToken: await g({ sub: 'x', iss: 'https://evil.example' }) })).status, 401, 'Mauvais émetteur');
console.log('PASS: Google (rattachement par adresse confirmée, client iOS, jetons invalides refusés)');

/* ---------- Apple, et protection contre la prise de compte ---------- */
const a = claims => idToken(keys.apple, 'a1', { iss: 'https://appleid.apple.com', aud: 'com.holdout.app', ...claims });
r = await call('POST', '/auth/apple', { idToken: await a({ sub: 'a-dave', email: 'xyz@privaterelay.appleid.com', email_verified: 'true' }) });
assert.equal(r.body.created, true); assert.deepEqual(r.body.user.providers, ['apple']);
assert.equal((await call('POST', '/auth/apple', { idToken: await a({ sub: 'a-dave' }) })).body.user.id, r.body.user.id, 'Reconnexion sans e-mail dans le jeton');
const squat = await V.fromPassword('erin@example.org', 'mot de passe du squatteur', 1000);
const squatter = await call('POST', '/auth/register', { id: crypto.randomUUID(), email: 'erin@example.org', authKey: squat.authKey });
r = await call('POST', '/auth/apple', { idToken: await a({ sub: 'a-erin', email: 'erin@example.org', email_verified: true }) });
assert.equal(r.body.user.id, squatter.body.user.id); assert.deepEqual(r.body.user.providers, ['apple'], 'Mot de passe non confirmé retiré');
assert.equal((await call('GET', '/me', null, squatter.body.token)).status, 401, 'Sessions du compte non confirmé fermées');
assert.equal((await call('POST', '/auth/login', { email: 'erin@example.org', authKey: squat.authKey })).status, 401);
console.log('PASS: Apple (relais privé, reconnexion sans e-mail) et compte e-mail non confirmé repris par son vrai propriétaire');

/* ---------- Mot de passe oublié, changement de mot de passe ---------- */
assert.equal((await call('POST', '/auth/forgot', { email: 'personne@example.org' })).body.ok, true, 'Réponse identique pour une adresse inconnue');
await call('POST', '/auth/forgot', { email: 'alice@example.org' });
const resetUrl = link(outbox('alice@example.org'), '/auth/reset');
page = await fetch(API + resetUrl.pathname + resetUrl.search);
const html = await page.text();
assert.equal(page.status, 200); assert.match(html, /alice@example\.org/); assert.match(html, /holdout-password\|/);
const alice2 = await V.fromPassword('alice@example.org', 'nouveau mot de passe', V.ITER);
assert.equal((await call('POST', '/auth/reset', { token: resetUrl.searchParams.get('token'), authKey: alice2.authKey })).body.ok, true);
assert.equal((await call('GET', '/me', null, aliceToken)).status, 401, 'Sessions fermées après réinitialisation');
assert.equal((await call('POST', '/auth/reset', { token: resetUrl.searchParams.get('token'), authKey: alice2.authKey })).status, 400, 'Lien à usage unique');
aliceToken = (await call('POST', '/auth/login', { email: 'alice@example.org', authKey: alice2.authKey })).body.token;
assert.ok(aliceToken);
assert.equal((await call('POST', '/me/password', { currentAuthKey: alice.authKey, authKey: alice.authKey }, aliceToken)).status, 401);
assert.equal((await call('POST', '/me/password', { currentAuthKey: alice2.authKey, authKey: alice.authKey }, aliceToken)).body.ok, true);
assert.equal((await call('POST', '/auth/login', { email: 'alice@example.org', authKey: alice.authKey })).status, 200);
console.log('PASS: mot de passe oublié (page de réinitialisation, sessions fermées) et changement de mot de passe');

/* ---------- Licences Premium ---------- */
const good = await licence({ v: 1, id: 'lic-1', plan: 'annual', iat: 1, exp: Math.floor(Date.now() / 1000) + 86400 });
r = await call('POST', '/me/licences', { licence: good }, aliceToken);
assert.equal(r.status, 200); assert.deepEqual(r.body.licences, [good]);
await call('POST', '/me/licences', { licence: good }, aliceToken);
assert.equal((await call('GET', '/me', null, aliceToken)).body.licences.length, 1, 'Pas de doublon');
assert.equal((await call('POST', '/me/licences', { licence: await licence({ v: 1, id: 'adm', plan: 'admin' }) }, aliceToken)).body.code, 'admin_licence');
assert.equal((await call('POST', '/me/licences', { licence: await licence({ v: 1, id: 'old', plan: 'annual', exp: 1000 }) }, aliceToken)).body.code, 'expired_licence');
assert.equal((await call('POST', '/me/licences', { licence: good.slice(0, -20) + (good.at(-20) === 'A' ? 'B' : 'A') + good.slice(-19) }, aliceToken)).body.code, 'bad_licence');
assert.equal((await call('POST', '/me/appstore', { transactionId: '1' }, aliceToken)).status, 501, 'App Store non configuré : refus explicite');
console.log('PASS: licences rattachées au compte (signature vérifiée, admin et expirées refusées)');

/* ---------- Suppression du compte, CORS ---------- */
assert.equal((await call('DELETE', '/me', {}, aliceToken)).status, 400);
assert.equal((await call('DELETE', '/me', { confirm: 'SUPPRIMER' }, aliceToken)).body.deleted, true);
assert.equal((await call('GET', '/me', null, aliceToken)).status, 401);
assert.equal((await call('POST', '/auth/login', { email: 'alice@example.org', authKey: alice.authKey })).status, 401);
assert.equal((await call('POST', '/auth/google', { idToken: await g({ sub: 'g-alice', email: 'alice@example.org', email_verified: true }) })).body.created, true, 'Identité Google supprimée avec le compte');
const pre = await fetch(API + '/vault', { method: 'OPTIONS', headers: { Origin: 'capacitor://localhost', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization, content-type' } });
assert.equal(pre.status, 204); assert.equal(pre.headers.get('access-control-allow-origin'), '*'); assert.match(pre.headers.get('access-control-allow-headers'), /authorization/);
console.log('PASS: suppression complète du compte (exigence App Store) et CORS');
finish(0);
