/* Service de délivrance des licences — modèle pour Cloudflare Workers (ou tout environnement avec fetch + WebCrypto).
   Flux : Payment Link Stripe → redirection vers  https://<worker>/licence?session_id={CHECKOUT_SESSION_ID}
          → le worker vérifie le paiement auprès de Stripe → affiche la clé de licence signée (KS1.…) à coller dans l'app.
   Renouvellement des abonnements : l'app appelle  https://<worker>/renew?sid=<id de session>  (JSON, CORS ouvert).

   Variables secrètes à définir (wrangler secret put …) :
     STRIPE_SECRET_KEY   clé secrète Stripe (sk_live_… ou sk_test_…)
     LICENCE_PRIVATE_JWK contenu de license-keys/private.jwk (généré par `node tools/license.mjs keygen`)
     PRICE_MONTHLY, PRICE_ANNUAL, PRICE_LIFETIME  identifiants des prix Stripe (price_…)
   À vérifier avant mise en production : version d'API Stripe du compte (champ current_period_end), textes légaux. */
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = s => new TextEncoder().encode(s);
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };

async function stripe(env, path) {
  const r = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } });
  if (!r.ok) throw new Error('Stripe ' + r.status);
  return r.json();
}
async function sha16(s) { const d = await crypto.subtle.digest('SHA-256', enc(s.trim().toLowerCase())); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16); }
async function sign(env, payload) {
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.LICENCE_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const body = b64u(enc(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(body)); // format IEEE P1363 (r||s), comme l'app
  return 'KS1.' + body + '.' + b64u(sig);
}
/* Vérifie une session de paiement et fabrique la licence correspondante. */
async function licenceFor(env, sessionId) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId || '')) throw new Error('identifiant de session invalide');
  const s = await stripe(env, `checkout/sessions/${sessionId}?expand[]=line_items&expand[]=subscription`);
  if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) throw new Error('paiement non confirmé');
  const price = s.line_items && s.line_items.data[0] && s.line_items.data[0].price.id;
  const plan = price === env.PRICE_LIFETIME ? 'lifetime' : price === env.PRICE_ANNUAL ? 'annual' : price === env.PRICE_MONTHLY ? 'monthly' : null;
  if (!plan) throw new Error('prix inconnu');
  let exp = null;
  if (plan !== 'lifetime') {
    const sub = s.subscription; if (!sub || !['active', 'trialing'].includes(sub.status)) throw new Error('abonnement inactif');
    exp = (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end) || sub.current_period_end;
  }
  const email = (s.customer_details && s.customer_details.email) || '';
  return sign(env, { v: 1, id: crypto.randomUUID(), plan, iat: Math.floor(Date.now() / 1000), exp,
    who: email ? email.replace(/^(.).*(@.*)$/, '$1•••$2') : undefined, eh: email ? await sha16(email) : undefined, sid: plan === 'lifetime' ? undefined : s.id });
}
const page = (title, inner) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font:16px system-ui;max-width:640px;margin:40px auto;padding:0 16px"><h1>${title}</h1>${inner}</body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    try {
      if (u.pathname === '/licence') {
        const lic = await licenceFor(env, u.searchParams.get('session_id'));
        return page('Merci ! Voici votre licence', `<p>Copiez cette clé et collez-la dans l'application : onglet <b>★ Premium</b> → « J'ai une clé de licence ». Conservez-la : elle permet de réactiver Premium sur un autre appareil.</p>
<textarea id="k" readonly style="width:100%;height:140px">${lic}</textarea><p><button onclick="navigator.clipboard.writeText(document.getElementById('k').value).then(()=>this.textContent='Copiée')">Copier</button></p>`);
      }
      if (u.pathname === '/renew') return new Response(JSON.stringify({ licence: await licenceFor(env, u.searchParams.get('sid')) }), { headers: CORS });
      return new Response('Not found', { status: 404 });
    } catch (e) {
      if (u.pathname === '/renew') return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: CORS });
      return page('Licence indisponible', `<p>${e.message}. Si vous avez payé, contactez le support en indiquant l'heure du paiement.</p>`);
    }
  },
};
