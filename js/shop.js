/* Achats : 3 gammes de budget par objet conseillé et liens Amazon.fr.
   - Données : js/gear-tiers.js (GEAR_TIERS.items[clé][gamme]) ; gammes « faible », « moyen », « eleve ».
   - Lien : recherche Amazon.fr ciblée (marque + modèle). KS_CONFIG.amazon.tag (identifiant Partenaires Amazon) est ajouté
     à chaque lien dès qu'il est renseigné, et fait apparaître la mention obligatoire (disclosure()).
   - Prix : estimation du marché (GEAR_TIERS.date). Quand KS_CONFIG.amazon.prices est vrai, le serveur fournit les prix
     officiels de l'API Amazon (route /shop/prices, docs/AMAZON.md) ; Amazon interdit d'afficher un prix de plus de 24 h :
     passé ce délai, l'estimation reprend sa place. */
(function () {
  const DATA = window.GEAR_TIERS || { date: '', items: {} };
  const TIERS = [
    { id: 'faible', label: 'Petit budget', short: '€', hint: 'le moins cher parmi le matériel fiable' },
    { id: 'moyen', label: 'Budget moyen', short: '€€', hint: 'le meilleur rapport qualité-prix' },
    { id: 'eleve', label: 'Gros budget', short: '€€€', hint: 'plus léger, plus durable, plus confortable' },
  ];
  const DEF = 'moyen', LS = 'holdout.prices', DAY = 86400;
  const cfg = () => (window.KS_CONFIG || {}).amazon || {};
  const tierOf = t => TIERS.some(x => x.id === t) ? t : DEF;
  const label = t => TIERS.find(x => x.id === tierOf(t)).label;

  let live = {};
  try { live = JSON.parse(localStorage.getItem(LS) || '{}').items || {}; } catch (e) { }
  const fresh = k => { const L = live[k]; return L && L.price > 0 && Date.now() / 1000 - L.at < DAY ? L : null; };

  function withTag(u) {
    const tag = cfg().tag; if (!tag) return u;
    const x = new URL(u); x.searchParams.set('tag', tag); return x.toString();
  }
  const searchUrl = q => withTag('https://www.amazon.fr/s?k=' + encodeURIComponent(q));

  /* Offre d'un objet dans une gamme : { tier, model, q, url, price, live, at, weight_g, note } ;
     { none } si l'objet ne s'achète pas ; null si l'objet n'a pas de gammes. */
  function offer(key, tier) {
    const t = DATA.items[key]; if (!t) return null;
    if (t.none) return { none: t.none };
    tier = tierOf(tier);
    const o = t[tier], L = fresh(key + '.' + tier);
    return {
      tier, model: o.model, q: o.q, note: o.note || '', weight_g: o.weight_g || 0,
      url: L && L.url ? withTag(L.url) : searchUrl(o.q),
      price: L ? L.price : o.price, live: !!L, at: L ? L.at : null,
    };
  }
  const has = key => !!(DATA.items[key] && !DATA.items[key].none);

  /* Ligne de sac ou du plan maison : applique la gamme (nom, prix, poids) sauf si l'utilisateur a modifié la ligne à la main. */
  function apply(line, key, base, tier) {
    const o = offer(key, tier);
    line.shop = key; line.base = base;
    if (!o || o.none) { line.name = base; return line; }
    line.tier = o.tier; line.name = base + ' — ' + o.model;
    line.price = o.price; line.weight_g = o.weight_g || 0; // poids du modèle choisi seulement : 0 = inconnu
    return line;
  }
  function retier(lines, tier) {
    for (const it of lines) if (it.shop && it.base && !it.fixed && has(it.shop)) apply(it, it.shop, it.base, tier);
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = v => (+v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const when = s => new Date(s * 1000).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  /* Prix affiché : prix Amazon daté, ou estimation signalée comme telle. */
  function priceHTML(o) {
    if (!o || o.none) return '';
    return o.live ? `${eur(o.price)} <span class="small muted" title="Prix Amazon.fr relevé le ${esc(when(o.at))} ; il peut avoir changé depuis.">Amazon, ${esc(when(o.at))}</span>`
      : `≈ ${eur(o.price)} <span class="small muted" title="Prix indicatif du marché (estimation du ${esc(dateFr())}). Le prix réel s'affiche sur Amazon.">indicatif</span>`;
  }
  function linkHTML(o, text) {
    if (!o) return '';
    if (o.none) return `<span class="small muted">${esc(o.none)}</span>`;
    return `<a class="buy" href="${esc(o.url)}" target="_blank" rel="noopener sponsored">${esc(text || 'Voir sur Amazon')}</a>`;
  }
  const dateFr = () => DATA.date ? DATA.date.split('-').reverse().join('/') : '';
  function disclosure() {
    return cfg().tag ? 'En tant que Partenaire Amazon, Holdout réalise un bénéfice sur les achats remplissant les conditions requises.'
      : 'Les liens mènent à une recherche sur Amazon.fr.';
  }
  function priceNote() {
    return cfg().prices ? 'Prix Amazon.fr mis à jour chaque jour quand l\'appareil est en ligne ; sinon, prix indicatif du marché.'
      : `Prix indicatifs du marché estimés le ${dateFr()} : le prix réel s'affiche sur Amazon.`;
  }
  function tierSelect(attr, value, cls = '') {
    return `<select ${attr} class="${cls}" aria-label="Gamme de budget">${TIERS.map(t => `<option value="${t.id}" ${tierOf(value) === t.id ? 'selected' : ''}>${t.short} ${t.label}</option>`).join('')}</select>`;
  }

  /* Prix officiels (API Amazon côté serveur) : au plus une fois par heure, en ligne seulement. */
  async function refresh() {
    const api = ((window.KS_CONFIG || {}).account || {}).api;
    if (!cfg().prices || !api || !navigator.onLine) return false;
    try {
      const last = +JSON.parse(localStorage.getItem(LS) || '{}').fetched || 0;
      if (Date.now() - last < 36e5) return false;
    } catch (e) { }
    try {
      const r = await fetch(api + '/shop/prices'); if (!r.ok) return false;
      const j = await r.json(); live = j.items || {};
      try { localStorage.setItem(LS, JSON.stringify({ fetched: Date.now(), items: live })); } catch (e) { }
      return true;
    } catch (e) { return false; }
  }

  window.Shop = { TIERS, DEF, tierOf, label, offer, has, apply, retier, priceHTML, linkHTML, disclosure, priceNote, tierSelect, searchUrl, refresh, date: dateFr };
})();
