/* Prix Amazon.fr officiels des objets conseillés (js/gear-tiers.js), par l'API Product Advertising 5.0 d'Amazon.
   Inactif tant que les secrets AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY et AMAZON_PARTNER_TAG ne sont pas définis
   (accès ouvert par Amazon après les premières ventes du compte Partenaires, docs/AMAZON.md).
   - Tâche planifiée (toutes les heures) : met à jour les PER_RUN offres les plus anciennes, 1 requête par seconde
     (quota de départ d'Amazon). Une offre sans ASIN est d'abord cherchée par sa requête (SearchItems), puis suivie par ASIN.
   - GET /shop/prices : prix de moins de 24 h (Amazon interdit d'afficher un prix plus ancien).
   Non testé contre l'API réelle faute de clés : vérifier à l'activation (docs/AMAZON.md, « Mise en service »). */
import TIERS from '../../js/gear-tiers.js';
import { te, hex, sha256, now } from './lib.js';

const HOST = 'webservices.amazon.fr', REGION = 'eu-west-1', SERVICE = 'ProductAdvertisingAPI', MARKET = 'www.amazon.fr';
const PER_RUN = 40, DAY = 86400, GAMMES = ['faible', 'moyen', 'eleve'];
const RESOURCES = ['ItemInfo.Title', 'OffersV2.Listings.Price'];

export const enabled = env => !!(env.AMAZON_ACCESS_KEY && env.AMAZON_SECRET_KEY && env.AMAZON_PARTNER_TAG);

/* Toutes les offres conseillées : { key: « G001.moyen », q, asin } */
export function offers() {
  const out = [];
  for (const [k, t] of Object.entries(TIERS.items)) if (!t.none) for (const g of GAMMES) out.push({ key: k + '.' + g, q: t[g].q, asin: t[g].asin || null });
  return out;
}

async function hmacRaw(key, msg) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? te.encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(msg)));
}
export async function signingKey(secret, day, region, service) {
  let k = await hmacRaw('AWS4' + secret, day);
  for (const part of [region, service, 'aws4_request']) k = await hmacRaw(k, part);
  return k;
}
/* Requête signée (AWS Signature Version 4). op : SearchItems ou GetItems. */
export async function paapi(env, op, payload, fetcher = fetch) {
  const path = '/paapi5/' + op.toLowerCase();
  const body = JSON.stringify({ PartnerTag: env.AMAZON_PARTNER_TAG, PartnerType: 'Associates', Marketplace: MARKET, Resources: RESOURCES, ...payload });
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, ''), day = amzDate.slice(0, 8);
  const headers = { 'content-encoding': 'amz-1.0', 'content-type': 'application/json; charset=utf-8', host: HOST, 'x-amz-date': amzDate, 'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.' + op };
  const names = Object.keys(headers).sort(), signed = names.join(';');
  const canonical = ['POST', path, '', names.map(n => n + ':' + headers[n] + '\n').join(''), signed, await sha256(body)].join('\n');
  const scope = `${day}/${REGION}/${SERVICE}/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256(canonical)].join('\n');
  const k = await signingKey(env.AMAZON_SECRET_KEY, day, REGION, SERVICE);
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${env.AMAZON_ACCESS_KEY}/${scope}, SignedHeaders=${signed}, Signature=${hex(await hmacRaw(k, toSign))}`;
  const r = await fetcher('https://' + HOST + path, { method: 'POST', headers, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`PA-API ${op} : HTTP ${r.status} ${(j.Errors && j.Errors[0] && j.Errors[0].Code) || ''}`.trim()); e.status = r.status; throw e; }
  return j;
}
/* Premier article d'une réponse → { asin, url, title, price, currency } (OffersV2, ou Offers de l'ancienne version). */
function first(j) {
  const it = (j.SearchResult && j.SearchResult.Items || j.ItemsResult && j.ItemsResult.Items || [])[0];
  if (!it) return null;
  const v2 = it.OffersV2 && it.OffersV2.Listings && it.OffersV2.Listings[0], v1 = it.Offers && it.Offers.Listings && it.Offers.Listings[0];
  const money = v2 && v2.Price && (v2.Price.Money || v2.Price) || v1 && v1.Price || {};
  return { asin: it.ASIN, url: it.DetailPageURL, title: it.ItemInfo && it.ItemInfo.Title && it.ItemInfo.Title.DisplayValue || null, price: +money.Amount || null, currency: money.Currency || null };
}

/* Tâche planifiée : met à jour les offres les plus anciennes. */
export async function refreshPrices(env, { fetcher = fetch, perRun = PER_RUN, pause = 1100 } = {}) {
  if (!enabled(env)) return { skipped: true };
  const rows = (await env.DB.prepare('SELECT key, asin, tried_at FROM shop_prices').all()).results || [];
  const known = Object.fromEntries(rows.map(r => [r.key, r]));
  const todo = offers().sort((a, b) => ((known[a.key] || {}).tried_at || 0) - ((known[b.key] || {}).tried_at || 0)).slice(0, perRun);
  let done = 0;
  for (const o of todo) {
    const asin = o.asin || (known[o.key] || {}).asin;
    try {
      const j = asin ? await paapi(env, 'GetItems', { ItemIds: [asin] }, fetcher) : await paapi(env, 'SearchItems', { Keywords: o.q, ItemCount: 1, SearchIndex: 'All' }, fetcher);
      const f = first(j) || {};
      await env.DB.prepare('INSERT INTO shop_prices (key, asin, url, title, price, currency, price_at, tried_at, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(key) DO UPDATE SET asin = excluded.asin, url = excluded.url, title = excluded.title, price = excluded.price, currency = excluded.currency, price_at = excluded.price_at, tried_at = excluded.tried_at, error = NULL')
        .bind(o.key, f.asin || asin || null, f.url || null, f.title || null, f.currency === 'EUR' ? f.price : null, f.currency || null, now(), now()).run();
      done++;
    } catch (e) {
      await env.DB.prepare('INSERT INTO shop_prices (key, tried_at, error) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET tried_at = excluded.tried_at, error = excluded.error').bind(o.key, now(), String(e.message).slice(0, 200)).run();
      if (e.status === 429 || e.status === 401 || e.status === 403) break; // quota ou clés refusées : on réessaiera à la prochaine heure
    }
    if (pause) await new Promise(r => setTimeout(r, pause));
  }
  return { done, of: todo.length };
}

/* Prix affichables (moins de 24 h) : { items: { « G001.moyen »: { price, url, asin, at } } } */
export async function currentPrices(env) {
  const rows = (await env.DB.prepare('SELECT key, asin, url, price, price_at FROM shop_prices WHERE price IS NOT NULL AND price_at > ?').bind(now() - DAY).all()).results || [];
  return { items: Object.fromEntries(rows.map(r => [r.key, { price: r.price, url: r.url, asin: r.asin, at: r.price_at }])) };
}
