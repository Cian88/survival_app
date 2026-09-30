#!/usr/bin/env node
/* Outil de licences Holdout (Node 18+).
   Les licences sont des jetons signés ECDSA P-256 (SHA-256), vérifiés hors ligne par l'application.

   node tools/license.mjs keygen                 → crée license-keys/private.jwk (à garder SECRET, hors dépôt)
                                                    et écrit la clé publique dans js/config.js (mode test désactivé)
   node tools/license.mjs issue --plan annual --email client@exemple.fr [--months 12] [--key chemin.jwk] [--sid cs_...]
   node tools/license.mjs verify <jeton> [--pub chemin.jwk]

   Plans : annual (12 mois), lifetime (sans expiration), admin (toutes les fonctions, sans expiration). */
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify, createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), cmd = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i > 0 ? args[i + 1] : undefined; };
const b64u = b => Buffer.from(b).toString('base64url');
const PLANS = { annual: 12, lifetime: null, admin: null };

function issue(privJwk, { plan, email, months, sid }) {
  if (!(plan in PLANS)) throw new Error('plan inconnu : ' + plan);
  const now = new Date(), m = months != null ? +months : PLANS[plan];
  let exp = null;
  if (m) { const d = new Date(now); d.setMonth(d.getMonth() + m); exp = Math.floor(d.getTime() / 1000); }
  const payload = { v: 1, id: randomUUID(), plan, iat: Math.floor(now.getTime() / 1000), exp,
    who: email ? email.replace(/^(.).*(@.*)$/, '$1•••$2') : undefined,
    eh: email ? createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 16) : undefined, sid };
  const body = b64u(JSON.stringify(payload));
  const key = createPrivateKey({ key: privJwk, format: 'jwk' });
  const sig = sign('sha256', Buffer.from(body), { key, dsaEncoding: 'ieee-p1363' });
  return 'KS1.' + body + '.' + b64u(sig);
}
function check(pubJwk, token) {
  const [pre, body, sig] = token.trim().split('.');
  if (pre !== 'KS1') throw new Error('format inconnu');
  const ok = verify('sha256', Buffer.from(body), { key: createPublicKey({ key: pubJwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'));
  return { ok, payload: JSON.parse(Buffer.from(body, 'base64url').toString()) };
}
function writeConfigKey(pub, testMode) {
  const p = join(root, 'js/config.js'); let s = readFileSync(p, 'utf8');
  s = s.replace(/licensePublicKeyJwk: [^\n]*\n/, `licensePublicKeyJwk: ${JSON.stringify(pub)},\n`).replace(/testMode: (true|false)/, `testMode: ${testMode}`);
  writeFileSync(p, s);
}

if (cmd === 'keygen') {
  const dir = opt('out') || join(root, 'license-keys');
  if (existsSync(join(dir, 'private.jwk')) && !args.includes('--force')) throw new Error('une clé existe déjà (utilisez --force pour la remplacer : les licences déjà émises deviendront invalides)');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  mkdirSync(dir, { recursive: true });
  const priv = privateKey.export({ format: 'jwk' }), pub = publicKey.export({ format: 'jwk' });
  writeFileSync(join(dir, 'private.jwk'), JSON.stringify(priv), { mode: 0o600 });
  writeFileSync(join(dir, 'public.jwk'), JSON.stringify(pub));
  if (!args.includes('--no-config')) writeConfigKey(pub, args.includes('--test'));
  console.log('Clé privée : ' + join(dir, 'private.jwk') + '  (NE JAMAIS la publier ni la committer)');
  console.log('Clé publique écrite dans js/config.js');
} else if (cmd === 'issue') {
  const kp = opt('key') || join(root, 'license-keys/private.jwk');
  console.log(issue(JSON.parse(readFileSync(kp, 'utf8')), { plan: opt('plan') || 'annual', email: opt('email'), months: opt('months'), sid: opt('sid') }));
} else if (cmd === 'verify') {
  const pp = opt('pub') || join(root, 'license-keys/public.jwk');
  console.log(JSON.stringify(check(JSON.parse(readFileSync(pp, 'utf8')), args[1]), null, 1));
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n'));
}
