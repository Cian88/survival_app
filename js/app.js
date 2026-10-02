/* Holdout — logique de l'application (vanilla JS, aucun serveur requis). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const kg = g => ((+g || 0) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' kg';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const today = () => new Date().toISOString().slice(0, 10);
  const GEAR = window.GEAR || [];
  const GEAR_BY_ID = window.GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
  const srcLinks = keys => (keys || []).map(k => SOURCES[k] ? `<a href="${SOURCES[k].u}" target="_blank" rel="noopener">${h(SOURCES[k].t.split(' — ')[0])}</a>` : '').join(' · ');

  const DEFAULT = {
    profile: { adults: 2, children: 0, babies: 0, pets: 0, days: 14, waterL: 4, kcal: 2100, budget: 1000, tier: 'moyen', lieu: [], climat: [], home: null, dwelling: 'maison', floor: 0, heating: 'electrique', cooking: 'electrique', water: 'reseau', vehicle: false, health: {}, skills: {} },
    checks: {}, inventory: [], bags: [], homePlan: [], contacts: [], notes: { rdv: '', pims: '', famille: '' }, lastCheck: null, points: [], map: {},
  };
  const App = window.App = {
    state: Object.assign(structuredClone(DEFAULT), Store.load()),
    save() { Store.save(this.state); if (window.Account) Account.changed(); },
    /* Remplace l'état par celui reçu de la synchronisation, sans changer d'objet (les modules gardent leur référence). */
    applyState(next) {
      for (const k of Object.keys(this.state)) delete this.state[k];
      Object.assign(this.state, structuredClone(next || {}));
      normalize(); Store.save(this.state); if (this.refresh) this.refresh();
    },
    download(name, content, mime) {
      if (window.Native && Native.isNative) return Native.saveFile(name, content, mime).catch(e => UI.notice('Export impossible : ' + e.message));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: mime || 'text/plain' }));
      a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      if (window.self !== window.top) UI.showText(name, content); // cadre intégré (ex. Artifact) : téléchargement souvent bloqué
    },
  };
  const S = App.state;
  function normalize() {
    for (const k in DEFAULT) if (S[k] == null) S[k] = structuredClone(DEFAULT[k]);
    for (const k in DEFAULT.profile) if (S.profile[k] == null) S.profile[k] = structuredClone(DEFAULT.profile[k]);
    S.audit = S.audit || {};
    if (!S.bags.length) S.bags.push({ id: uid(), name: 'Sac adulte 1', owner: '', items: [], env: [] });
  }
  normalize();

  /* ---------- Calculs ---------- */
  function persons() { return (+S.profile.adults || 0) + (+S.profile.children || 0); }
  function needs() {
    const p = persons(), d = +S.profile.days || 0;
    return { water: p * d * (+S.profile.waterL || 0), kcal: p * d * (+S.profile.kcal || 0), water72: p * 6 };
  }
  function stock() {
    let water = 0, kcal = 0;
    for (const it of S.inventory) { water += (+it.qty || 0) * (+it.litres || 0); kcal += (+it.qty || 0) * (+it.kcal || 0); }
    return { water, kcal };
  }
  function expiring(days = 60) {
    const lim = Date.now() + days * 864e5;
    return S.inventory.filter(it => it.expiry && new Date(it.expiry).getTime() <= lim).sort((a, b) => a.expiry.localeCompare(b.expiry));
  }
  function pillarScore(p) { const n = p.items.length, c = p.items.filter((_, i) => S.checks[p.id + ':' + i]).length; return { c, n, pct: n ? Math.round(c / n * 100) : 0 }; }
  function rescaleHome() {
    const n = Math.max(1, (+S.profile.adults || 0) + (+S.profile.children || 0)), d = +S.profile.days || 3, W = +S.profile.waterL || 4;
    for (const it of S.homePlan) { const r = Bags.HOME_RULES[it.gearId]; if (r && it.auto !== false) { it.auto = true; it.qty = r.q(n, d, W); } }
  }
  function bagTotals(b) {
    let w = 0, cost = 0, left = 0, have = 0;
    for (const it of b.items) { const q = +it.qty || 1; w += q * (+it.weight_g || 0); cost += q * (+it.price || 0); if (it.have) have++; else left += q * (+it.price || 0); }
    return { w, cost, left, have, n: b.items.length };
  }
  function planLines() {
    const lines = [];
    S.bags.forEach(b => b.items.forEach(it => lines.push(Object.assign({ where: b.name }, it))));
    S.homePlan.forEach(it => lines.push(Object.assign({ where: 'Maison' }, it)));
    return lines;
  }
  function budget() {
    let total = 0, spent = 0; const byCat = {};
    for (const l of planLines()) {
      const v = (+l.qty || 1) * (+l.price || 0); total += v; if (l.have) spent += v;
      const c = byCat[l.category || 'Autre'] = byCat[l.category || 'Autre'] || { total: 0, spent: 0 };
      c.total += v; if (l.have) c.spent += v;
    }
    return { total, spent, left: total - spent, byCat };
  }
  function nextCheck() { if (!S.lastCheck) return null; const d = new Date(S.lastCheck); d.setMonth(d.getMonth() + 6); return d; }
  const bar = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;

  /* ---------- État des lieux (remplace l'ancien tableau de bord) ---------- */
  function alertsHTML() {
    const exp = expiring(), nc = nextCheck(), alerts = [];
    exp.forEach(it => alerts.push([new Date(it.expiry) < new Date() ? 'bad' : '', `Péremption ${new Date(it.expiry) < new Date() ? 'dépassée' : 'proche'} : ${h(it.name)} (${it.expiry})`]));
    if (!nc) alerts.push(['', 'Aucune vérification du kit enregistrée : piles, dates et vêtements sont à contrôler deux fois par an (onglet Plan).']);
    else if (nc < new Date()) alerts.push(['bad', `Vérification semestrielle du kit en retard (prévue le ${nc.toLocaleDateString('fr-FR')}).`]);
    if (!S.profile.home) alerts.push(['', 'Domicile non renseigné : renseignez-le dans « Mon profil » pour calculer les risques proches et préparer votre carte hors ligne.']);
    return alerts.length ? `<div class="card"><h3>Alertes</h3>${alerts.map(([c, t]) => `<div class="alert ${c}">${t}</div>`).join('')}</div>` : '';
  }
  let ctxLoaded = false;
  function renderAudit() {
    const el = $('#tab-audit');
    Needs.render(el, S);
    el.insertAdjacentHTML('beforeend', alertsHTML());
    if (!ctxLoaded) { ctxLoaded = true; Needs.refreshCtx(S).then(() => { if (current === 'audit') UI.preserveFocus(el, renderAudit); ctxLoaded = false; }); }
  }

  /* ---------- Écosystème maison ---------- */
  const INV_CATS = ['eau', 'nourriture', 'energie', 'sante', 'hygiene', 'comm', 'docs', 'securite', 'autre'];
  const CAT_LABEL = { eau: 'Eau', nourriture: 'Nourriture', energie: 'Énergie/chaleur/lumière', sante: 'Santé', hygiene: 'Hygiène', comm: 'Communication', docs: 'Documents/argent', securite: 'Sécurité/outils', autre: 'Autre' };
  const openPillars = new Set(PILLARS.length ? [PILLARS[0].id] : []);
  function renderHome() {
    const n = needs(), s = stock(), P = S.profile;
    const inv = [...S.inventory].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
    $('#tab-home').innerHTML = `
    <div class="card">
      <h2>Besoins calculés — ${persons()} personne(s)</h2>
      <label>Durée d'autonomie visée <select data-homedays="1">${[3, 7, 14, 30, 60, 90].map(d => `<option value="${d}" ${+P.days === d ? 'selected' : ''}>${d} jours</option>`).join('')}</select></label>
      <p class="small muted">Seuls les consommables suivent la durée (nourriture, pastilles, papier, sacs, gaz). L'eau <b>stockée</b> est plafonnée à 14 jours : au-delà, il faut une source renouvelable (pluie, puits, cours d'eau) et un traitement ; filtre, récupérateur, panneaux solaires ou réchaud sont des équipements durables, dont la quantité ne dépend pas de la durée.</p>
      <div class="tablewrap"><table><tr><th>Poste</th><th class="num">Besoin</th><th class="num">En stock</th><th class="num">Manque</th></tr>
      <tr><td>Eau de boisson (${P.waterL} L/pers/j)</td><td class="num">${n.water.toFixed(0)} L</td><td class="num">${s.water.toFixed(1)} L</td><td class="num">${Math.max(0, n.water - s.water).toFixed(1)} L</td></tr>
      <tr><td>Énergie alimentaire (${P.kcal} kcal/pers/j)</td><td class="num">${n.kcal.toLocaleString('fr-FR')} kcal</td><td class="num">${Math.round(s.kcal).toLocaleString('fr-FR')} kcal</td><td class="num">${Math.max(0, Math.round(n.kcal - s.kcal)).toLocaleString('fr-FR')} kcal</td></tr>
      <tr><td>Eau totale OMS (boisson + cuisine + hygiène, 7,5–15 L/pers/j)</td><td class="num">${(persons() * P.days * 7.5).toFixed(0)}–${(persons() * P.days * 15).toFixed(0)} L</td><td class="num" colspan="2">à couvrir par stock + eau non potable traitée</td></tr>
      <tr><td>Argent liquide (Suède : ≥ 1 semaine de dépenses courantes)</td><td class="num" colspan="3">montant à définir selon votre foyer</td></tr>
      <tr><td>Traitements chroniques (Suède : 1 mois)</td><td class="num" colspan="3">à voir avec votre médecin/pharmacien</td></tr>
      </table></div>
      ${P.pets ? `<p class="small">🐾 ${P.pets} animal(aux) : ajoutez leur eau et leur nourriture (SGDSN, BBK, BWL).</p>` : ''}
      <p class="src">Sources : ${srcLinks(['sgdsn', 'bbk', 'msb', 'oms', 'fi'])}</p>
    </div>
    <div class="card">
      <h2>Inventaire du stock</h2>
      <p class="small muted">Saisissez vos réserves. Pour la nourriture, reportez les kcal indiquées sur l'emballage (par unité). Les alertes de péremption apparaissent 60 jours avant.</p>
      <form id="invForm" class="row">
        <input name="name" aria-label="Nom de l'article" placeholder="Article (ex. Pack eau 6×1,5 L)" required style="flex:1 1 220px">
        <select name="cat" aria-label="Catégorie de l'article">${INV_CATS.map(c => `<option value="${c}">${CAT_LABEL[c]}</option>`).join('')}</select>
        <label>Qté <input name="qty" type="number" min="0" step="any" value="1"></label>
        <label>L/unité <input name="litres" type="number" min="0" step="any" placeholder="0"></label>
        <label>kcal/unité <input name="kcal" type="number" min="0" step="any" placeholder="0"></label>
        <label>Péremption <input name="expiry" type="date"></label>
        <input name="where" aria-label="Emplacement de l'article" placeholder="Emplacement" style="width:9em">
        <button class="btn">Ajouter</button>
      </form>
      <div class="row small">Raccourcis eau : <button class="link" data-quick="9">Pack 6 × 1,5 L (9 L)</button> <button class="link" data-quick="5">Bidon 5 L</button> <button class="link" data-quick="20">Jerrican 20 L</button></div>
      <div class="tablewrap"><table>
        <tr><th>Article</th><th>Catégorie</th><th class="num">Qté</th><th class="num">Eau</th><th class="num">kcal</th><th>Péremption</th><th class="hide-sm">Emplacement</th><th></th></tr>
        ${inv.map(it => { const late = it.expiry && new Date(it.expiry) < new Date(), soon = it.expiry && !late && new Date(it.expiry) < Date.now() + 60 * 864e5; return `<tr>
          <td>${h(it.name)}</td><td>${h(CAT_LABEL[it.cat] || it.cat)}</td>
          <td class="num"><input type="number" min="0" step="any" value="${it.qty}" data-invqty="${it.id}" aria-label="Quantité : ${h(it.name)}" style="width:5em"></td>
          <td class="num">${it.litres ? (it.qty * it.litres).toFixed(1) + ' L' : ''}</td><td class="num">${it.kcal ? Math.round(it.qty * it.kcal).toLocaleString('fr-FR') : ''}</td>
          <td class="${late ? 'danger' : soon ? '' : ''}">${it.expiry ? (late ? '⚠ ' : soon ? '⏳ ' : '') + it.expiry : ''}</td><td class="hide-sm">${h(it.where || '')}</td>
          <td><button class="link danger" data-invdel="${it.id}" aria-label="Supprimer : ${h(it.name)}">suppr.</button></td></tr>`; }).join('') || '<tr><td colspan="8" class="muted">Inventaire vide.</td></tr>'}
      </table></div>
      <button class="btn ghost" data-act="invcsv">Exporter l'inventaire (CSV)</button>
    </div>
    <h2>Les 9 piliers de l'écosystème</h2>
    <div class="grid pillars-grid">${PILLARS.map(p => { const x = pillarScore(p); return `<details class="card pillar-card" data-pillar="${p.id}" ${openPillars.has(p.id) ? 'open' : ''}>
      <summary data-pillar-summary="${p.id}"><h3>${p.icon} ${h(p.name)} <span class="chip">${x.c}/${x.n}</span></h3></summary><div class="pillar-content">${bar(x.pct)}
      <p class="small">${h(p.why)}</p>
      <ul class="check">${p.items.map((t, i) => `<li><label><input type="checkbox" data-check="${p.id}:${i}" ${S.checks[p.id + ':' + i] ? 'checked' : ''}> <span>${h(t)}</span></label></li>`).join('')}</ul>
      <p class="src">Sources : ${srcLinks(p.src)}</p></div></details>`; }).join('')}</div>`;
    $('#tab-home').querySelectorAll('[data-pillar]').forEach(details => details.addEventListener('toggle', () => {
      if (!details.isConnected) return;
      if (details.open) openPillars.add(details.dataset.pillar); else openPillars.delete(details.dataset.pillar);
    }));
  }

  /* ---------- Sac d'évacuation ---------- */
  function gearOptions(scopeFilter) {
    const cats = {};
    GEAR.filter(g => !scopeFilter || g.scope !== 'maison').forEach(g => (cats[g.category] = cats[g.category] || []).push(g));
    return Object.entries(cats).map(([c, list]) => `<optgroup label="${h(c)}">${list.map(g => `<option value="${g.id}">${h(g.name)}${g.price_eur ? ' — ' + eur(g.price_eur) : ''}</option>`).join('')}</optgroup>`).join('');
  }
  /* Ligne de sac ou du plan maison pour un objet du catalogue, dans la gamme de budget demandée (js/shop.js). */
  function lineFromGear(g, tier) {
    const l = { key: uid(), gearId: g.id, name: g.name + (g.model ? ' — ' + g.model : ''), category: g.category, qty: g.qty || 1, weight_g: g.weight_g || 0, price: g.price_eur || 0, have: false };
    return Shop.has(g.id) ? Shop.apply(l, g.id, g.name, tier) : l;
  }
  const bagTier = b => Shop.tierOf(b.tier || S.profile.tier);
  /* Clé d'achat d'une ligne (lignes créées avant les gammes de budget : déduite de l'objet d'origine). */
  const shopKey = it => it.shop || it.gearId || it.envKey || (it.rid && 'bag:' + it.rid);
  function buyCell(it, tier) {
    const k = shopKey(it), o = k && Shop.offer(k, it.tier || tier);
    if (!o || o.none) return '';
    // Ligne d'avant les gammes : son nom cite le modèle de référence du catalogue, le lien cherche ce modèle.
    if (!it.shop && it.gearId && GEAR_BY_ID[it.gearId] && GEAR_BY_ID[it.gearId].model) return ` <a class="buy small" href="${h(Shop.searchUrl(GEAR_BY_ID[it.gearId].model))}" target="_blank" rel="noopener sponsored">Amazon</a>`;
    return ` <a class="buy small" href="${h(o.url)}" target="_blank" rel="noopener sponsored" title="${h(o.model)}">Amazon</a>`;
  }
  /* Applique la gamme à des lignes : celles d'avant les gammes reçoivent leur clé, les lignes modifiées à la main restent telles quelles. */
  function retier(lines, tier) {
    for (const it of lines) {
      if (!it.shop) { const k = shopKey(it); if (k && Shop.has(k)) { it.shop = k; it.base = it.gearId && GEAR_BY_ID[it.gearId] ? GEAR_BY_ID[it.gearId].name : it.envKey ? envBase(it.envKey) : it.name; } }
    }
    Shop.retier(lines, tier);
  }
  App.retierHome = () => retier(S.homePlan, S.profile.tier);
  /* ---------- Variantes du sac selon l'environnement ---------- */
  const ENVS = window.ENV_VARIANTS || [];
  const ENV_BY_ID = Object.fromEntries(ENVS.map(e => [e.id, e]));
  const srcA = u => u && /^https?:/.test(u) ? ` <a class="src" href="${h(u)}" target="_blank" rel="noopener">[source]</a>` : '';
  function envSelector(b) {
    if (!ENVS.length) return '';
    b.env = b.env || [];
    const group = axis => ENVS.filter(e => e.axis === axis).map(e => `<button class="envchip ${b.env.includes(e.id) ? 'on' : ''}" data-env="${b.id}|${e.id}" aria-pressed="${b.env.includes(e.id)}">${h(e.short || e.name)}</button>`).join('');
    return `<div class="envsel"><span class="small muted">Lieu :</span> ${group('lieu')} <span class="small muted">Climat :</span> ${group('climat')}</div>`;
  }
  function envPanel(b) {
    const list = (b.env || []).map(id => ENV_BY_ID[id]).filter(Boolean);
    if (!list.length) return ENVS.length ? '<p class="small muted">Choisissez le lieu et le climat où ce sac servira : l\'app affiche les risques propres à cet environnement et le matériel à ajouter.</p>' : '';
    const have = new Set(b.items.map(i => i.envKey).filter(Boolean));
    return `<details class="envpanel" open><summary>Adaptations : ${list.map(e => h(e.name)).join(' + ')}</summary>
      ${list.map(e => `<div class="envblock">
        <h4>${h(e.name)}</h4>${e.summary ? `<p class="small">${h(e.summary)}</p>` : ''}
        ${e.risks && e.risks.length ? `<p class="small"><b>Risques :</b></p><ul class="small">${e.risks.map(r => `<li>${h(r.t)}${srcA(r.src)}</li>`).join('')}</ul>` : ''}
        ${e.add && e.add.length ? `<p class="small"><b>À ajouter ou renforcer :</b></p><ul class="small addlist">${e.add.map((a, i) => { const k = e.id + ':' + i; return `<li><span class="chip ${h(a.priority || '')}">${h(a.priority || '')}</span> <b>${h(a.item)}</b> — ${h(a.why)}${srcA(a.src)}${buyCell({ shop: k }, bagTier(b))} ${have.has(k) ? '<span class="muted">✓ dans le sac</span>' : `<button class="link" data-envadd="${b.id}|${k}">+ ajouter</button>`}</li>`; }).join('')}</ul>` : ''}
        ${e.lighten && e.lighten.length ? `<p class="small"><b>Moins utile / à alléger :</b></p><ul class="small">${e.lighten.map(r => `<li>${h(r.item)} — ${h(r.why)}${srcA(r.src)}</li>`).join('')}</ul>` : ''}
        ${e.quantities && e.quantities.length ? `<p class="small"><b>Quantités :</b></p><ul class="small">${e.quantities.map(r => `<li>${h(r.t)}${srcA(r.src)}</li>`).join('')}</ul>` : ''}
        ${e.reflexes && e.reflexes.length ? `<p class="small"><b>Réflexes :</b></p><ul class="small">${e.reflexes.map(r => `<li>${h(r.t)}${srcA(r.src)}</li>`).join('')}</ul>` : ''}
        ${e.mistakes && e.mistakes.length ? `<p class="small"><b>Erreurs fréquentes :</b></p><ul class="small">${e.mistakes.map(r => `<li>${h(r.t)}${srcA(r.src)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')}
      <button class="btn ghost" data-envaddall="${b.id}">Ajouter tous les « essentiels » de ces environnements</button>
    </details>`;
  }
  const envBase = k => { const [id, i] = k.split(':'), a = ENV_BY_ID[id].add[+i]; return a.item + ' (' + ENV_BY_ID[id].name + ')'; };
  function envLine(k, tier) {
    const [id, i] = k.split(':'), a = ENV_BY_ID[id].add[+i];
    const l = { key: uid(), envKey: k, name: envBase(k), category: a.category || 'Environnement', qty: 1, weight_g: 0, price: 0, have: false };
    return Shop.has(k) ? Shop.apply(l, k, envBase(k), tier) : l;
  }
  function renderEnvCompare() {
    if (!ENVS.length) return '';
    return `<div class="card"><h2>Variantes du sac selon l'environnement</h2>
      <p class="small">Vue d'ensemble des ${ENVS.length} environnements. Sélectionnez-les directement sur un sac (boutons « Lieu » et « Climat ») pour obtenir la liste adaptée. Sources : praticiens, secours en montagne, médecine du chaud et du froid (liens [source]).</p>
      <div class="grid">${ENVS.map(e => `<details class="envcard"><summary><b>${h(e.name)}</b> <span class="chip">${e.axis === 'lieu' ? 'lieu' : 'climat'}</span><div class="small muted">${h(e.summary || '')}</div></summary>
        <p class="small"><b>Risques :</b> ${(e.risks || []).map(r => h(r.t)).join(' · ')}</p>
        <p class="small"><b>Ajouter :</b> ${(e.add || []).map(a => h(a.item)).join(' · ')}</p>
        <p class="small"><b>Réflexes :</b> ${(e.reflexes || []).map(r => h(r.t)).join(' · ')}</p></details>`).join('')}</div></div>`;
  }
  function renderBag() {
    const K = +S.profile.kcal || 2100;
    $('#tab-bag').innerHTML = `
    <div class="card">
      <h2>Mes sacs</h2>
      <p class="small">Deux types de sac, deux usages : le <b>sac d'évacuation</b> sert à rejoindre vite un lieu sûr ; le <b>sac de survie</b> sert à tenir en autonomie en pleine nature. Choisissez le type et la <b>durée d'autonomie</b> : seuls les <b>consommables</b> (eau portée, pastilles, nourriture, gaz, piles, hygiène, médicaments) s'ajustent. Les <b>équipements durables</b> (filtre, réchaud, panneau solaire, vêtements, outils) gardent la même quantité : un filtre sert aussi bien 1 jour que 3 mois. Testez toujours le sac chargé sur une vraie marche. À la création, choisissez votre <b>budget</b> : pour chaque objet, l'app propose un modèle petit budget, moyen ou gros budget, avec son lien Amazon.</p>
      <div class="row"><button class="btn" data-act="bagnew" data-type="evac">+ Sac d'évacuation</button><button class="btn" data-act="bagnew" data-type="survie">+ Sac de survie</button></div>
    </div>
    ${S.bags.map(b => { b.type = b.type || 'evac'; const T = Bags.TYPES[b.type]; b.days = b.days || T.def; const t = bagTotals(b); return `<div class="card bagcard bag-${b.type}" data-bag="${b.id}">
      <div class="row"><span class="bagicon">${T.icon}</span><input value="${h(b.name)}" aria-label="Nom du sac" data-bagname="${b.id}" style="font-weight:600;flex:1 1 200px"> <button class="link danger" data-bagdel="${b.id}">supprimer le sac</button></div>
      <div class="row">
        <label>Type <select data-bagtype="${b.id}">${Object.entries(Bags.TYPES).map(([k, x]) => `<option value="${k}" ${b.type === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        <label>Autonomie <select data-bagdays="${b.id}">${T.durations.map(d => `<option value="${d}" ${+b.days === d ? 'selected' : ''}>${Bags.dLabel(d)}</option>`).join('')}</select></label>
        <label>Budget ${Shop.tierSelect(`data-bagtier="${b.id}"`, bagTier(b))}</label>
      </div>
      <details class="small"><summary class="muted">À quoi sert un ${T.name.toLowerCase()} ?</summary><p>${h(T.purpose)}</p><p class="src">${T.src.map(x => `<a href="${h(x.u)}" target="_blank" rel="noopener">${h(x.t)}</a>`).join(' · ')}</p></details>
      <div class="row small"><span class="chip">${t.have}/${t.n} objets prêts</span><span class="chip">Poids connu : ${kg(t.w)}</span><span class="chip">Coût total : ${eur(t.cost)}</span><span class="chip">Reste à acheter : ${eur(t.left)}</span></div>
      <div class="alert small">Pour ${Bags.dLabel(+b.days)} : ${b.type === 'evac' ? `${Math.min(+b.days, 3)} L d'eau portée + traitement de ${3 * b.days} L` : `traitement de ${4 * b.days} L d'eau`} · ${(K * b.days).toLocaleString('fr-FR')} kcal de nourriture (${K} kcal/jour, réglable dans le profil).</div>
      ${envSelector(b)}
      ${envPanel(b)}
      <div class="row"><select aria-label="Ajouter un objet à ${h(b.name)}" data-bagadd="${b.id}" style="flex:1 1 260px"><option value="">+ Ajouter depuis le catalogue…</option>${gearOptions(true)}</select>
        <button class="btn ghost" data-bagprefill="${b.id}">Pré-remplir : ${T.name.toLowerCase()} ${Bags.dLabel(+b.days)}</button>
        <button class="btn ghost" data-bagcustom="${b.id}">+ Objet personnalisé</button></div>
      <div class="tablewrap"><table><tr><th>✓</th><th>Objet</th><th class="num">Qté</th><th class="num">Poids u. (g)</th><th class="num">Prix u. (€)</th><th></th></tr>
      ${b.items.map(it => { const note = it.auto ? Bags.ruleNote(b, it) : ''; return `<tr><td><input type="checkbox" aria-label="Acquis : ${h(it.name)}" data-bh="${b.id}|${it.key}" ${it.have ? 'checked' : ''}></td><td>${h(it.name)}${it.have ? '' : buyCell(it, bagTier(b))}<div class="small muted">${h(it.category || '')}${it.auto ? ` · <span class="chip auto" title="${h(note || '')}">consommable · ${Bags.dLabel(+b.days)}</span>${note ? ` <span class="small">${h(note)}</span>` : ''}` : it.kind === 'durable' ? ' · <span class="chip" title="Même quantité quelle que soit la durée">durable</span>' : ''}</div></td>
        <td class="num"><input type="number" min="0" value="${it.qty}" aria-label="Quantité : ${h(it.name)}" data-bf="${b.id}|${it.key}|qty" style="width:4em">${it.unit ? `<div class="small muted">${h(it.unit)}</div>` : ''}</td>
        <td class="num"><input type="number" min="0" value="${it.weight_g || 0}" aria-label="Poids unitaire en grammes : ${h(it.name)}" data-bf="${b.id}|${it.key}|weight_g" style="width:5.5em"></td>
        <td class="num"><input type="number" min="0" step="0.01" value="${it.price || 0}" aria-label="Prix unitaire en euros : ${h(it.name)}" data-bf="${b.id}|${it.key}|price" style="width:6em"></td>
        <td><button class="link danger" aria-label="Supprimer : ${h(it.name)}" data-bdel="${b.id}|${it.key}">✕</button></td></tr>`; }).join('') || `<tr><td colspan="6" class="muted">Sac vide : utilisez « Pré-remplir ».</td></tr>`}
      </table></div>
      <p class="small muted">${h(Shop.priceNote())} Un prix ou un poids modifié à la main est conservé quand vous changez de budget. ${h(Shop.disclosure())}</p></div>`; }).join('')}
    ${renderEnvCompare()}
    <div class="card"><h3>Listes de référence officielles</h3>
      <p><b>Kit 72 h — guide SGDSN (France)</b> : 6 L d'eau/personne en bouteilles, pastilles de désinfection (dernier recours), nourriture non périssable sans cuisson, médicaments habituels, lunettes de secours, gel, masques, pansements, couteau multifonction, ouvre-boîte, réchaud, radio à piles, batterie externe, piles, chargeur, savon, lampe, bougies, allumettes, briquet, vêtements chauds, couverture de survie, doubles des clés, photocopies des papiers (pochette étanche), argent liquide, jeux/livres.</p>
      <p><b>Sac d'évacuation — BBK (Allemagne)</b> : vêtements chauds, protection pluie, chaussures solides, rechange, premiers secours, médicaments, powerbank, hygiène, nourriture longue conservation, gourde, dossier documents, sac de couchage ou couverture, couverts, couteau, ouvre-boîte, lampe, radio, briquet, crème solaire, couvre-chef, bloc-notes et stylo, gants de travail, lunettes de rechange, argent liquide.</p>
      <p><b>Évacuation — MSB (Suède)</b> : ajoute carte et boussole, informations importantes sur papier.</p>
      ${window.APS_BAG ? `<p><b>Sac d'évacuation — chaîne Apprendre Préparer (Sur)vivre</b> (source non officielle) : ${APS_BAG.map(([k, v]) => `<i>${h(k)}</i> : ${h(v)}`).join(' ; ')}. Détails dans l'onglet Notice & infos.</p>` : ''}
      <p class="src">Sources : ${srcLinks(['sgdsn', 'bbk', 'msb'])}</p></div>`;
  }

  /* ---------- Matériel & budget ---------- */
  let gf = { q: '', cat: '', scope: '', prio: '' };
  /* Prix unitaire d'un objet du catalogue dans une gamme (prix de référence si l'objet n'a pas de gammes). */
  const gearPrice = (g, tier) => { const o = Shop.offer(g.id, tier); return o && !o.none ? o.price : g.price_eur || 0; };
  function tierTotals(scope, tier) {
    const r = { essentiel: 0, recommandé: 0, optionnel: 0 };
    GEAR.filter(g => scope === 'sac' ? g.scope !== 'maison' : g.scope !== 'sac').forEach(g => { if (r[g.priority] != null) r[g.priority] += gearPrice(g, tier) * (g.qty || 1); });
    return r;
  }
  function tierCell(g, t, sel) {
    const o = Shop.offer(g.id, t);
    return `<td class="tiercell ${t === sel ? 'on' : ''}">${o ? `<div class="small">${h(o.model)}</div><div>${Shop.priceHTML(o)}${o.weight_g ? ` <span class="small muted">· ${o.weight_g} g</span>` : ''}</div>${Shop.linkHTML(o)}${o.note ? `<div class="small muted">${h(o.note)}</div>` : ''}` : '—'}</td>`;
  }
  function renderGear() {
    const tier = Shop.tierOf(S.profile.tier), cats = [...new Set(GEAR.map(g => g.category))];
    const text = g => [g.name, g.model, g.tip, ...Shop.TIERS.map(t => (Shop.offer(g.id, t.id) || {}).model)].join(' ').toLowerCase();
    const list = GEAR.filter(g => (!gf.cat || g.category === gf.cat) && (!gf.scope || g.scope === gf.scope || g.scope === 'les deux') && (!gf.prio || g.priority === gf.prio) && (!gf.q || text(g).includes(gf.q.toLowerCase())));
    const ts = tierTotals('sac', tier), tm = tierTotals('maison', tier), b = budget();
    const bagCost = t => { const x = tierTotals('sac', t); return x.essentiel + x.recommandé; };
    $('#tab-gear').innerHTML = `
    <div class="card"><h2>Récapitulatif budgétaire</h2>
      <div class="row"><label>Gamme ${Shop.tierSelect('data-gtier', tier)}</label><span class="small muted">${h(Shop.priceNote())}</span></div>
      <p class="small">Matériel « sac » du catalogue (essentiel + recommandé, 1 personne) : ${Shop.TIERS.map(t => `${h(t.label.toLowerCase())} <b>${eur(bagCost(t.id))}</b>`).join(' · ')}.</p>
      <div class="tablewrap"><table><tr><th>Palier (${h(Shop.label(tier).toLowerCase())})</th><th class="num">Sac d'évacuation (1 pers.)</th><th class="num">Écosystème maison</th><th class="num">Cumul</th></tr>
      <tr><td><span class="chip essentiel">essentiel</span></td><td class="num">${eur(ts.essentiel)}</td><td class="num">${eur(tm.essentiel)}</td><td class="num">${eur(ts.essentiel + tm.essentiel)}</td></tr>
      <tr><td>+ <span class="chip recommandé">recommandé</span></td><td class="num">${eur(ts.essentiel + ts.recommandé)}</td><td class="num">${eur(tm.essentiel + tm.recommandé)}</td><td class="num">${eur(ts.essentiel + ts.recommandé + tm.essentiel + tm.recommandé)}</td></tr>
      <tr><td>+ <span class="chip optionnel">optionnel</span> (tout)</td><td class="num">${eur(ts.essentiel + ts.recommandé + ts.optionnel)}</td><td class="num">${eur(tm.essentiel + tm.recommandé + tm.optionnel)}</td><td class="num">${eur(Object.values(ts).reduce((a, x) => a + x, 0) + Object.values(tm).reduce((a, x) => a + x, 0))}</td></tr></table></div>
      <div class="alert">Les communautés de praticiens insistent : <b>commencez avec ce que vous avez déjà</b>, constituez d'abord une épargne de précaution, puis achetez progressivement en testant. Les paliers ci-dessous sont une référence, pas un ticket d'entrée : le petit budget couvre les mêmes besoins avec du matériel plus lourd ou moins durable. <a href="https://old.reddit.com/r/preppers/wiki/doingitright" target="_blank" rel="noopener">[wiki r/preppers]</a> <a href="https://theprepared.com/prepping-basics/guides/emergency-preparedness-checklist-prepping-beginners/" target="_blank" rel="noopener">[The Prepared]</a></div>
      <p class="small">Les objets classés « les deux » sont comptés dans chaque colonne (un exemplaire pour le sac, un pour la maison). Le coût du sac est à multiplier par le nombre de personnes (${persons()}), en mutualisant ce qui peut l'être (réchaud, filtre, radio…).</p>
      <h3>Mon plan d'achat (sacs + maison)</h3>
      <div class="row"><span class="kpi">${eur(b.total)}</span><span>prévus · acquis ${eur(b.spent)} · reste ${eur(b.left)} · budget cible ${eur(S.profile.budget)}</span></div>
      ${bar(S.profile.budget ? b.total / S.profile.budget * 100 : 0, b.total > S.profile.budget ? 'bad' : '')}
      <div class="tablewrap"><table><tr><th>Catégorie</th><th class="num">Prévu</th><th class="num">Acquis</th></tr>${Object.entries(b.byCat).sort((a, c) => c[1].total - a[1].total).map(([c, v]) => `<tr><td>${h(c)}</td><td class="num">${eur(v.total)}</td><td class="num">${eur(v.spent)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Ajoutez des objets à un sac ou à la maison.</td></tr>'}</table></div>
      <h3>Achats pour la maison</h3>
      <p class="small muted">Gamme de la maison : celle choisie ci-dessus (modifiable aussi dans Mon profil).</p>
      <div class="tablewrap"><table><tr><th>✓</th><th>Objet</th><th class="num">Qté</th><th class="num">Prix u.</th><th></th></tr>${S.homePlan.map(it => `<tr><td><input type="checkbox" aria-label="Acquis : ${h(it.name)}" data-hh="${it.key}" ${it.have ? 'checked' : ''}></td><td>${h(it.name)}${it.have ? '' : buyCell(it, tier)}<div class="small muted">${h(it.category)}${it.auto && Bags.HOME_RULES[it.gearId] ? ` · <span class="chip auto">auto · ${S.profile.days} j</span> ${h(Bags.HOME_RULES[it.gearId].note)}` : ''}</div></td><td class="num"><input type="number" min="0" value="${it.qty}" aria-label="Quantité : ${h(it.name)}" data-hq="${it.key}" style="width:4em"></td><td class="num">${eur(it.price)}</td><td><button class="link danger" aria-label="Supprimer : ${h(it.name)}" data-hdel="${it.key}">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Rien pour l\'instant — bouton « + Maison » dans le catalogue.</td></tr>'}</table></div>
      <button class="btn ghost" data-act="homeessential">Pré-remplir maison : essentiels</button> <button class="btn ghost" data-act="plancsv">Exporter le plan (CSV)</button> <button class="btn ghost" data-act="catcsv">Exporter le catalogue (CSV)</button>
    </div>
    <div class="card"><h2>Catalogue du matériel (${GEAR.length} références)</h2>
      <p class="small">Pour chaque objet, trois modèles selon le budget. La colonne surlignée est votre gamme ; « + Sac » ajoute le modèle de la gamme du sac choisi.</p>
      <div class="row">
        <input id="gq" aria-label="Rechercher dans le catalogue" placeholder="Rechercher…" value="${h(gf.q)}" style="flex:1 1 200px">
        <select id="gcat" aria-label="Filtrer par catégorie"><option value="">Toutes catégories</option>${cats.map(c => `<option ${gf.cat === c ? 'selected' : ''}>${h(c)}</option>`).join('')}</select>
        <select id="gscope" aria-label="Filtrer par usage"><option value="">Sac + maison</option><option value="sac" ${gf.scope === 'sac' ? 'selected' : ''}>Sac</option><option value="maison" ${gf.scope === 'maison' ? 'selected' : ''}>Maison</option></select>
        <select id="gprio" aria-label="Filtrer par priorité"><option value="">Toutes priorités</option>${['essentiel', 'recommandé', 'optionnel'].map(p => `<option ${gf.prio === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <select id="gbag" aria-label="Sac de destination">${S.bags.map(b => `<option value="${b.id}">→ ${h(b.name)}</option>`).join('')}</select>
      </div>
      <div class="tablewrap"><table class="gear-tiers"><tr><th>Objet</th><th>Priorité</th>${Shop.TIERS.map(t => `<th>${t.short} ${h(t.label)}</th>`).join('')}<th></th></tr>
      ${list.map(g => { const none = (Shop.offer(g.id, tier) || {}).none; return `<tr><td><b>${h(g.name)}</b><div class="small muted">${h(g.category)} · ${h(g.scope)}${g.qty > 1 ? ' · qté suggérée ' + g.qty : ''}</div>${g.tip ? `<div class="small">${h(g.tip)}</div>` : ''}</td>
        <td><span class="chip ${h(g.priority)}">${h(g.priority)}</span></td>
        ${none ? `<td colspan="3" class="small">${h(none)}</td>` : Shop.TIERS.map(t => tierCell(g, t.id, tier)).join('')}
        <td style="white-space:nowrap">${g.scope !== 'maison' ? `<button class="btn ghost" data-tobag="${g.id}">+ Sac</button>` : ''} ${g.scope !== 'sac' ? `<button class="btn ghost" data-tohome="${g.id}">+ Maison</button>` : ''}</td></tr>`; }).join('')}
      </table></div>
      <p class="small muted">${h(Shop.disclosure())} ${h(Shop.priceNote())} Aucune marque n'est imposée : les modèles cités sont des exemples, vérifiez la fiche (taille, compatibilité) avant d'acheter.</p>
    </div>`;
    const upd = () => { gf = { q: $('#gq').value, cat: $('#gcat').value, scope: $('#gscope').value, prio: $('#gprio').value }; UI.preserveFocus($('#tab-gear'), renderGear); };
    $('#gq').oninput = upd; ['gcat', 'gscope', 'gprio'].forEach(id => $('#' + id).onchange = upd);
  }

  /* ---------- Plan & scénarios ---------- */
  function renderPlan() {
    const nc = nextCheck();
    $('#tab-plan').innerHTML = `
    <div class="grid">
      <div class="card"><h2>Contacts d'urgence</h2>
        <p class="small muted">Recopiez aussi cette liste sur papier (BBK, MSB) : sans réseau ni batterie, le téléphone ne sert plus.</p>
        <form id="ctForm" class="row"><input name="name" aria-label="Nom du contact" placeholder="Nom" required><input name="phone" type="tel" aria-label="Téléphone du contact" placeholder="Téléphone"><input name="role" aria-label="Rôle du contact" placeholder="Rôle (voisin, médecin…)"><button class="btn">Ajouter</button></form>
        <div class="tablewrap"><table><tr><th>Nom</th><th>Téléphone</th><th>Rôle</th><th>Actions</th></tr>${S.contacts.map(c => `<tr><td>${h(c.name)}</td><td>${h(c.phone)}</td><td class="small muted">${h(c.role)}</td><td><button class="link danger" data-ctdel="${c.id}" aria-label="Supprimer le contact : ${h(c.name)}">✕</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Aucun contact.</td></tr>'}</table></div>
      </div>
      <div class="card"><h2>Vérification du kit</h2>
        <p>Dernière vérification : <b>${S.lastCheck ? new Date(S.lastCheck).toLocaleDateString('fr-FR') : 'jamais'}</b><br>Prochaine : <b>${nc ? nc.toLocaleDateString('fr-FR') : '—'}</b></p>
        <p class="small">À contrôler : dates de péremption (eau, nourriture, médicaments), piles, charge des batteries, vêtements adaptés à la saison et à la taille des enfants, papiers à jour.</p>
        <button class="btn" data-act="checked">Vérification faite aujourd'hui</button>
        <p class="src">Rythme recommandé : deux fois par an (${srcLinks(['sgdsn'])}).</p>
      </div>
    </div>
    <div class="card"><h2>Plan familial</h2>
      <label for="plan-rdv" style="display:block">Points de rendez-vous (1 proche du domicile, 1 hors du quartier, 1 hors de la ville) — placez-les aussi sur la carte :</label>
      <textarea id="plan-rdv" data-note="rdv">${h(S.notes.rdv)}</textarea>
      <label for="plan-famille" style="display:block">Qui fait quoi (enfants, personnes âgées ou isolées, animaux, voisins) :</label>
      <textarea id="plan-famille" data-note="famille">${h(S.notes.famille)}</textarea>
      <label for="plan-pims" style="display:block">PIMS — Plan individuel de mise en sûreté (risques de l'adresse via Géorisques, pièce refuge, coupures eau/gaz/électricité) :</label>
      <textarea id="plan-pims" data-note="pims">${h(S.notes.pims)}</textarea>
      <p class="src">${srcLinks(['sgdsn', 'georisques'])}</p>
    </div>
    <h2>Réflexes par scénario</h2>
    <div class="grid">${SCENARIOS.map(s => `<div class="card"><h3>${h(s.name)}</h3><ol>${s.steps.map(t => `<li>${h(t)}</li>`).join('')}</ol><p class="src">Source : ${srcLinks(s.src)}</p></div>`).join('')}</div>`;
  }

  /* ---------- Notice & infos ---------- */
  function renderNotice() {
    const K = KEYINFO, A = window.APS;
    $('#tab-notice').innerHTML = `
    <div class="card"><h2>Informations importantes</h2>
      <div class="grid">
        <div><h3>Numéros d'urgence</h3><table>${K.numbers.map(([n, t]) => `<tr><td class="kpi" style="font-size:1.2rem">${n}</td><td>${h(t)}</td></tr>`).join('')}</table><p class="src">${srcLinks(['sgdsn'])}</p></div>
        <div><h3>Alerte & radio</h3><p>${h(K.alert)}</p><p>${h(K.radio)}</p><p class="src">${srcLinks(['sgdsn', 'radiofrance'])}</p></div>
      </div>
      <h3>Rendre l'eau potable</h3><ul>${K.water.map(t => `<li>${h(t)}</li>`).join('')}</ul><p class="src">${srcLinks(['cdc_eau', 'cdc_filtre', 'oms'])}</p>
      <h3>Règle des 3</h3><p>${h(K.rule3)}</p>
      <h3>Sites utiles</h3><p>${K.websites.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${h(t)}</a>`).join(' · ')}</p>
    </div>
    ${A ? `<div class="card"><h2>Apprendre Préparer (Sur)vivre — ce qu'on en retient</h2>${A.html}</div>` : ''}
    <div class="card"><h2>Notice d'utilisation</h2>
      <ol>
        <li><b>Installer hors ligne</b> : ouvrez l'application via un petit serveur local (<code>lancer.sh</code> ou <code>lancer.bat</code>) ou depuis son adresse web, puis « Installer l'application » / « Ajouter à l'écran d'accueil ». Toute l'application (relief Europe intégré compris) est alors disponible sans connexion. Un double-clic sur <code>index.html</code> fonctionne aussi, mais sans installation.</li>
        <li><b>Mon profil</b> (à remplir en premier) : foyer, santé, logement, position du domicile, lieu et climat, compétences. Tout le reste s'adapte à ces réponses.</li>
        <li><b>État des lieux</b> : votre matériel face à vos besoins calculés (eau, nourriture, chaleur, lumière, santé, hygiène, communication, cartes, argent, sécurité, évacuation, savoirs). Les manques vitaux s'affichent en premier ; la liste de courses s'exporte en CSV.</li>
        <li><b>Carte hors ligne</b> : téléchargez <u>avant</u> une crise le pack de votre zone : carte topographique complète (routes, sentiers, courbes de niveau, relief), partout en Europe. Ajoutez les points OSM (eau, santé, abris, dangers) et vos points de rendez-vous. Ensuite, tout fonctionne sans Internet, et le GPS du téléphone aussi.</li>
        <li><b>Instant T</b> : le jour où ça arrive. Localisez-vous, choisissez la situation, puis suivez les actions. L'écran montre votre matériel disponible, les ressources et dangers les plus proches (distance et cap), le chemin vers le domicile ou le point de rendez-vous, et les numéros utiles.</li>
        <li><b>Sacs</b>, <b>Stock maison</b>, <b>Matériel & budget</b> : le détail de ce que vous possédez et de ce que vous prévoyez d'acheter.</li>
        <li><b>Terrain</b> et <b>Calculateurs</b> : le savoir des praticiens et des crises réelles, et les outils de dimensionnement.</li>
        <li><b>Sauvegarde</b> : exportez régulièrement vos données (bouton ci-dessous) sur une clé USB. Vider les données du navigateur efface l'application locale.</li>
        <li><b>Imprimer</b> (version locale, Ctrl+P / Cmd+P) : imprimez plan familial, contacts et listes ; le papier fonctionne sans batterie.</li>
      </ol>
    </div>
    <div class="card"><h2>Données & réglages</h2>
      <button class="btn" data-act="export">Exporter mes données (JSON)</button>
      <label class="btn ghost file">Importer une sauvegarde<input type="file" accept=".json" data-act="import" hidden></label>
      <select data-act="theme" aria-label="Thème d'affichage"><option value="" ${!S.theme ? 'selected' : ''}>Suivre le système</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>Clair · Expédition</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Sombre · Signal</option></select>
      <button class="btn ghost danger" data-act="reset">Tout effacer</button>
    </div>
    <div class="card"><h2>Sources</h2><ul>${Object.values(SOURCES).map(s => `<li><a href="${s.u}" target="_blank" rel="noopener">${h(s.t)}</a></li>`).join('')}</ul>
      <p class="small">Cartographie : OpenStreetMap via Protomaps (ODbL) ; Mapterhorn (IGN, CNIG, Copernicus…) ; Terrain Tiles AWS/Mapzen (EU-DEM Copernicus, SRTM…) ; Wikidata (CC0) ; WRI Global Power Plant Database (CC BY 4.0). Bibliothèques : Leaflet (BSD-2), MapLibre GL, pmtiles, Protomaps basemaps, maplibre-contour (BSD-3), maplibre-gl-leaflet (ISC) ; polices Noto Sans (OFL). Détails : <code>docs/SOURCES.md</code>.</p></div>`;
  }

  /* ---------- Rendu & événements ---------- */
  const RENDER = { premium: () => Premium.render($('#tab-premium')), now: () => Now.render($('#tab-now'), S), audit: renderAudit, profile: renderProfile, home: renderHome, bag: renderBag, gear: renderGear, calc: () => Calc.render($('#tab-calc')), field: () => Field.render($('#tab-field')), plan: renderPlan, notice: renderNotice };
  let current = 'now';
  let beforeMap = 'now';
  const PAGES = {
    now: ['VOTRE SITUATION', 'Garder une longueur d’avance.', 'Votre situation, vos ressources et les bons réflexes, au même endroit.'],
    audit: ['FAIRE LE POINT', 'Votre préparation, en clair.', 'Identifiez vos ressources et les besoins à couvrir en priorité.'],
    profile: ['VOTRE POINT DE DÉPART', 'Une préparation à votre mesure.', 'Votre foyer, votre environnement, vos objectifs. Tout commence ici.'],
    bag: ['PRÊT À PARTIR', 'L’essentiel, à portée de main.', 'Préparez vos sacs et suivez leur contenu, leur poids et leur budget.'],
    home: ['VOTRE BASE', 'Construire votre autonomie.', 'Organisez vos réserves et préparez votre foyer à l’imprévu.'],
    field: ['APPRENDRE DU TERRAIN', 'Le savoir fait la différence.', 'Retours d’expérience et ressources pour mieux vous préparer.'],
    calc: ['LES BONS REPÈRES', 'Moins d’incertitude. Plus de précision.', 'Des outils pratiques pour dimensionner votre préparation.'],
    gear: ['S’ÉQUIPER AVEC MÉTHODE', 'Chaque équipement a sa place.', 'Planifiez vos achats et gardez une vue claire sur votre budget.'],
    plan: ['ANTICIPER ENSEMBLE', 'Un plan pour garder le cap.', 'Contacts, points de rendez-vous et scénarios pour votre foyer.'],
    notice: ['BIEN UTILISER HOLDOUT', 'Vos repères, pas à pas.', 'Fonctionnement, sources et limites de votre outil de préparation.'],
    premium: ['ALLER PLUS LOIN', 'Votre préparation, sans limites.', 'Découvrez les outils de personnalisation et les offres Holdout.'],
  };
  document.querySelectorAll('[data-icon]').forEach(b => {
    const slot = b.querySelector('.nav-icon');
    if (slot) slot.innerHTML = UI.icon(b.dataset.icon);
  });
  document.querySelector('[data-brand-icon]').innerHTML = '<img src="icons/logo-mark-light.png" alt="">'; // menu toujours sur fond sombre
  function renderProfile() {
    Profile.render($('#tab-profile'), S);
    if (window.Account && Account.user) { $('#tab-profile').insertAdjacentHTML('afterbegin', '<div class="card" id="accountCard"></div>'); Account.renderCard(); }
    if (!S.onboarded) $('#tab-profile').insertAdjacentHTML('afterbegin', `<div class="card welcome"><h2>Bienvenue</h2><p>Cette application se construit autour de <b>vous</b> : votre foyer, votre logement, votre environnement. Remplissez ce profil (2 minutes), puis consultez votre <b>état des lieux matériel</b>, préparez votre <b>carte hors ligne</b> et gardez l'onglet <b>Instant T</b> pour le moment où ça arrive.</p><button class="btn" data-act="onboarded">C'est fait : voir mon état des lieux</button></div>`);
  }
  function show(tab) {
    if (!RENDER[tab] && tab !== 'map') return;
    if (tab === 'map' && current !== 'map') beforeMap = current;
    current = tab;
    document.body.classList.toggle('map-mode', tab === 'map');
    $('#pageIntro').hidden = tab === 'now' || tab === 'map';
    document.querySelectorAll('#tabs button, #bottombar button[data-tab]').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const page = PAGES[tab];
    if (page) {
      $('#currentPage').textContent = $('#tabs [data-tab="' + tab + '"] > span:nth-child(2)').textContent;
      $('#pageEyebrow').textContent = page[0]; $('#pageTitle').textContent = page[1]; $('#pageDescription').textContent = page[2];
    }
    document.title = (tab === 'map' ? 'Carte terrain' : $('#currentPage').textContent) + ' · Holdout';
    const more = document.querySelector('#bottombar [data-more]'); if (more) more.classList.toggle('on', !['now', 'audit', 'map', 'profile'].includes(tab));
    window.scrollTo(0, 0);
    document.querySelectorAll('.tab').forEach(s => { const selected = s.id === 'tab-' + tab; s.classList.toggle('on', selected); s.hidden = !selected; });
    if (tab === 'map') { SurvivalMap.show(); $('#mapBack').focus(); } else RENDER[tab]();
    if (tab !== 'map') $('#main').focus({ preventScroll: true });
    try { localStorage.setItem('survie.tab', tab); } catch (e) { }
  }
  function commit() { App.save(); if (RENDER[current]) UI.preserveFocus($('#tab-' + current), RENDER[current]); }
  App.go = show;
  function mapOptions(open, restoreFocus = true) {
    $('#mapDrawer').hidden = !open;
    $('#mapPanelToggle').setAttribute('aria-expanded', String(open));
    $('#tab-map').classList.toggle('options-open', open);
    if (open) $('#mapPanelClose').focus(); else if (restoreFocus) $('#mapPanelToggle').focus();
  }
  $('#mapPanelToggle').onclick = () => mapOptions($('#mapDrawer').hidden);
  $('#mapPanelClose').onclick = () => mapOptions(false);
  $('#mapBack').onclick = () => { mapOptions(false, false); show(beforeMap); };
  $('#mapLocate').onclick = () => $('#btnLocate').click();
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || document.querySelector('.modal-wrap')) return;
    const sheet = document.querySelector('.sheet-wrap');
    if (sheet) { closeMoreSheet(); return; }
    if (current === 'map') { if (!$('#mapDrawer').hidden) mapOptions(false); else $('#mapBack').click(); }
  });
  App.rescaleHome = rescaleHome;
  let closeMoreSheet = () => {};
  function moreSheet() {
    if (document.querySelector('.sheet-wrap')) return;
    const items = [['bag', '🎒', 'Sacs'], ['home', '🏠', 'Stock maison'], ['field', '📚', 'Terrain'], ['calc', '🧮', 'Calculateurs'], ['gear', '🛒', 'Matériel & budget'], ['plan', '👪', 'Plan & scénarios'], ['notice', 'ℹ️', 'Notice'], ['premium', '★', 'Premium']];
    const w = document.createElement('div'); w.className = 'sheet-wrap';
    w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Tous les outils"><div class="sheet-heading"><h2>Tous vos outils</h2><button class="map-control icon-only" data-sheet-close aria-label="Fermer le menu">${UI.icon('close')}</button></div>${items.map(([t, i, n]) => `<button data-tab="${t}">${UI.icon(t)}<span>${n}</span></button>`).join('')}</div>`;
    document.body.appendChild(w);
    closeMoreSheet = UI.dialogSession(w);
    w.addEventListener('click', e => { if (e.target === w) closeMoreSheet(); });
    w.querySelector('[data-sheet-close]').onclick = closeMoreSheet;
    w.querySelector('button').focus();
  }
  App.refresh = () => { applyTheme(); badge(); if (RENDER[current]) UI.preserveFocus($('#tab-' + current), RENDER[current]); };
  function badge() { const b = $('#planBadge'); if (b) { b.textContent = Premium.isPremium() ? (Premium.state.lic && Premium.state.lic.plan === 'admin' ? '★ Admin' : '★ Premium') : 'Gratuit'; b.className = 'planbadge ' + (Premium.isPremium() ? 'pro' : ''); } }
  function toCsv(rows) { return '﻿' + rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\n'); }
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const theme = S.theme === 'light' || S.theme === 'dark' ? S.theme : (systemTheme.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = getComputedStyle(document.documentElement).getPropertyValue('--nav').trim();
  }
  systemTheme.addEventListener('change', () => { if (!S.theme) applyTheme(); });

  document.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (d.aud) { S.audit[d.aud] = Object.assign(S.audit[d.aud] || {}, { have: t.checked }); return commit(); }
    if (d.audq) { S.audit[d.audq] = Object.assign(S.audit[d.audq] || {}, { have: +t.value }); return commit(); }
    if (d.check) { if (t.checked) S.checks[d.check] = true; else delete S.checks[d.check]; return commit(); }
    if (d.invqty) { const it = S.inventory.find(x => x.id === d.invqty); it.qty = +t.value; return commit(); }
    if (d.bagname) { S.bags.find(b => b.id === d.bagname).name = t.value; return commit(); }
    if (d.bagadd) { const g = GEAR_BY_ID[t.value]; if (g) { const b = S.bags.find(x => x.id === d.bagadd); b.items.push(lineFromGear(g, bagTier(b))); } return commit(); }
    if (d.bh) { const [b, k] = d.bh.split('|'); S.bags.find(x => x.id === b).items.find(x => x.key === k).have = t.checked; return commit(); }
    if (d.bf) { const [b, k, f] = d.bf.split('|'), it = S.bags.find(x => x.id === b).items.find(x => x.key === k); it[f] = +t.value; if (f === 'qty') it.auto = false; else it.fixed = true; return commit(); }
    if (d.bagtype) { const b = S.bags.find(x => x.id === d.bagtype); b.type = t.value; const T = Bags.TYPES[b.type]; if (!T.durations.includes(+b.days)) b.days = T.def; Bags.rescale(b, +S.profile.kcal || 2100, GEAR_BY_ID, uid); return commit(); }
    if (d.bagtier) { const b = S.bags.find(x => x.id === d.bagtier); b.tier = Shop.tierOf(t.value); retier(b.items, b.tier); return commit(); }
    if (d.gtier !== undefined) { S.profile.tier = Shop.tierOf(t.value); retier(S.homePlan, S.profile.tier); return commit(); }
    if (d.bagdays) { const b = S.bags.find(x => x.id === d.bagdays); b.days = +t.value; Bags.rescale(b, +S.profile.kcal || 2100, GEAR_BY_ID, uid); return commit(); }
    if (d.homedays) { S.profile.days = +t.value; rescaleHome(); return commit(); }
    if (d.hh) { S.homePlan.find(x => x.key === d.hh).have = t.checked; return commit(); }
    if (d.hq) { const it = S.homePlan.find(x => x.key === d.hq); it.qty = +t.value; it.auto = false; return commit(); }
    if (d.note) { S.notes[d.note] = t.value; return App.save(); }
    if (d.act === 'theme') { S.theme = t.value || null; applyTheme(); return App.save(); }
    if (d.act === 'import' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => { try { const o = JSON.parse(r.result); if (!o.profile) throw 0; UI.confirm('Remplacer toutes les données actuelles par cette sauvegarde ?', 'Remplacer').then(ok => { if (ok) { Store.save(o); location.reload(); } }); } catch (err) { UI.notice('Fichier de sauvegarde invalide.'); } };
      r.readAsText(t.files[0]);
    }
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('button, [data-tab], [data-go]'); if (!t) return;
    const d = t.dataset;
    if (d.more !== undefined) return moreSheet();
    if (d.tab) { const sh = document.querySelector('.sheet-wrap'); if (sh) closeMoreSheet(); return show(d.tab); }
    if (d.go) { e.preventDefault(); return show(d.go); }
    if (d.audreset) { if (S.audit[d.audreset]) delete S.audit[d.audreset].have; return commit(); }
    if (d.audna) { S.audit[d.audna] = Object.assign(S.audit[d.audna] || {}, { na: !(S.audit[d.audna] || {}).na }); return commit(); }
    if ((d.quick) && S.inventory.length >= Premium.LIMITS.inventory && !Premium.gate(`La version gratuite limite l'inventaire à ${Premium.LIMITS.inventory} articles.`)) return;
    if (d.quick) { S.inventory.push({ id: uid(), name: d.quick === '9' ? 'Pack eau 6 × 1,5 L' : d.quick === '5' ? 'Bidon eau 5 L' : 'Jerrican eau 20 L', cat: 'eau', qty: 1, litres: +d.quick, kcal: 0, expiry: '', where: '' }); return commit(); }
    if (d.invdel) { S.inventory = S.inventory.filter(x => x.id !== d.invdel); return commit(); }
    if ((d.env || d.envadd || d.envaddall) && !Premium.gate('Les variantes du sac selon le lieu et le climat font partie de Premium.')) return;
    if (d.env) { const [bid, eid] = d.env.split('|'), b = S.bags.find(x => x.id === bid); b.env = b.env || []; b.env = b.env.includes(eid) ? b.env.filter(x => x !== eid) : [...b.env, eid]; return commit(); }
    if (d.envadd) { const [bid, k] = d.envadd.split('|'); const b = S.bags.find(x => x.id === bid); b.items.push(envLine(k, bagTier(b))); return commit(); }
    if (d.envaddall) { const b = S.bags.find(x => x.id === d.envaddall), have = new Set(b.items.map(i => i.envKey)); (b.env || []).forEach(id => (ENV_BY_ID[id].add || []).forEach((a, i) => { const k = id + ':' + i; if (a.priority === 'essentiel' && !have.has(k)) b.items.push(envLine(k, bagTier(b))); })); return commit(); }
    if (d.bagdel) { UI.confirm('Supprimer ce sac et sa liste ?', 'Supprimer').then(ok => { if (ok) { S.bags = S.bags.filter(b => b.id !== d.bagdel); commit(); } }); return; }
    if (d.bagprefill) { Bags.prefill(S.bags.find(x => x.id === d.bagprefill), GEAR_BY_ID, +S.profile.kcal || 2100, uid); return commit(); }
    if (d.bagessential) { const b = S.bags.find(x => x.id === d.bagessential), have = new Set(b.items.map(i => i.gearId)); GEAR.filter(g => g.scope !== 'maison' && g.priority === 'essentiel' && !have.has(g.id)).forEach(g => b.items.push(lineFromGear(g, bagTier(b)))); return commit(); }
    if (d.bagcustom) { UI.ask('Objet personnalisé', [{ name: 'n', label: 'Nom de l\'objet', required: true }], 'Ajouter').then(o => { const n = o && o.n; if (n) { S.bags.find(x => x.id === d.bagcustom).items.push({ key: uid(), name: n, category: 'Personnel', qty: 1, weight_g: 0, price: 0, have: false }); commit(); } }); return; }
    if (d.bdel) { const [b, k] = d.bdel.split('|'); const bag = S.bags.find(x => x.id === b); bag.items = bag.items.filter(x => x.key !== k); return commit(); }
    if (d.tobag) { const bag = S.bags.find(b => b.id === $('#gbag').value) || S.bags[0]; bag.items.push(lineFromGear(GEAR_BY_ID[d.tobag], bagTier(bag))); t.textContent = '✓ ajouté'; App.save(); return setTimeout(renderGear, 600); }
    if (d.tohome) { const g = GEAR_BY_ID[d.tohome], l = lineFromGear(g, S.profile.tier); S.homePlan.push(l); t.textContent = '✓ ajouté'; App.save(); return setTimeout(renderGear, 600); }
    if (d.hdel) { S.homePlan = S.homePlan.filter(x => x.key !== d.hdel); return commit(); }
    if (d.ctdel) { S.contacts = S.contacts.filter(x => x.id !== d.ctdel); return commit(); }
    switch (d.act) {
      case 'bagnew': if (S.bags.length >= Premium.LIMITS.bags && !Premium.gate('La version gratuite comprend un sac. Premium permet un sac par personne.')) return;
        { const ty = d.type || 'evac', T = Bags.TYPES[ty], K = +S.profile.kcal || 2100, est = Bags.estimate(ty, T.def, GEAR_BY_ID, K);
          UI.choose('Quel budget pour ce ' + T.name.toLowerCase() + ' ?', `Pour chaque objet, l'app propose un modèle selon votre budget, avec son lien Amazon. Estimation pour un sac pré-rempli de ${Bags.dLabel(T.def)} (1 personne, prix indicatifs) ; vous pourrez changer de budget, retirer ce que vous avez déjà ou modifier chaque ligne.`,
            Shop.TIERS.map(t => ({ id: t.id, title: t.short + ' ' + t.label, sub: '≈ ' + eur(est[t.id].cost), detail: t.hint })), Shop.tierOf(S.profile.tier)).then(tier => {
            if (!tier) return;
            const nb = { id: uid(), type: ty, days: T.def, tier, name: T.name + ' ' + (S.bags.filter(x => (x.type || 'evac') === ty).length + 1), owner: '', items: [], env: [...(S.profile.lieu || []), ...(S.profile.climat || [])] };
            Bags.prefill(nb, GEAR_BY_ID, K, uid); S.bags.push(nb); commit();
          }); } return;
      case 'onboarded': S.onboarded = true; App.save(); return show('audit');
      case 'audcsv': if (!Premium.gate('La liste de courses personnalisée fait partie de Premium.')) return;
        return App.download('etat-des-lieux-manques.csv', Needs.gapsCsv(S), 'text/csv');
      case 'homeessential': { const have = new Set(S.homePlan.map(i => i.gearId)); GEAR.filter(g => g.scope !== 'sac' && g.priority === 'essentiel' && !have.has(g.id)).forEach(g => { const l = lineFromGear(g, S.profile.tier); if (Bags.HOME_RULES[g.id]) l.auto = true; S.homePlan.push(l); }); rescaleHome(); return commit(); }
      case 'checked': S.lastCheck = today(); return commit();
      case 'export': return App.download(`holdout-sauvegarde-${today()}.json`, JSON.stringify(S, null, 1), 'application/json');
      case 'reset': UI.confirm('Effacer toutes vos données locales ? Les cartes téléchargées restent en cache.', 'Tout effacer').then(ok => { if (ok) { try { localStorage.removeItem('survie.v1'); } catch (e) { } location.reload(); } }); return;
      case 'invcsv': return App.download('inventaire.csv', toCsv([['Article', 'Catégorie', 'Quantité', 'Litres/unité', 'kcal/unité', 'Péremption', 'Emplacement'], ...S.inventory.map(i => [i.name, CAT_LABEL[i.cat], i.qty, i.litres, i.kcal, i.expiry, i.where])]), 'text/csv');
      case 'plancsv': return App.download('plan-achat.csv', toCsv([['Emplacement', 'Objet', 'Catégorie', 'Quantité', 'Prix unitaire', 'Total', 'Acquis', 'Lien Amazon'], ...planLines().map(l => { const k = shopKey(l), o = k && Shop.offer(k, l.tier || S.profile.tier); return [l.where, l.name, l.category, l.qty, l.price, (l.qty || 1) * (l.price || 0), l.have ? 'oui' : 'non', o && !o.none ? o.url : '']; })]), 'text/csv');
      case 'catcsv': return App.download('catalogue-materiel.csv', toCsv([['Catégorie', 'Objet', 'Qté', 'Priorité', 'Usage', 'Conseil', ...Shop.TIERS.flatMap(t => [t.label + ' : modèle', t.label + ' : prix indicatif (€)', t.label + ' : lien Amazon'])],
        ...GEAR.map(g => [g.category, g.name, g.qty, g.priority, g.scope, g.tip, ...Shop.TIERS.flatMap(t => { const o = Shop.offer(g.id, t.id); return !o ? ['', g.price_eur, ''] : o.none ? [o.none, '', ''] : [o.model, o.price, o.url]; })])]), 'text/csv');
    }
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), o = Object.fromEntries(f.entries());
    if (e.target.id === 'invForm' && S.inventory.length >= Premium.LIMITS.inventory && !Premium.gate(`La version gratuite limite l'inventaire à ${Premium.LIMITS.inventory} articles.`)) return;
    if (e.target.id === 'invForm') S.inventory.push({ id: uid(), name: o.name, cat: o.cat, qty: +o.qty || 0, litres: +o.litres || 0, kcal: +o.kcal || 0, expiry: o.expiry, where: o.where });
    if (e.target.id === 'ctForm') S.contacts.push({ id: uid(), name: o.name, phone: o.phone, role: o.role });
    commit();
  });

  function net() { $('#netState').textContent = navigator.onLine ? 'En ligne · données locales' : 'Hors ligne · données locales'; document.body.classList.toggle('is-offline', !navigator.onLine); }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();
  applyTheme();
  Profile.bind($('#tab-profile'), S, commit);
  Now.bind($('#tab-now'), S, () => RENDER.now());
  let startTab = 'now'; try { startTab = localStorage.getItem('survie.tab') || 'now'; } catch (e) { }
  if (!S.onboarded) startTab = 'profile';
  show(RENDER[startTab] || startTab === 'map' ? startTab : 'now');
  Premium.load().then(() => App.refresh());
  if (window.Account) Account.init();
  Shop.refresh().then(ok => { if (ok) App.refresh(); }); // prix Amazon officiels, si l'API est activée (js/config.js)
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
})();
