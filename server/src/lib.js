/* Outils du serveur de comptes : encodages, hachages, jetons Google et Apple, licences, e-mails, limites. */
export const te = new TextEncoder(), td = new TextDecoder();
export const now = () => Math.floor(Date.now() / 1000);
export const b64u = u8 => { let s = ''; const a = new Uint8Array(u8); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
export const randomToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
export const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', te.encode(s)));
export async function hmac(keyB64u, msg) {
  const k = await crypto.subtle.importKey('raw', unb64u(keyB64u), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, te.encode(msg)));
}
export function sameHex(a, b) {
  const x = te.encode(String(a)), y = te.encode(String(b));
  if (x.length !== y.length) return false;
  return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(x, y) : x.every((v, i) => v === y[i]);
}

export class HttpError extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code; } }
export const fail = (status, message, code) => { throw new HttpError(status, message, code); };

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const AUTHKEY_RE = /^[A-Za-z0-9_-]{43}$/;
export const normEmail = e => String(e || '').trim().toLowerCase();
export const list = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);

/* ---------- Limitation des tentatives ---------- */
export async function limit(env, key, max, windowSec) {
  const t = now();
  // Ménage régulier : compteurs échus (ils contiennent des adresses IP), liens d'e-mail expirés,
  // sessions inutilisées depuis plus de 400 jours (durée annoncée dans la politique de confidentialité).
  if (Math.random() < 0.05) await env.DB.batch([
    env.DB.prepare('DELETE FROM attempts WHERE reset_at < ?').bind(t),
    env.DB.prepare('DELETE FROM email_tokens WHERE expires_at < ?').bind(t),
    env.DB.prepare('DELETE FROM sessions WHERE last_seen < ?').bind(t - 400 * 86400),
  ]);
  const row = await env.DB.prepare(`INSERT INTO attempts (key, count, reset_at) VALUES (?1, 1, ?2)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at < ?3 THEN 1 ELSE count + 1 END,
      reset_at = CASE WHEN reset_at < ?3 THEN ?2 ELSE reset_at END RETURNING count`).bind(key, t + windowSec, t).first();
  if (row.count > max) fail(429, 'Trop de tentatives. Réessayez dans quelques minutes.', 'rate_limited');
}

/* ---------- Jetons d'identité Google et Apple (JWT RS256) ---------- */
const jwksCache = new Map();
async function jwks(url, force) {
  const c = jwksCache.get(url);
  if (c && !force && c.until > Date.now()) return c.keys;
  const r = await fetch(url);
  if (!r.ok) fail(502, 'Service d\'identité injoignable.', 'jwks_unavailable');
  const keys = (await r.json()).keys || [];
  jwksCache.set(url, { keys, until: Date.now() + 3600e3 });
  return keys;
}
const part = s => JSON.parse(td.decode(unb64u(s)));
export async function verifyIdToken(token, { jwksUrl, issuers, audiences }) {
  const bits = String(token || '').split('.');
  if (bits.length !== 3) fail(401, 'Jeton d\'identité invalide.', 'bad_token');
  let header, payload;
  try { header = part(bits[0]); payload = part(bits[1]); } catch (e) { fail(401, 'Jeton d\'identité invalide.', 'bad_token'); }
  if (header.alg !== 'RS256') fail(401, 'Jeton d\'identité invalide.', 'bad_token');
  let jwk = (await jwks(jwksUrl)).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await jwks(jwksUrl, true)).find(k => k.kid === header.kid);
  if (!jwk) fail(401, 'Jeton d\'identité invalide.', 'bad_token');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64u(bits[2]), te.encode(bits[0] + '.' + bits[1]));
  if (!ok) fail(401, 'Jeton d\'identité invalide.', 'bad_token');
  const t = now(), aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!issuers.includes(payload.iss)) fail(401, 'Jeton d\'identité invalide (émetteur).', 'bad_token');
  if (!aud.some(a => audiences.includes(a))) fail(401, 'Jeton d\'identité invalide (application).', 'bad_token');
  if (!(payload.exp > t - 60) || (payload.iat && payload.iat > t + 300)) fail(401, 'Jeton d\'identité expiré.', 'expired_token');
  return payload;
}

/* ---------- Signatures ES256 (Sign in with Apple, App Store) ---------- */
async function importP8(pem) {
  const der = unb64u(String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_'));
  return crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
export async function es256Jwt(pem, header, payload) {
  const body = b64u(te.encode(JSON.stringify({ alg: 'ES256', ...header }))) + '.' + b64u(te.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await importP8(pem), te.encode(body));
  return body + '.' + b64u(sig);
}

/* ---------- Licences Premium (même format que l'application : KS1.<charge>.<signature ECDSA P-256>) ---------- */
export async function verifyLicence(env, tok) {
  const p = String(tok || '').trim().split('.');
  if (p.length !== 3 || p[0] !== 'KS1' || !env.LICENCE_PUBLIC_JWK) fail(400, 'Licence non reconnue.', 'bad_licence');
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.LICENCE_PUBLIC_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64u(p[2]), te.encode(p[1])).catch(() => false);
  if (!ok) fail(400, 'Licence invalide.', 'bad_licence');
  return JSON.parse(td.decode(unb64u(p[1])));
}
export async function signLicence(env, payload) {
  if (!env.LICENCE_PRIVATE_JWK) fail(501, 'Émission de licences non configurée sur le serveur.', 'licence_signing_disabled');
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.LICENCE_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const body = b64u(te.encode(JSON.stringify(payload)));
  return 'KS1.' + body + '.' + b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(body)));
}

/* ---------- E-mails ----------
   MAIL_MODE : "cloudflare" (liaison EMAIL, Cloudflare Email Service), "resend" (RESEND_API_KEY),
   "outbox" (gardés dans la table outbox : développement et tests), sinon simple journal. */
export async function sendMail(env, to, subject, text, html) {
  const from = env.MAIL_FROM || 'Holdout <compte@hold-out.app>', mode = env.MAIL_MODE || 'log';
  if (mode === 'cloudflare' && env.EMAIL) return env.EMAIL.send({ to, from, subject, text, html });
  if (mode === 'resend' && env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to, subject, text, html }) });
    if (!r.ok) throw new Error('Resend ' + r.status + ' ' + await r.text());
    return;
  }
  if (mode === 'outbox') return env.DB.prepare('INSERT INTO outbox (to_addr, subject, body, created_at) VALUES (?, ?, ?, ?)').bind(to, subject, text, now()).run();
  // Jamais le contenu dans les journaux : il contient des liens de connexion à usage unique.
  console.log(`[e-mail non envoyé, MAIL_MODE=${mode}] à ${to} : ${subject}`);
}
