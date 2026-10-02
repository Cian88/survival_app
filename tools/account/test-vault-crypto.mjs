/* Tests du chiffrement de bout en bout (js/vault-crypto.js), sans réseau. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const V = createRequire(import.meta.url)('../../js/vault-crypto.js');

let t = Date.now();
const a = await V.fromPassword('Alice@Example.org ', 'correct horse battery', V.ITER);
const ms = Date.now() - t;
const b = await V.fromPassword('alice@example.org', 'correct horse battery', V.ITER);
assert.equal(a.authKey, b.authKey, 'E-mail normalisé : même clé de connexion');
assert.notEqual((await V.fromPassword('alice@example.org', 'autre mot de passe', 1000)).authKey, (await V.fromPassword('alice@example.org', 'correct horse battery', 1000)).authKey);
console.log(`PASS: dérivation du mot de passe (${V.ITER} itérations : ${ms} ms)`);

const code = V.newRecoveryCode();
assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){5}-[0-9A-HJKMNP-TV-Z]{2}$/);
assert.notEqual(code, V.newRecoveryCode());
assert.equal(V.cleanCode(code.toLowerCase().replace(/-/g, ' ')), V.cleanCode(code));
const dataKey = await V.newDataKey(), rec = await V.fromRecovery(code);
const keys = await V.makeKeys(dataKey, a.kek, rec.kek, 'password');
const state = { profile: { adults: 2, home: { lat: 42.6, lon: 1.6 } }, inventory: [{ name: 'Eau', qty: 12 }], notes: { rdv: 'Église' } };
const data = await V.encryptState(dataKey, state);
assert.ok(!data.includes('Église') && !data.includes('42.6'), 'Rien de lisible dans la sauvegarde');
const viaSecret = await V.unwrap(keys.bySecret, (await V.fromPassword('alice@example.org', 'correct horse battery', V.ITER)).kek);
assert.deepEqual(await V.decryptState(viaSecret, data), state);
const viaCode = await V.unwrap(keys.byRecovery, (await V.fromRecovery(code.toLowerCase())).kek);
assert.deepEqual(await V.decryptState(viaCode, data), state);
await assert.rejects(V.unwrap(keys.bySecret, (await V.fromPassword('alice@example.org', 'mauvais', 1000)).kek), /secret incorrect/);
await assert.rejects(V.unwrap(keys.byRecovery, (await V.fromRecovery(V.newRecoveryCode())).kek), /secret incorrect/);
console.log('PASS: clé des données emballée par le mot de passe et par le code de secours ; mauvais secrets refusés');

// Changement de secret : ré-emballage sans changer la clé des données (la sauvegarde reste lisible).
const ext = await V.unwrap(keys.byRecovery, rec.kek, true);
const p2 = await V.fromPhrase('user-1', 'une phrase de chiffrement', 1000);
const keys2 = await V.makeKeys(ext, p2.kek, rec.kek, 'phrase');
assert.deepEqual(await V.decryptState(await V.unwrap(keys2.bySecret, p2.kek), data), state);
console.log('PASS: ré-emballage (nouveau secret) sans rechiffrer les données');

const base = { a: 1, b: [1], c: 'x' };
const m = V.merge3(base, { a: 2, b: [1], c: 'x', d: 'local' }, { a: 1, b: [1, 2], c: 'y' });
assert.deepEqual(m.state, { a: 2, b: [1, 2], c: 'y', d: 'local' });
assert.deepEqual(m.conflicts, []);
const c2 = V.merge3(base, { a: 5, b: [1], c: 'x' }, { a: 6, b: [1], c: 'x' });
assert.equal(c2.state.a, 5); assert.deepEqual(c2.conflicts, ['a']);
assert.deepEqual(V.merge3(base, { a: 1, c: 'x' }, base).state, { a: 1, c: 'x' }, 'Suppression locale conservée');
assert.deepEqual(V.merge3(null, { a: 1 }, { b: 2 }).state, { a: 1, b: 2 }, 'Premier appareil : union');
console.log('PASS: fusion à trois voies par rubrique');
