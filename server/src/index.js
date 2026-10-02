/* holdout-api : comptes Holdout (Cloudflare Worker + D1).
   Connexion par e-mail et mot de passe (le mot de passe ne quitte jamais l'appareil : seule une clé dérivée arrive ici),
   par Google ou par Apple ; sauvegarde chiffrée de bout en bout ; licences Premium rattachées au compte.
   L'application fonctionne hors ligne : ce serveur sert à créer le compte, synchroniser et retrouver Premium. */
import { now, randomToken, sha256, hmac, sameHex, HttpError, fail, EMAIL_RE, UUID_RE, AUTHKEY_RE, normEmail, list, limit, verifyIdToken, es256Jwt, verifyLicence, signLicence, sendMail, unb64u, td } from './lib.js';
import { page, resetForm } from './pages.js';
import { refreshPrices, currentPrices } from './amazon.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Max-Age': '86400' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const MAX_VAULT = 1500000, MAX_KEYS = 4000, SESSION_DAYS = 400;
const GOOGLE = { jwks: 'https://www.googleapis.com/oauth2/v3/certs', iss: ['https://accounts.google.com', 'accounts.google.com'] };
const APPLE = { jwks: 'https://appleid.apple.com/auth/keys', iss: ['https://appleid.apple.com'] };

async function readJson(req) { try { return await req.json(); } catch (e) { fail(400, 'Requête invalide.', 'bad_json'); } }
const ip = req => req.headers.get('cf-connecting-ip') || 'local';
const one = (env, sql, ...args) => env.DB.prepare(sql).bind(...args).first();
const run = (env, sql, ...args) => env.DB.prepare(sql).bind(...args).run();

/* ---------- Sessions ---------- */
async function newSession(env, userId, device) {
  const token = randomToken();
  await run(env, 'INSERT INTO sessions (token_hash, user_id, device, created_at, last_seen) VALUES (?, ?, ?, ?, ?)', await sha256(token), userId, String(device || '').slice(0, 80), now(), now());
  return token;
}
async function auth(req, env) {
  const m = /^Bearer ([A-Za-z0-9_-]{20,})$/.exec(req.headers.get('authorization') || '');
  if (!m) fail(401, 'Connexion requise.', 'no_session');
  const th = await sha256(m[1]), s = await one(env, 'SELECT * FROM sessions WHERE token_hash = ?', th);
  if (!s || now() - s.last_seen > SESSION_DAYS * 86400) fail(401, 'Session expirée : reconnectez-vous.', 'no_session');
  const user = await one(env, 'SELECT * FROM users WHERE id = ?', s.user_id);
  if (!user) fail(401, 'Compte introuvable.', 'no_session');
  if (now() - s.last_seen > 86400) await run(env, 'UPDATE sessions SET last_seen = ? WHERE token_hash = ?', now(), th);
  return { user, tokenHash: th };
}
async function publicUser(env, u) {
  const ids = (await env.DB.prepare('SELECT provider FROM identities WHERE user_id = ?').bind(u.id).all()).results.map(r => r.provider);
  return { id: u.id, email: u.email, emailVerified: !!u.email_verified, hasPassword: !!u.auth_hash, providers: [...(u.auth_hash ? ['password'] : []), ...ids], createdAt: u.created_at };
}
/* Tout ce qu'un appareil connecté doit savoir : compte, clés emballées, version de la sauvegarde, licences. */
async function account(env, u, extra) {
  const keys = await one(env, 'SELECT keys FROM vault_keys WHERE user_id = ?', u.id);
  const vault = await one(env, 'SELECT version, updated_at FROM vaults WHERE user_id = ?', u.id);
  const lic = (await env.DB.prepare('SELECT token FROM licences WHERE user_id = ? ORDER BY created_at').bind(u.id).all()).results.map(r => r.token);
  return { user: await publicUser(env, u), keys: keys ? JSON.parse(keys.keys) : null, vault: vault ? { version: vault.version, updatedAt: vault.updated_at } : null, licences: lic, ...extra };
}

/* ---------- E-mails : jetons à usage unique ---------- */
async function emailToken(env, userId, purpose, ttl) {
  const t = randomToken();
  await run(env, 'DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?', userId, purpose);
  await run(env, 'INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)', await sha256(t), userId, purpose, now() + ttl);
  return t;
}
async function takeToken(env, token, purpose) {
  const row = await one(env, 'SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?', await sha256(token || ''), purpose);
  return row && row.expires_at > now() ? row : null;
}
async function sendVerification(env, origin, u) {
  const t = await emailToken(env, u.id, 'verify', 7 * 86400), link = `${origin}/auth/verify?token=${t}`;
  await sendMail(env, u.email, 'Confirmez votre adresse e-mail Holdout',
    `Bonjour,\n\nPour confirmer l'adresse de votre compte Holdout, ouvrez ce lien (valable 7 jours) :\n${link}\n\nSi vous n'avez pas créé de compte, ignorez ce message.`,
    `<p>Bonjour,</p><p>Pour confirmer l'adresse de votre compte Holdout, ouvrez ce lien (valable 7 jours) :</p><p><a href="${link}">Confirmer mon adresse</a></p><p>Si vous n'avez pas créé de compte, ignorez ce message.</p>`);
}

/* ---------- Google et Apple ---------- */
async function appleSecret(env, clientId) {
  return es256Jwt(env.APPLE_PRIVATE_KEY, { kid: env.APPLE_KEY_ID }, { iss: env.APPLE_TEAM_ID, iat: now(), exp: now() + 3600, aud: 'https://appleid.apple.com', sub: clientId });
}
const appleConfigured = env => env.APPLE_PRIVATE_KEY && env.APPLE_KEY_ID && env.APPLE_TEAM_ID;
async function oauthLogin(env, provider, claims, device) {
  const sub = String(claims.sub || ''); if (!sub) fail(401, 'Jeton d\'identité invalide.', 'bad_token');
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  const email = claims.email && verified ? normEmail(claims.email) : null;
  let created = false, id = (await one(env, 'SELECT user_id FROM identities WHERE provider = ? AND subject = ?', provider, sub) || {}).user_id;
  if (!id) {
    const u = email && await one(env, 'SELECT * FROM users WHERE email = ?', email);
    if (u) {
      // Même adresse, prouvée par Google ou Apple. Un compte e-mail jamais confirmé a pu être créé par un tiers :
      // on lui retire son mot de passe et ses sessions avant de le rattacher.
      if (!u.email_verified && u.auth_hash) { await run(env, 'UPDATE users SET auth_hash = NULL, auth_salt = NULL WHERE id = ?', u.id); await run(env, 'DELETE FROM sessions WHERE user_id = ?', u.id); }
      await run(env, 'UPDATE users SET email_verified = 1 WHERE id = ?', u.id);
      id = u.id;
    } else {
      id = crypto.randomUUID(); created = true;
      await run(env, 'INSERT INTO users (id, email, email_verified, created_at) VALUES (?, ?, ?, ?)', id, email, email ? 1 : 0, now());
    }
    await run(env, 'INSERT INTO identities (provider, subject, user_id, email, created_at) VALUES (?, ?, ?, ?, ?)', provider, sub, id, email, now());
  }
  const u = await one(env, 'SELECT * FROM users WHERE id = ?', id);
  return { u, token: await newSession(env, id, device), created };
}

/* ---------- App Store : achat vérifié auprès d'Apple, converti en licence Premium ---------- */
async function appStoreLicence(env, u, transactionId) {
  if (!(env.APPSTORE_KEY_ID && env.APPSTORE_ISSUER_ID && env.APPSTORE_PRIVATE_KEY && env.APPSTORE_BUNDLE_ID && env.APPSTORE_PRODUCTS && env.LICENCE_PRIVATE_JWK)) fail(501, 'Vérification des achats App Store non configurée sur le serveur.', 'appstore_disabled');
  if (!/^\d{1,20}$/.test(String(transactionId))) fail(400, 'Transaction invalide.', 'bad_transaction');
  const jwt = await es256Jwt(env.APPSTORE_PRIVATE_KEY, { kid: env.APPSTORE_KEY_ID, typ: 'JWT' }, { iss: env.APPSTORE_ISSUER_ID, iat: now(), exp: now() + 1200, aud: 'appstoreconnect-v1', bid: env.APPSTORE_BUNDLE_ID });
  let r;
  for (const host of ['api.storekit.itunes.apple.com', 'api.storekit-sandbox.itunes.apple.com']) {
    r = await fetch(`https://${host}/inApps/v1/transactions/${transactionId}`, { headers: { Authorization: 'Bearer ' + jwt } });
    if (r.status !== 404) break;
  }
  if (!r.ok) fail(400, 'Achat introuvable auprès d\'Apple.', 'appstore_not_found');
  // Réponse reçue d'Apple en HTTPS avec notre jeton : la charge de la transaction signée est lue directement.
  const tx = JSON.parse(td.decode(unb64u((await r.json()).signedTransactionInfo.split('.')[1])));
  const products = JSON.parse(env.APPSTORE_PRODUCTS), plan = Object.keys(products).find(k => products[k] === tx.productId);
  if (tx.bundleId !== env.APPSTORE_BUNDLE_ID || !plan || tx.revocationDate) fail(400, 'Achat non valable pour Holdout Premium.', 'appstore_invalid');
  const exp = tx.expiresDate ? Math.floor(tx.expiresDate / 1000) : null;
  if (exp && exp < now()) fail(400, 'Abonnement expiré.', 'appstore_expired');
  const id = `as-${tx.originalTransactionId}-${exp || 'vie'}`;
  const licence = await signLicence(env, { v: 1, id, plan, iat: now(), exp, src: 'appstore' });
  await run(env, 'INSERT OR REPLACE INTO licences (id, user_id, token, plan, exp, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, u.id, licence, plan, exp, 'appstore', now());
  return licence;
}

/* ---------- Routes ---------- */
async function route(req, env) {
  const url = new URL(req.url), origin = url.origin, R = `${req.method} ${url.pathname}`;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  switch (R) {
    case 'GET /health': return json({ ok: true });
    case 'GET /shop/prices': return json(await currentPrices(env));

    case 'POST /auth/register': {
      const b = await readJson(req), email = normEmail(b.email);
      if (!EMAIL_RE.test(email) || email.length > 254) fail(400, 'Adresse e-mail invalide.', 'bad_email');
      if (!UUID_RE.test(b.id || '') || !AUTHKEY_RE.test(b.authKey || '')) fail(400, 'Requête invalide.', 'bad_request');
      await limit(env, 'reg:' + ip(req), 20, 3600);
      if (await one(env, 'SELECT id FROM users WHERE email = ?', email)) fail(409, 'Un compte existe déjà avec cette adresse.', 'email_taken');
      if (await one(env, 'SELECT id FROM users WHERE id = ?', b.id)) fail(409, 'Identifiant déjà utilisé.', 'id_taken');
      const salt = randomToken(16);
      await run(env, 'INSERT INTO users (id, email, email_verified, auth_salt, auth_hash, created_at) VALUES (?, ?, 0, ?, ?, ?)', b.id, email, salt, await hmac(salt, b.authKey), now());
      const u = await one(env, 'SELECT * FROM users WHERE id = ?', b.id);
      try { await sendVerification(env, origin, u); } catch (e) { console.error('e-mail de vérification :', e.message); }
      return json(await account(env, u, { token: await newSession(env, u.id, b.device), created: true }), 201);
    }
    case 'POST /auth/login': {
      const b = await readJson(req), email = normEmail(b.email);
      await limit(env, 'loginip:' + ip(req), 60, 900);
      await limit(env, 'login:' + email, 10, 900);
      const u = EMAIL_RE.test(email) && await one(env, 'SELECT * FROM users WHERE email = ?', email);
      if (!u || !u.auth_hash || !AUTHKEY_RE.test(b.authKey || '') || !sameHex(await hmac(u.auth_salt, b.authKey), u.auth_hash)) fail(401, 'E-mail ou mot de passe incorrect.', 'bad_credentials');
      return json(await account(env, u, { token: await newSession(env, u.id, b.device) }));
    }
    case 'POST /auth/google': {
      const b = await readJson(req), aud = list(env.GOOGLE_CLIENT_IDS);
      if (!aud.length) fail(501, 'Connexion Google non configurée.', 'google_disabled');
      await limit(env, 'oauth:' + ip(req), 60, 900);
      const claims = await verifyIdToken(b.idToken, { jwksUrl: env.GOOGLE_JWKS_URL || GOOGLE.jwks, issuers: GOOGLE.iss, audiences: aud });
      const { u, token, created } = await oauthLogin(env, 'google', claims, b.device);
      return json(await account(env, u, { token, created }));
    }
    case 'POST /auth/apple': {
      const b = await readJson(req), aud = list(env.APPLE_AUDIENCES);
      if (!aud.length) fail(501, 'Connexion Apple non configurée.', 'apple_disabled');
      await limit(env, 'oauth:' + ip(req), 60, 900);
      const claims = await verifyIdToken(b.idToken, { jwksUrl: env.APPLE_JWKS_URL || APPLE.jwks, issuers: APPLE.iss, audiences: aud });
      const { u, token, created } = await oauthLogin(env, 'apple', claims, b.device);
      // Jeton de renouvellement Apple : nécessaire pour révoquer l'accès à la suppression du compte (exigence Apple).
      if (b.authorizationCode && appleConfigured(env)) {
        try {
          const clientId = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
          const r = await fetch('https://appleid.apple.com/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: await appleSecret(env, clientId), code: b.authorizationCode, grant_type: 'authorization_code' }) });
          const j = await r.json();
          if (j.refresh_token) await run(env, 'UPDATE users SET apple_refresh = ? WHERE id = ?', JSON.stringify({ clientId, token: j.refresh_token }), u.id);
        } catch (e) { console.error('échange Apple :', e.message); }
      }
      return json(await account(env, u, { token, created }));
    }
    case 'GET /auth/verify': {
      const row = await takeToken(env, url.searchParams.get('token'), 'verify');
      if (!row) return page('Lien expiré', '<p>Ce lien n\'est plus valable. Dans l\'application, ouvrez votre compte et demandez un nouvel e-mail de confirmation.</p>', 400);
      await run(env, 'UPDATE users SET email_verified = 1 WHERE id = ?', row.user_id);
      await run(env, 'DELETE FROM email_tokens WHERE token_hash = ?', row.token_hash);
      return page('Adresse confirmée', '<p>Merci, votre adresse e-mail est confirmée. Vous pouvez revenir dans l\'application.</p>');
    }
    case 'POST /auth/forgot': {
      const b = await readJson(req), email = normEmail(b.email);
      await limit(env, 'forgotip:' + ip(req), 10, 3600);
      if (EMAIL_RE.test(email)) {
        await limit(env, 'forgot:' + email, 3, 3600);
        const u = await one(env, 'SELECT * FROM users WHERE email = ?', email);
        if (u && u.auth_hash) {
          const link = `${origin}/auth/reset?token=${await emailToken(env, u.id, 'reset', 3600)}`;
          try {
            await sendMail(env, email, 'Nouveau mot de passe Holdout',
              `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nVos données chiffrées se déverrouilleront ensuite avec votre code de secours.\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
              `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :</p><p><a href="${link}">Choisir un nouveau mot de passe</a></p><p>Vos données chiffrées se déverrouilleront ensuite avec votre <b>code de secours</b>.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`);
          } catch (e) { console.error('e-mail de réinitialisation :', e.message); }
        }
      }
      return json({ ok: true }); // même réponse que le compte existe ou non
    }
    case 'GET /auth/reset': {
      const row = await takeToken(env, url.searchParams.get('token'), 'reset');
      if (!row) return page('Lien expiré', '<p>Ce lien n\'est plus valable. Dans l\'application, refaites « Mot de passe oublié ».</p>', 400);
      const u = await one(env, 'SELECT email FROM users WHERE id = ?', row.user_id);
      return resetForm(url.searchParams.get('token'), u.email);
    }
    case 'POST /auth/reset': {
      const b = await readJson(req), row = await takeToken(env, b.token, 'reset');
      if (!row) fail(400, 'Lien expiré : refaites « Mot de passe oublié ».', 'expired');
      if (!AUTHKEY_RE.test(b.authKey || '')) fail(400, 'Requête invalide.', 'bad_request');
      const salt = randomToken(16);
      await run(env, 'UPDATE users SET auth_salt = ?, auth_hash = ?, email_verified = 1 WHERE id = ?', salt, await hmac(salt, b.authKey), row.user_id);
      await run(env, 'DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?', row.user_id, 'reset');
      await run(env, 'DELETE FROM sessions WHERE user_id = ?', row.user_id);
      return json({ ok: true });
    }
  }

  // Routes réservées à un appareil connecté.
  const { user: u, tokenHash } = await auth(req, env);
  switch (R) {
    case 'GET /me': return json(await account(env, u));
    case 'POST /auth/logout': await run(env, 'DELETE FROM sessions WHERE token_hash = ?', tokenHash); return json({ ok: true });
    case 'POST /auth/resend': {
      if (u.email_verified || !u.email) return json({ ok: true, alreadyVerified: !!u.email_verified });
      await limit(env, 'resend:' + u.id, 3, 3600);
      await sendVerification(env, origin, u);
      return json({ ok: true });
    }
    case 'POST /me/password': {
      const b = await readJson(req);
      if (!u.auth_hash || !AUTHKEY_RE.test(b.currentAuthKey || '') || !sameHex(await hmac(u.auth_salt, b.currentAuthKey), u.auth_hash)) fail(401, 'Mot de passe actuel incorrect.', 'bad_credentials');
      if (!AUTHKEY_RE.test(b.authKey || '')) fail(400, 'Requête invalide.', 'bad_request');
      const salt = randomToken(16);
      await run(env, 'UPDATE users SET auth_salt = ?, auth_hash = ? WHERE id = ?', salt, await hmac(salt, b.authKey), u.id);
      await run(env, 'DELETE FROM sessions WHERE user_id = ? AND token_hash != ?', u.id, tokenHash);
      return json({ ok: true });
    }
    case 'DELETE /me': {
      const b = await readJson(req);
      if (b.confirm !== 'SUPPRIMER') fail(400, 'Confirmation manquante.', 'confirm_required');
      if (u.apple_refresh && appleConfigured(env)) {
        try {
          const { clientId, token } = JSON.parse(u.apple_refresh);
          await fetch('https://appleid.apple.com/auth/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: await appleSecret(env, clientId), token, token_type_hint: 'refresh_token' }) });
        } catch (e) { console.error('révocation Apple :', e.message); }
      }
      await run(env, 'DELETE FROM users WHERE id = ?', u.id); // identités, sessions, clés, sauvegarde et licences suivent
      return json({ deleted: true });
    }
    case 'GET /vault': {
      const v = await one(env, 'SELECT version, data, updated_at FROM vaults WHERE user_id = ?', u.id);
      return json(v ? { version: v.version, updatedAt: v.updated_at, data: v.data } : { version: 0 });
    }
    case 'PUT /vault': {
      const b = await readJson(req), data = String(b.data || ''), base = +b.baseVersion;
      if (!data || data.length > MAX_VAULT || !Number.isInteger(base) || base < 0) fail(400, 'Sauvegarde invalide ou trop volumineuse.', 'bad_vault');
      const res = base === 0
        ? await run(env, 'INSERT INTO vaults (user_id, version, data, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(user_id) DO NOTHING', u.id, data, now())
        : await run(env, 'UPDATE vaults SET version = version + 1, data = ?, updated_at = ? WHERE user_id = ? AND version = ?', data, now(), u.id, base);
      if (!res.meta.changes) {
        const cur = await one(env, 'SELECT version FROM vaults WHERE user_id = ?', u.id);
        return json({ error: 'La sauvegarde a changé sur un autre appareil.', code: 'conflict', version: cur ? cur.version : 0 }, 409);
      }
      return json({ version: base + 1 });
    }
    case 'PUT /vault/keys': {
      const b = await readJson(req), keys = JSON.stringify(b.keys || null);
      if (!b.keys || !b.keys.bySecret || !b.keys.byRecovery || keys.length > MAX_KEYS) fail(400, 'Clés invalides.', 'bad_keys');
      if (b.create) {
        const res = await run(env, 'INSERT INTO vault_keys (user_id, keys, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING', u.id, keys, now());
        if (!res.meta.changes) return json({ error: 'Ce compte a déjà des clés de chiffrement.', code: 'keys_exist', keys: JSON.parse((await one(env, 'SELECT keys FROM vault_keys WHERE user_id = ?', u.id)).keys) }, 409);
      } else await run(env, 'INSERT INTO vault_keys (user_id, keys, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET keys = excluded.keys, updated_at = excluded.updated_at', u.id, keys, now());
      return json({ ok: true });
    }
    case 'DELETE /vault': {
      // Secret et code de secours perdus : on repart d'une sauvegarde neuve (les anciennes données sont illisibles de toute façon).
      const b = await readJson(req);
      if (b.confirm !== 'REINITIALISER') fail(400, 'Confirmation manquante.', 'confirm_required');
      await run(env, 'DELETE FROM vaults WHERE user_id = ?', u.id);
      await run(env, 'DELETE FROM vault_keys WHERE user_id = ?', u.id);
      return json({ ok: true });
    }
    case 'POST /me/licences': {
      const b = await readJson(req), p = await verifyLicence(env, b.licence);
      if (p.plan === 'admin') fail(400, 'Les clés administrateur restent propres à chaque appareil.', 'admin_licence');
      if (p.exp && p.exp < now()) fail(400, 'Cette licence a expiré.', 'expired_licence');
      await run(env, 'INSERT OR IGNORE INTO licences (id, user_id, token, plan, exp, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', String(p.id || await sha256(b.licence)), u.id, String(b.licence).trim(), p.plan || null, p.exp || null, 'app', now());
      return json(await account(env, u));
    }
    case 'POST /me/appstore': {
      const b = await readJson(req);
      return json({ licence: await appStoreLicence(env, u, b.transactionId) });
    }
  }
  fail(404, 'Route inconnue.', 'not_found');
}

export default {
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
      console.error(e && e.stack || e);
      return json({ error: 'Erreur du serveur.', code: 'server_error' }, 500);
    }
  },
  /* Toutes les heures : prix Amazon officiels (inactif sans les secrets AMAZON_*, server/src/amazon.js). */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshPrices(env).then(r => console.log('prix Amazon', JSON.stringify(r))));
  },
};
