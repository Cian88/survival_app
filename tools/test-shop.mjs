/* Contrôle des gammes de budget et des liens Amazon (js/gear-tiers.js, js/shop.js, js/bags.js, server/src/amazon.js).
   Lancer : node tools/test-shop.mjs */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = { KS_CONFIG: { amazon: { tag: '', prices: false } } };
const TIERS = window.GEAR_TIERS = require('../js/gear-tiers.js');
require('../js/gear.js'); require('../js/env.js'); require('../js/shop.js'); require('../js/bags.js');
const { GEAR, ENV_VARIANTS, Shop, Bags } = window, GAMMES = ['faible', 'moyen', 'eleve'];
const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

/* ---------- Données ---------- */
const keys = new Set(Object.keys(TIERS.items));
for (const g of GEAR) ok(keys.has(g.id), `catalogue ${g.id} sans gammes`);
for (const e of ENV_VARIANTS) (e.add || []).forEach((a, i) => ok(keys.has(e.id + ':' + i), `ajout ${e.id}:${i} (${a.item}) sans gammes`));
for (const T of Object.values(Bags.TYPES)) for (const r of T.items) if (r.c && keys.has('bag:' + r.c)) ok(true);
const expected = new Set([...GEAR.map(g => g.id), ...ENV_VARIANTS.flatMap(e => (e.add || []).map((a, i) => e.id + ':' + i)), ...Object.values(Bags.TYPES).flatMap(T => T.items.filter(r => r.c).map(r => 'bag:' + r.c))]);
for (const k of keys) ok(expected.has(k), `clé inconnue ${k} (objet supprimé ou renuméroté dans env.js ?)`);
const NOT_ON_AMAZON = /quechua|forclaz|wedze|solognac|kalenji|decathlon|lyophilise ?(&|and) ?co|castorama|diall|leroy merlin/i;
for (const [k, t] of Object.entries(TIERS.items)) {
  if (t.none) { ok(typeof t.none === 'string' && t.none.length > 10, `${k} : raison « none » manquante`); continue; }
  for (const g of GAMMES) {
    const o = t[g]; ok(o, `${k} : gamme ${g} manquante`);
    ok(o.model && o.model.length > 3, `${k}.${g} : modèle manquant`);
    ok(o.q && o.q.split(' ').length >= 2 && o.q.length <= 80 && o.q === o.q.toLowerCase(), `${k}.${g} : requête invalide « ${o.q} »`);
    ok(o.price > 0 && o.price < 2000, `${k}.${g} : prix invalide ${o.price}`);
    ok(!NOT_ON_AMAZON.test(o.model + ' ' + o.q), `${k}.${g} : marque non vendue sur Amazon (${o.model})`);
    ok(!/https?:/.test(o.note || ''), `${k}.${g} : URL dans la note`);
  }
  ok(t.faible.price <= t.moyen.price && t.moyen.price <= t.eleve.price, `${k} : prix des gammes dans le désordre (${GAMMES.map(g => t[g].price)})`);
}

/* ---------- Liens et prix ---------- */
let o = Shop.offer('G005', 'faible');
ok(o.url === 'https://www.amazon.fr/s?k=' + encodeURIComponent(TIERS.items.G005.faible.q), 'lien de recherche Amazon.fr');
ok(!o.live && o.price === TIERS.items.G005.faible.price, 'prix indicatif sans API');
ok(Shop.offer('G005', 'inconnue').tier === 'moyen', 'gamme inconnue → moyen');
ok(Shop.offer('G067', 'moyen').none, 'objet sans lien d\'achat');
ok(Shop.offer('pas-une-cle') === null, 'clé inconnue');
ok(Shop.disclosure() === 'Les liens mènent à une recherche sur Amazon.fr.', 'pas de mention Partenaire sans tag');
window.KS_CONFIG.amazon.tag = 'holdout-21';
o = Shop.offer('G005', 'eleve');
ok(new URL(o.url).searchParams.get('tag') === 'holdout-21' && new URL(o.url).hostname === 'www.amazon.fr', 'tag Partenaires ajouté au lien');
ok(/Partenaire Amazon/.test(Shop.disclosure()), 'mention Partenaire avec tag');
ok(/rel="noopener sponsored"/.test(Shop.linkHTML(o)), 'lien marqué sponsored');
window.KS_CONFIG.amazon.tag = '';

/* ---------- Sacs ---------- */
const K = 2100; let id = 0; const uid = () => 'k' + (++id);
const bags = Object.fromEntries(GAMMES.map(g => { const b = { type: 'evac', days: 3, tier: g, items: [] }; Bags.prefill(b, GEAR_BY_ID, K, uid); return [g, b]; }));
const cost = b => b.items.reduce((a, it) => a + it.qty * it.price, 0);
ok(cost(bags.faible) < cost(bags.moyen) && cost(bags.moyen) < cost(bags.eleve), `coût du sac croissant selon la gamme (${GAMMES.map(g => Math.round(cost(bags[g])))})`);
const filtre = g => bags[g].items.find(i => i.gearId === 'G005');
ok(filtre('faible').name === 'Filtre à eau — ' + TIERS.items.G005.faible.model && filtre('faible').tier === 'faible' && filtre('faible').shop === 'G005', 'ligne du sac : modèle de la gamme');
ok(bags.moyen.items.length === bags.eleve.items.length, 'mêmes objets quelle que soit la gamme');
const cash = bags.faible.items.find(i => i.rid === 'cash');
ok(cash && !cash.shop, 'objet sans produit (espèces) : pas de lien');
const est = Bags.estimate('evac', 3, GEAR_BY_ID, K);
ok(Math.abs(est.moyen.cost - cost(bags.moyen)) < 0.01, 'estimation à la création = sac pré-rempli');
// Changement de gamme : les lignes modifiées à la main sont conservées
const b = bags.faible, fixed = b.items.find(i => i.gearId === 'G004'); fixed.price = 1; fixed.fixed = true;
Shop.retier(b.items, 'eleve');
ok(filtre('faible').price === TIERS.items.G005.eleve.price && filtre('faible').tier === 'eleve', 'changement de gamme appliqué');
ok(fixed.price === 1 && fixed.tier === 'faible', 'ligne modifiée à la main conservée');

/* ---------- Serveur : signature AWS et tâche planifiée ---------- */
const A = await import('../server/src/amazon.js');
// Vecteur de test publié par AWS (« Examples of how to derive a signing key for Signature Version 4 »).
const hex = u8 => [...u8].map(x => x.toString(16).padStart(2, '0')).join('');
ok(hex(await A.signingKey('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', '20120215', 'us-east-1', 'iam')) === 'f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d', 'clé de signature AWS v4');
const offers = A.offers();
ok(offers.length === [...keys].filter(k => !TIERS.items[k].none).length * 3 && offers.every(x => /^[\w:]+\.(faible|moyen|eleve)$/.test(x.key) && x.q), 'liste des offres suivies par le serveur');
ok((await A.refreshPrices({})).skipped, 'tâche inactive sans secrets');
// Base D1 simulée + API simulée : la tâche enregistre prix et lien, la route ne renvoie que les prix de moins de 24 h.
const rows = {}, calls = [];
const DB = { prepare(sql) { return { args: [], bind(...a) { this.args = a; return this; },
  async all() { if (/^SELECT key, asin, tried_at/.test(sql)) return { results: Object.values(rows) }; return { results: Object.values(rows).filter(r => r.price != null && r.price_at > this.args[0]) }; },
  async run() { const [key, ...v] = this.args; if (/price_at/.test(sql)) rows[key] = { key, asin: v[0], url: v[1], title: v[2], price: v[3], currency: v[4], price_at: v[5], tried_at: v[6] }; else rows[key] = Object.assign(rows[key] || { key }, { tried_at: v[0], error: v[1] }); } }; } };
const fakeFetch = async (url, init) => { calls.push({ url, init }); const body = JSON.parse(init.body); return new Response(JSON.stringify({ SearchResult: { Items: [{ ASIN: 'B0TEST' + calls.length, DetailPageURL: 'https://www.amazon.fr/dp/B0TEST?tag=holdout-21', ItemInfo: { Title: { DisplayValue: body.Keywords } }, OffersV2: { Listings: [{ Price: { Money: { Amount: 12.34, Currency: 'EUR' } } }] } }] } }), { status: 200 }); };
const env = { DB, AMAZON_ACCESS_KEY: 'AKIDEXAMPLE', AMAZON_SECRET_KEY: 'secret', AMAZON_PARTNER_TAG: 'holdout-21' };
const r = await A.refreshPrices(env, { fetcher: fakeFetch, perRun: 3, pause: 0 });
ok(r.done === 3 && calls.length === 3, 'tâche planifiée : 3 offres mises à jour');
const h0 = calls[0].init.headers;
ok(calls[0].url === 'https://webservices.amazon.fr/paapi5/searchitems' && h0['x-amz-target'].endsWith('.SearchItems') && /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/\d{8}\/eu-west-1\/ProductAdvertisingAPI\/aws4_request, SignedHeaders=content-encoding;content-type;host;x-amz-date;x-amz-target, Signature=[0-9a-f]{64}$/.test(h0.authorization), 'requête signée vers l\'API Amazon.fr');
ok(JSON.parse(calls[0].init.body).PartnerTag === 'holdout-21' && JSON.parse(calls[0].init.body).Marketplace === 'www.amazon.fr', 'tag et marché dans la requête');
const cur = await A.currentPrices(env), first = Object.values(cur.items)[0];
ok(Object.keys(cur.items).length === 3 && first.price === 12.34 && /^https:\/\/www\.amazon\.fr\/dp\//.test(first.url), 'route /shop/prices : prix et lien produit');
await A.refreshPrices(env, { fetcher: fakeFetch, perRun: 3, pause: 0 });
ok(Object.keys(rows).length === 6, 'les offres jamais vérifiées passent en premier');
for (const row of Object.values(rows)) row.price_at -= 86401;
ok(Object.keys((await A.currentPrices(env)).items).length === 0, 'prix de plus de 24 h non renvoyés');

console.log(`✓ ${n} vérifications : gammes de budget, liens Amazon, sacs, prix officiels (simulés).`);
