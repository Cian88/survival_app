/* Version Premium : licence signée vérifiée HORS LIGNE (ECDSA P-256), écran des offres et verrous.
   Gratuit : l'essentiel pour réagir (Instant T : actions, numéros, position ; carte intégrée ; 1 sac ; 1 pack de carte limité…).
   Premium : ce qui rend l'application vraiment personnelle (profil complet, état des lieux détaillé, Instant T personnalisé,
   cartes hors ligne illimitées, sacs multiples et variantes, inventaire illimité, tous les calculateurs). */
(function () {
  const C = window.KS_CONFIG || {};
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'survie.licence';
  const LIMITS = { packs: 1, packKm: 10, packZoom: 14, osmZones: 1, bags: 1, inventory: 15 };
  const FREE_CALCS = ['eau', 'poids', 'marche'];
  const PLAN_NAME = { monthly: 'Mensuel', annual: 'Annuel', lifetime: 'À vie' };
  const FEATURES = [
    ['Instant T : actions par situation, numéros d\'urgence, position GPS', true, true],
    ['Carte Europe intégrée (relief, fond, nucléaire, barrages, centrales)', true, true],
    ['Cartes hors ligne IGN / relief', `1 pack, ${LIMITS.packKm} km, détail ${LIMITS.packZoom}`, 'Illimitées, 50 km, détail 16, export/import'],
    ['Points utiles hors ligne (eau, santé, abris, dangers)', '1 zone', 'Illimités'],
    ['Profil : foyer et domicile', true, true],
    ['Profil complet : santé, logement, environnement, compétences', false, true],
    ['État des lieux : score et manques vitaux', true, true],
    ['État des lieux détaillé (≈ 50 besoins personnalisés) + liste de courses', false, true],
    ['Instant T personnalisé : votre matériel, ressources et dangers proches, cap vers le domicile et les RDV', false, true],
    ['Sacs d\'évacuation', '1 sac', 'Un par personne + variantes lieu × climat'],
    ['Stock maison (inventaire daté, alertes de péremption)', `${LIMITS.inventory} articles`, 'Illimité'],
    ['Calculateurs', 'Eau, poids du sac, marche', 'Les 9'],
    ['Terrain, matériel & budget, plan, notice, sauvegarde de vos données', true, true],
  ];

  const b64uDec = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
  let state = { active: false, lic: null, reason: 'aucune licence' };
  async function verify(token) {
    const parts = String(token || '').trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'KS1') throw new Error('format de clé non reconnu');
    if (!C.licensePublicKeyJwk) throw new Error('vérification impossible : aucune clé publique configurée');
    if (!(window.crypto && crypto.subtle)) throw new Error('vérification cryptographique indisponible dans ce navigateur (ouvrez l\'application via http://localhost ou https)');
    const key = await crypto.subtle.importKey('jwk', C.licensePublicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    let ok = false, p;
    try {
      ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uDec(parts[2]), new TextEncoder().encode(parts[1]));
      if (ok) p = JSON.parse(new TextDecoder().decode(b64uDec(parts[1])));
    } catch (e) { ok = false; }
    if (!ok) throw new Error('clé invalide ou incomplète (vérifiez qu\'elle a été copiée en entier)');
    const now = Date.now() / 1000, grace = (C.graceDays || 0) * 86400;
    return { payload: p, expired: p.exp != null && now > p.exp + grace, inGrace: p.exp != null && now > p.exp && now <= p.exp + grace };
  }
  /* ---------- iOS : achats intégrés Apple (StoreKit) ---------- */
  const IAP = C.iap || {}, NATIVE = !!(window.Native && Native.isNative && Native.Purchases), IAP_CACHE = 'survie.iap';
  let storePrices = {};
  const planOf = id => Object.keys(IAP).find(k => IAP[k] === id);
  async function loadIAP() {
    const now = Date.now() / 1000, grace = (C.graceDays || 0) * 86400;
    try {
      const { purchases } = await Native.Purchases.getPurchases({ onlyCurrentEntitlements: true });
      let best = null;
      for (const t of purchases || []) {
        const plan = planOf(t.productIdentifier); if (!plan) continue;
        if (plan === 'lifetime') { best = { plan, exp: null }; break; }
        const exp = t.expirationDate ? Date.parse(t.expirationDate) / 1000 : null;
        if (t.isActive === true || (exp && exp > now)) if (!best || (best.exp && exp > best.exp)) best = { plan, exp };
      }
      try { localStorage.setItem(IAP_CACHE, JSON.stringify(best ? Object.assign({ at: now }, best) : null)); } catch (e) { }
      state = best ? { active: true, lic: best, reason: '', iap: true } : { active: false, lic: null, reason: 'aucun achat actif', iap: true };
    } catch (e) { // hors ligne ou StoreKit indisponible : dernier état connu
      let c = null; try { c = JSON.parse(localStorage.getItem(IAP_CACHE)); } catch (x) { }
      const ok = c && (c.exp == null || now <= c.exp + grace);
      state = ok ? { active: true, lic: c, reason: '', iap: true, cached: true } : { active: false, lic: null, reason: 'achats non vérifiables : ' + e.message, iap: true };
    }
    Native.Purchases.getProducts({ productIdentifiers: [IAP.monthly, IAP.annual].filter(Boolean), productType: 'subs' })
      .then(r => (r.products || []).forEach(p => { storePrices[p.identifier || p.productIdentifier] = p.priceString; })).catch(() => { });
    Native.Purchases.getProducts({ productIdentifiers: [IAP.lifetime].filter(Boolean), productType: 'inapp' })
      .then(r => (r.products || []).forEach(p => { storePrices[p.identifier || p.productIdentifier] = p.priceString; })).catch(() => { });
    return state;
  }
  async function buy(plan) {
    await Native.Purchases.purchaseProduct({ productIdentifier: IAP[plan], productType: plan === 'lifetime' ? 'inapp' : 'subs' });
    return loadIAP();
  }

  async function load() {
    if (NATIVE) return loadIAP();
    let tok = null; try { tok = localStorage.getItem(KEY); } catch (e) { }
    if (!tok) { state = { active: false, lic: null, reason: 'aucune licence' }; return state; }
    try {
      const r = await verify(tok);
      state = { active: !r.expired, lic: r.payload, token: tok, inGrace: r.inGrace, reason: r.expired ? 'licence expirée' : '' };
    } catch (e) { state = { active: false, lic: null, reason: e.message }; }
    return state;
  }
  async function activate(tok) {
    const r = await verify(tok);
    if (r.expired) throw new Error('cette licence a expiré');
    try { localStorage.setItem(KEY, tok.trim()); } catch (e) { throw new Error('stockage local indisponible'); }
    await load(); return state;
  }
  function remove() { try { localStorage.removeItem(KEY); } catch (e) { } state = { active: false, lic: null, reason: 'aucune licence' }; }
  const isPremium = () => state.active;

  /* Fenêtre « fonction Premium » */
  function upsell(what) {
    const w = document.createElement('div'); w.className = 'modal-wrap';
    w.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>★ Fonction Premium</h3><p>${h(what)}</p>
      <p class="small">Premium rend l'application réellement adaptée à vous : profil complet, état des lieux détaillé, Instant T personnalisé, cartes hors ligne illimitées. À partir de ${h(C.prices.monthly.label)} par mois, ${h(C.prices.annual.label)} par an ou ${h(C.prices.lifetime.label)} à vie.</p>
      <div class="row end"><button class="btn ghost" data-x>Plus tard</button><button class="btn" data-see>Voir les offres</button></div></div>`;
    document.body.appendChild(w);
    w.querySelector('[data-x]').onclick = () => w.remove();
    w.querySelector('[data-see]').onclick = () => { w.remove(); App.go('premium'); };
  }
  function gate(what) { if (isPremium()) return true; upsell(what); return false; }
  const lockNote = (txt) => `<div class="locknote">🔒 ${h(txt)} <button class="link" data-go="premium">Passer à Premium</button></div>`;

  function renderIAP(el) {
    const P = C.prices, L = state.lic, price = k => storePrices[IAP[k]] || P[k].label;
    el.innerHTML = `
    <div class="card"><h2>★ Kit Survie Premium</h2>
      ${state.active ? `<div class="alert">✅ Premium actif — formule <b>${h(PLAN_NAME[L.plan] || L.plan)}</b>${L.exp ? `, renouvellement ou fin le <b>${new Date(L.exp * 1000).toLocaleDateString('fr-FR')}</b>` : ', sans date de fin'}${state.cached ? ' (vérifié lors de la dernière connexion)' : ''}.</div>`
        : `<p>La version gratuite couvre l'essentiel pour réagir. <b>Premium</b> rend l'application vraiment <b>personnelle</b> : vos besoins réels, votre matériel, vos cartes hors ligne, votre situation à l'instant T.</p>`}
    </div>
    <div class="plans">
      ${[['monthly', 'Mensuel', 'S\'abonner'], ['annual', 'Annuel', 'S\'abonner'], ['lifetime', 'À vie', 'Acheter']].map(([k, n, cta]) => `
        <div class="card plan ${k === 'annual' ? 'best' : ''}">${k === 'annual' ? '<div class="badge">Le plus avantageux sur 1 an</div>' : ''}
          <h3>${n}</h3><div class="price">${h(price(k))}</div><div class="small muted">${h(P[k].per)}</div><p class="small">${h(P[k].note)}</p>
          <button class="btn" data-iap="${k}" ${state.active && L && (L.plan === 'lifetime' || L.plan === k) ? 'disabled' : ''}>${cta}</button></div>`).join('')}
    </div>
    <div class="card">
      <div class="row"><button class="btn ghost" data-iapx="restore">Restaurer mes achats</button>${state.active && L && L.plan !== 'lifetime' ? '<button class="btn ghost" data-iapx="manage">Gérer mon abonnement</button>' : ''}</div>
      <div id="licMsg" class="small"></div>
      <p class="small muted">Paiement par votre compte Apple. Les abonnements mensuel et annuel se renouvellent automatiquement, sauf s'ils sont désactivés au moins 24 heures avant la fin de la période en cours. Gestion et résiliation dans Réglages › [votre nom] › Abonnements. L'achat « À vie » est un paiement unique.
      ${C.termsUrl ? `<a href="${h(C.termsUrl)}" target="_blank" rel="noopener">Conditions d'utilisation</a>` : ''} ${C.privacyUrl ? `· <a href="${h(C.privacyUrl)}" target="_blank" rel="noopener">Politique de confidentialité</a>` : ''}</p>
    </div>
    <div class="card"><h3>Gratuit ou Premium</h3><div class="tablewrap"><table><tr><th>Fonction</th><th>Gratuit</th><th>Premium</th></tr>
      ${FEATURES.map(([f, a, b]) => `<tr><td>${h(f)}</td><td>${a === true ? '✓' : a === false ? '—' : h(a)}</td><td>${b === true ? '✓' : h(b)}</td></tr>`).join('')}</table></div>
      <p class="small muted">Les informations de sécurité (actions d'urgence, numéros, position) restent gratuites pour tous. Vos données restent sur votre appareil.</p></div>`;
    el.onclick = async e => {
      const b = e.target.closest('[data-iap],[data-iapx]'); if (!b) return;
      const msg = el.querySelector('#licMsg'); msg.textContent = 'Connexion à l\'App Store…';
      try {
        if (b.dataset.iap) await buy(b.dataset.iap);
        if (b.dataset.iapx === 'restore') { await Native.Purchases.restorePurchases(); await loadIAP(); }
        if (b.dataset.iapx === 'manage') { await Native.Purchases.manageSubscriptions(); msg.textContent = ''; return; }
        App.refresh(); App.go('premium');
      } catch (err) { msg.textContent = /cancel/i.test(err.message || '') ? 'Achat annulé.' : 'Opération impossible : ' + (err.message || err) + '.'; }
    };
  }
  function render(el) {
    if (NATIVE) return renderIAP(el);
    const P = C.prices, L = state.lic, yearlyOfMonthly = P.monthly.amount * 12, saving = yearlyOfMonthly - P.annual.amount;
    const fmt = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const configured = C.checkout && (C.checkout.monthly || C.checkout.annual || C.checkout.lifetime);
    const cell = v => v === true ? '✓' : v === false ? '—' : h(v);
    el.innerHTML = `
    ${C.testMode ? '<div class="card alertcard"><b>Mode test.</b> La clé de vérification est une clé de démonstration (tools/test-keys) : ne vendez pas de licences tant que vous n\'avez pas généré votre propre clé (voir docs/MONETISATION.md).</div>' : ''}
    <div class="card"><h2>★ Kit Survie Premium</h2>
      ${state.active ? `<div class="alert">✅ Premium actif — formule <b>${h(PLAN_NAME[L.plan] || L.plan)}</b>${L.exp ? `, valable jusqu'au <b>${new Date(L.exp * 1000).toLocaleDateString('fr-FR')}</b>${state.inGrace ? ' (période de grâce : pensez à renouveler)' : ''}` : ', sans date de fin'}${L.who ? ` · ${h(L.who)}` : ''}.</div>`
        : `<p>La version gratuite couvre l'essentiel pour réagir. <b>Premium</b> transforme l'application en outil vraiment <b>personnel</b> : vos besoins réels, votre matériel, vos cartes hors ligne, votre situation à l'instant T.</p>${state.reason && state.reason !== 'aucune licence' ? `<p class="small danger">Licence enregistrée non valide : ${h(state.reason)}.</p>` : ''}`}
    </div>
    <div class="plans">
      ${[['monthly', 'Mensuel'], ['annual', 'Annuel'], ['lifetime', 'À vie']].map(([k, n]) => `
        <div class="card plan ${k === 'annual' ? 'best' : ''}">
          ${k === 'annual' ? `<div class="badge">Le plus avantageux sur 1 an · −${Math.round(saving / yearlyOfMonthly * 100)} %</div>` : ''}
          <h3>${n}</h3><div class="price">${h(P[k].label)}</div><div class="small muted">${h(P[k].per)}</div>
          <p class="small">${h(P[k].note)}${k === 'annual' ? ` (au lieu de ${fmt(yearlyOfMonthly)} en mensuel, soit ${fmt(saving)} d'économie)` : ''}${k === 'lifetime' ? ` (≈ ${Math.round(P.lifetime.amount / P.annual.amount * 10) / 10} années d'abonnement annuel)` : ''}</p>
          ${C.checkout[k] ? `<a class="btn buy" data-buy="${k}" href="${h(C.checkout[k])}" target="_blank" rel="noopener">Choisir ${n.toLowerCase()}</a>` : '<button class="btn" disabled title="Lien de paiement non configuré">Bientôt disponible</button>'}
        </div>`).join('')}
    </div>
    <div class="card"><label class="chk"><input type="checkbox" id="consent"> <span class="small">Je demande que l'accès Premium commence dès la réception de ma clé, avant la fin du délai de rétractation, et je reconnais perdre mon droit de rétractation une fois la clé activée (contenu numérique, art. L221-28 13° du Code de la consommation).</span></label>
      ${configured ? '' : '<p class="small muted">Les liens de paiement ne sont pas encore configurés (js/config.js → checkout).</p>'}</div>
    <div class="card"><h3>J'ai une clé de licence</h3>
      <p class="small">Après le paiement, vous recevez une clé qui commence par « KS1. ». Collez-la ici : elle est vérifiée <b>sur l'appareil, sans Internet</b>, et reste valable hors ligne jusqu'à son échéance.</p>
      <textarea id="licIn" placeholder="KS1.…" style="min-height:70px"></textarea>
      <div class="row"><button class="btn" data-lic="activate">Activer</button>${state.lic ? '<button class="btn ghost danger" data-lic="remove">Retirer la licence de cet appareil</button>' : ''}${state.lic && state.lic.sid && C.renewUrl ? '<button class="btn ghost" data-lic="renew">Renouveler en ligne</button>' : ''}</div>
      <div id="licMsg" class="small"></div>
    </div>
    <div class="card"><h3>Gratuit ou Premium</h3><div class="tablewrap"><table><tr><th>Fonction</th><th>Gratuit</th><th>Premium</th></tr>
      ${FEATURES.map(([f, a, b]) => `<tr><td>${h(f)}</td><td>${cell(a)}</td><td>${cell(b)}</td></tr>`).join('')}</table></div>
      <p class="small muted">Les informations de sécurité (actions d'urgence, numéros, position) restent gratuites pour tous. Prix TTC. Vos données restent sur votre appareil, en gratuit comme en Premium.</p></div>`;
    el.onclick = async e => {
      const buy = e.target.closest('[data-buy]');
      if (buy && !el.querySelector('#consent').checked) { e.preventDefault(); UI.notice('Cochez d\'abord la case d\'accord sur le début immédiat de l\'accès, juste sous les formules.'); return; }
      const b = e.target.closest('[data-lic]'); if (!b) return;
      const msg = el.querySelector('#licMsg');
      if (b.dataset.lic === 'activate') {
        try { await activate(el.querySelector('#licIn').value); App.refresh(); App.go('premium'); }
        catch (err) { msg.textContent = 'Activation impossible : ' + err.message + '.'; msg.className = 'small danger'; }
      }
      if (b.dataset.lic === 'remove' && await UI.confirm('Retirer la licence de cet appareil ? Gardez une copie de votre clé pour la réactiver.', 'Retirer')) { remove(); App.refresh(); App.go('premium'); }
      if (b.dataset.lic === 'renew') {
        msg.textContent = 'Renouvellement…';
        try {
          const r = await fetch(C.renewUrl + '?sid=' + encodeURIComponent(state.lic.sid)); const j = await r.json();
          if (!j.licence) throw new Error(j.error || 'aucune licence renvoyée');
          await activate(j.licence); App.refresh(); App.go('premium');
        } catch (err) { msg.textContent = 'Renouvellement impossible : ' + err.message + '.'; }
      }
    };
  }
  window.Premium = { NATIVE, load, verify, activate, remove, isPremium, gate, upsell, lockNote, render, LIMITS, FREE_CALCS, get state() { return state; } };
})();
