/* Kit Survie Europe — logique de l'application (vanilla JS, aucun serveur requis). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const kg = g => ((+g || 0) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' kg';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const today = () => new Date().toISOString().slice(0, 10);
  const GEAR = window.GEAR || [];
  const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
  const linkify = t => h(t).replace(/https?:\/\/[^\s<)]+[^\s<).,;]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>`);
  const srcLinks = keys => (keys || []).map(k => SOURCES[k] ? `<a href="${SOURCES[k].u}" target="_blank" rel="noopener">${h(SOURCES[k].t.split(' — ')[0])}</a>` : '').join(' · ');

  const DEFAULT = {
    profile: { adults: 2, children: 0, pets: 0, days: 10, waterL: 2, kcal: 2200, budget: 1000 },
    checks: {}, inventory: [], bags: [], homePlan: [], contacts: [], notes: { rdv: '', pims: '', famille: '' }, lastCheck: null, points: [], map: {},
  };
  const App = window.App = {
    state: Object.assign(structuredClone(DEFAULT), Store.load()),
    save() { Store.save(this.state); },
    download(name, content, mime) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: mime || 'text/plain' }));
      a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
  };
  const S = App.state;
  for (const k in DEFAULT) if (S[k] == null) S[k] = structuredClone(DEFAULT[k]);
  if (!S.bags.length) S.bags.push({ id: uid(), name: 'Sac adulte 1', owner: '', items: [] });

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

  /* ---------- Tableau de bord ---------- */
  function renderDash() {
    const n = needs(), s = stock(), P = S.profile, b = budget();
    const wp = n.water ? s.water / n.water * 100 : 0, kp = n.kcal ? s.kcal / n.kcal * 100 : 0;
    const daysW = persons() && P.waterL ? s.water / (persons() * P.waterL) : 0, daysK = persons() && P.kcal ? s.kcal / (persons() * P.kcal) : 0;
    const pil = PILLARS.map(p => [p, pillarScore(p)]), pilAvg = Math.round(pil.reduce((a, [, x]) => a + x.pct, 0) / pil.length);
    const exp = expiring(), nc = nextCheck();
    const alerts = [];
    if (s.water < n.water72) alerts.push(['bad', `Eau : moins que le minimum 72 h du guide SGDSN (6 L × ${persons()} pers. = ${n.water72} L). Stock actuel : ${s.water.toFixed(1)} L.`]);
    exp.forEach(it => alerts.push([new Date(it.expiry) < new Date() ? 'bad' : '', `Péremption ${new Date(it.expiry) < new Date() ? 'dépassée' : 'proche'} : ${h(it.name)} (${it.expiry})`]));
    if (!nc) alerts.push(['', 'Aucune vérification du kit enregistrée. Le guide SGDSN recommande de vérifier dates, piles et médicaments deux fois par an (onglet Plan).']);
    else if (nc < new Date()) alerts.push(['bad', `Vérification semestrielle du kit en retard (prévue le ${nc.toLocaleDateString('fr-FR')}).`]);
    $('#tab-dash').innerHTML = `
    <div class="card">
      <h2>Mon foyer</h2>
      <div class="row" data-form="profile">
        <label>Adultes <input type="number" min="0" data-p="adults" value="${P.adults}"></label>
        <label>Enfants <input type="number" min="0" data-p="children" value="${P.children}"></label>
        <label>Animaux <input type="number" min="0" data-p="pets" value="${P.pets}"></label>
        <label>Objectif d'autonomie <select data-p="days">${[3, 7, 10, 14, 30, 60, 90].map(d => `<option value="${d}" ${+P.days === d ? 'selected' : ''}>${d} jours${d === 3 ? ' (UE/FR : 72 h min.)' : d === 7 ? ' (Suède, Suisse)' : d === 10 ? ' (Allemagne)' : ''}</option>`).join('')}</select></label>
        <label>Eau de boisson <select data-p="waterL">${[[2, '2 L/pers/j (BBK, Finlande)'], [3, '3 L/pers/j (Suède, Suisse)'], [4, '≈ 3,8 L/pers/j (Ready.gov, boisson + hygiène)'], [7.5, '7,5 L/pers/j (OMS, bas de fourchette)'], [15, '15 L/pers/j (OMS, haut de fourchette)']].map(([v, t]) => `<option value="${v}" ${+P.waterL === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>kcal/pers/jour <input type="number" min="0" step="100" data-p="kcal" value="${P.kcal}"></label>
        <label>Budget cible (€) <input type="number" min="0" step="50" data-p="budget" value="${P.budget}"></label>
      </div>
      <p class="src">Repères : ${srcLinks(['ue', 'sgdsn', 'bbk', 'msb', 'bwl', 'oms'])}. 2 200 kcal/j = référence du calculateur BLE cité par le BBK ; adaptez pour les enfants.</p>
    </div>
    <div class="grid">
      <div class="card"><div class="muted small">Eau stockée</div><div class="kpi">${s.water.toFixed(0)} L <small>/ ${n.water.toFixed(0)} L visés</small></div>${bar(wp, wp < 50 ? 'bad' : wp < 100 ? 'warn' : '')}<div class="small">≈ ${daysW.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} jours de boisson pour ${persons()} pers.</div></div>
      <div class="card"><div class="muted small">Nourriture stockée</div><div class="kpi">${Math.round(s.kcal).toLocaleString('fr-FR')} <small>kcal / ${n.kcal.toLocaleString('fr-FR')}</small></div>${bar(kp, kp < 50 ? 'bad' : kp < 100 ? 'warn' : '')}<div class="small">≈ ${daysK.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} jours</div></div>
      <div class="card"><div class="muted small">Écosystème (9 piliers)</div><div class="kpi">${pilAvg} %</div>${bar(pilAvg)}<div class="small">${pil.map(([p, x]) => `<span class="chip">${p.icon} ${x.c}/${x.n}</span>`).join('')}</div></div>
      <div class="card"><div class="muted small">Sacs d'évacuation</div>${S.bags.map(bg => { const t = bagTotals(bg); return `<div><b>${h(bg.name)}</b> — ${t.have}/${t.n} objets, ${kg(t.w)}</div>${bar(t.n ? t.have / t.n * 100 : 0)}`; }).join('')}</div>
      <div class="card"><div class="muted small">Budget du plan</div><div class="kpi">${eur(b.total)} <small>prévus</small></div>${bar(P.budget ? b.total / P.budget * 100 : 0, b.total > P.budget ? 'bad' : '')}<div class="small">Acquis : ${eur(b.spent)} · Reste à acheter : ${eur(b.left)} · Budget cible : ${eur(P.budget)}</div></div>
      <div class="card"><div class="muted small">Prochaine vérification</div><div class="kpi">${nc ? nc.toLocaleDateString('fr-FR') : '—'}</div><div class="small">Rythme : 2 fois par an (SGDSN)</div></div>
    </div>
    <div class="card"><h3>Alertes</h3>${alerts.length ? alerts.map(([c, t]) => `<div class="alert ${c}">${t}</div>`).join('') : '<p>Aucune alerte. 👍</p>'}</div>`;
  }

  /* ---------- Écosystème maison ---------- */
  const INV_CATS = ['eau', 'nourriture', 'energie', 'sante', 'hygiene', 'comm', 'docs', 'securite', 'autre'];
  const CAT_LABEL = { eau: 'Eau', nourriture: 'Nourriture', energie: 'Énergie/chaleur/lumière', sante: 'Santé', hygiene: 'Hygiène', comm: 'Communication', docs: 'Documents/argent', securite: 'Sécurité/outils', autre: 'Autre' };
  function renderHome() {
    const n = needs(), s = stock(), P = S.profile;
    const inv = [...S.inventory].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
    $('#tab-home').innerHTML = `
    <div class="card">
      <h2>Besoins calculés — ${persons()} personne(s), ${P.days} jours</h2>
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
        <input name="name" placeholder="Article (ex. Pack eau 6×1,5 L)" required style="flex:1 1 220px">
        <select name="cat">${INV_CATS.map(c => `<option value="${c}">${CAT_LABEL[c]}</option>`).join('')}</select>
        <label>Qté <input name="qty" type="number" min="0" step="any" value="1"></label>
        <label>L/unité <input name="litres" type="number" min="0" step="any" placeholder="0"></label>
        <label>kcal/unité <input name="kcal" type="number" min="0" step="any" placeholder="0"></label>
        <label>Péremption <input name="expiry" type="date"></label>
        <input name="where" placeholder="Emplacement" style="width:9em">
        <button class="btn">Ajouter</button>
      </form>
      <div class="row small">Raccourcis eau : <button class="link" data-quick="9">Pack 6 × 1,5 L (9 L)</button> <button class="link" data-quick="5">Bidon 5 L</button> <button class="link" data-quick="20">Jerrican 20 L</button></div>
      <div class="tablewrap"><table>
        <tr><th>Article</th><th>Catégorie</th><th class="num">Qté</th><th class="num">Eau</th><th class="num">kcal</th><th>Péremption</th><th class="hide-sm">Emplacement</th><th></th></tr>
        ${inv.map(it => { const late = it.expiry && new Date(it.expiry) < new Date(), soon = it.expiry && !late && new Date(it.expiry) < Date.now() + 60 * 864e5; return `<tr>
          <td>${h(it.name)}</td><td>${h(CAT_LABEL[it.cat] || it.cat)}</td>
          <td class="num"><input type="number" min="0" step="any" value="${it.qty}" data-invqty="${it.id}" style="width:5em"></td>
          <td class="num">${it.litres ? (it.qty * it.litres).toFixed(1) + ' L' : ''}</td><td class="num">${it.kcal ? Math.round(it.qty * it.kcal).toLocaleString('fr-FR') : ''}</td>
          <td class="${late ? 'danger' : soon ? '' : ''}">${it.expiry ? (late ? '⚠ ' : soon ? '⏳ ' : '') + it.expiry : ''}</td><td class="hide-sm">${h(it.where || '')}</td>
          <td><button class="link danger" data-invdel="${it.id}">suppr.</button></td></tr>`; }).join('') || '<tr><td colspan="8" class="muted">Inventaire vide.</td></tr>'}
      </table></div>
      <button class="btn ghost" data-act="invcsv">Exporter l'inventaire (CSV)</button>
    </div>
    <h2>Les 9 piliers de l'écosystème</h2>
    <div class="grid">${PILLARS.map(p => { const x = pillarScore(p); return `<div class="card">
      <h3>${p.icon} ${h(p.name)} <span class="chip">${x.c}/${x.n}</span></h3>${bar(x.pct)}
      <p class="small">${h(p.why)}</p>
      <ul class="check">${p.items.map((t, i) => `<li><label><input type="checkbox" data-check="${p.id}:${i}" ${S.checks[p.id + ':' + i] ? 'checked' : ''}> <span>${h(t)}</span></label></li>`).join('')}</ul>
      <p class="src">Sources : ${srcLinks(p.src)}</p></div>`; }).join('')}</div>`;
  }

  /* ---------- Sac d'évacuation ---------- */
  function gearOptions(scopeFilter) {
    const cats = {};
    GEAR.filter(g => !scopeFilter || g.scope !== 'maison').forEach(g => (cats[g.category] = cats[g.category] || []).push(g));
    return Object.entries(cats).map(([c, list]) => `<optgroup label="${h(c)}">${list.map(g => `<option value="${g.id}">${h(g.name)}${g.price_eur ? ' — ' + eur(g.price_eur) : ''}</option>`).join('')}</optgroup>`).join('');
  }
  function lineFromGear(g) { return { key: uid(), gearId: g.id, name: g.name + (g.model ? ' — ' + g.model : ''), category: g.category, qty: g.qty || 1, weight_g: g.weight_g || 0, price: g.price_eur || 0, have: false }; }
  function renderBag() {
    $('#tab-bag').innerHTML = `
    <div class="card">
      <h2>Sacs d'évacuation (72 h)</h2>
      <p class="small">Un sac par personne, prêt à partir. Le guide SGDSN demande de le ranger dans un endroit facile d'accès et de le vérifier deux fois par an. Le poids n'a pas de norme officielle : testez le sac chargé sur une marche de plusieurs kilomètres.</p>
      <button class="btn" data-act="bagnew">+ Nouveau sac</button>
    </div>
    ${S.bags.map(b => { const t = bagTotals(b); return `<div class="card" data-bag="${b.id}">
      <div class="row"><input value="${h(b.name)}" data-bagname="${b.id}" style="font-weight:600;flex:1 1 200px"> <button class="link danger" data-bagdel="${b.id}">supprimer le sac</button></div>
      <div class="row small"><span class="chip">${t.have}/${t.n} objets prêts</span><span class="chip">Poids : ${kg(t.w)}</span><span class="chip">Coût total : ${eur(t.cost)}</span><span class="chip">Reste à acheter : ${eur(t.left)}</span></div>
      <div class="row"><select data-bagadd="${b.id}" style="flex:1 1 260px"><option value="">+ Ajouter depuis le catalogue…</option>${gearOptions(true)}</select>
        <button class="btn ghost" data-bagessential="${b.id}">Pré-remplir : essentiels</button>
        <button class="btn ghost" data-bagcustom="${b.id}">+ Objet personnalisé</button></div>
      <div class="tablewrap"><table><tr><th>✓</th><th>Objet</th><th class="num">Qté</th><th class="num">Poids u. (g)</th><th class="num">Prix u. (€)</th><th></th></tr>
      ${b.items.map(it => `<tr><td><input type="checkbox" data-bh="${b.id}|${it.key}" ${it.have ? 'checked' : ''}></td><td>${h(it.name)}<div class="small muted">${h(it.category || '')}</div></td>
        <td class="num"><input type="number" min="0" value="${it.qty}" data-bf="${b.id}|${it.key}|qty" style="width:4em"></td>
        <td class="num"><input type="number" min="0" value="${it.weight_g || 0}" data-bf="${b.id}|${it.key}|weight_g" style="width:5.5em"></td>
        <td class="num"><input type="number" min="0" step="0.01" value="${it.price || 0}" data-bf="${b.id}|${it.key}|price" style="width:6em"></td>
        <td><button class="link danger" data-bdel="${b.id}|${it.key}">✕</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Sac vide : utilisez « Pré-remplir : essentiels » ou le catalogue.</td></tr>'}
      </table></div></div>`; }).join('')}
    <div class="card"><h3>Listes de référence officielles</h3>
      <p><b>Kit 72 h — guide SGDSN (France)</b> : 6 L d'eau/personne en bouteilles, pastilles de désinfection (dernier recours), nourriture non périssable sans cuisson, médicaments habituels, lunettes de secours, gel, masques, pansements, couteau multifonction, ouvre-boîte, réchaud, radio à piles, batterie externe, piles, chargeur, savon, lampe, bougies, allumettes, briquet, vêtements chauds, couverture de survie, doubles des clés, photocopies des papiers (pochette étanche), argent liquide, jeux/livres.</p>
      <p><b>Sac d'évacuation — BBK (Allemagne)</b> : vêtements chauds, protection pluie, chaussures solides, rechange, premiers secours, médicaments, powerbank, hygiène, nourriture longue conservation, gourde, dossier documents, sac de couchage ou couverture, couverts, couteau, ouvre-boîte, lampe, radio, briquet, crème solaire, couvre-chef, bloc-notes et stylo, gants de travail, lunettes de rechange, argent liquide.</p>
      <p><b>Évacuation — MSB (Suède)</b> : ajoute carte et boussole, informations importantes sur papier.</p>
      <p class="src">Sources : ${srcLinks(['sgdsn', 'bbk', 'msb'])}</p></div>`;
  }

  /* ---------- Matériel & budget ---------- */
  let gf = { q: '', cat: '', scope: '', prio: '' };
  function tierTotals(scope) {
    const r = { essentiel: 0, recommandé: 0, optionnel: 0 };
    GEAR.filter(g => scope === 'sac' ? g.scope !== 'maison' : g.scope !== 'sac').forEach(g => { if (r[g.priority] != null) r[g.priority] += (g.price_eur || 0) * (g.qty || 1); });
    return r;
  }
  function renderGear() {
    const cats = [...new Set(GEAR.map(g => g.category))];
    const list = GEAR.filter(g => (!gf.cat || g.category === gf.cat) && (!gf.scope || g.scope === gf.scope || g.scope === 'les deux') && (!gf.prio || g.priority === gf.prio) && (!gf.q || (g.name + ' ' + (g.model || '') + ' ' + (g.note || '')).toLowerCase().includes(gf.q.toLowerCase())));
    const ts = tierTotals('sac'), tm = tierTotals('maison'), b = budget();
    const est = GEAR.filter(g => g.price_status !== 'relevé').length;
    $('#tab-gear').innerHTML = `
    <div class="card"><h2>Récapitulatif budgétaire</h2>
      <p class="small muted">Prix indicatifs relevés ou estimés le ${h((GEAR[0] || {}).source_date || '—')} (1 exemplaire × quantité suggérée). ${est} prix sur ${GEAR.length} sont des estimations. Les prix varient : vérifiez avant achat.</p>
      <div class="tablewrap"><table><tr><th>Palier (catalogue)</th><th class="num">Sac d'évacuation (1 pers.)</th><th class="num">Écosystème maison</th><th class="num">Cumul</th></tr>
      <tr><td><span class="chip essentiel">essentiel</span></td><td class="num">${eur(ts.essentiel)}</td><td class="num">${eur(tm.essentiel)}</td><td class="num">${eur(ts.essentiel + tm.essentiel)}</td></tr>
      <tr><td>+ <span class="chip recommandé">recommandé</span></td><td class="num">${eur(ts.essentiel + ts.recommandé)}</td><td class="num">${eur(tm.essentiel + tm.recommandé)}</td><td class="num">${eur(ts.essentiel + ts.recommandé + tm.essentiel + tm.recommandé)}</td></tr>
      <tr><td>+ <span class="chip optionnel">optionnel</span> (tout)</td><td class="num">${eur(ts.essentiel + ts.recommandé + ts.optionnel)}</td><td class="num">${eur(tm.essentiel + tm.recommandé + tm.optionnel)}</td><td class="num">${eur(Object.values(ts).reduce((a, x) => a + x, 0) + Object.values(tm).reduce((a, x) => a + x, 0))}</td></tr></table></div>
      <p class="small">Les objets classés « les deux » sont comptés dans chaque colonne (un exemplaire pour le sac, un pour la maison). Le coût du sac est à multiplier par le nombre de personnes (${persons()}), en mutualisant ce qui peut l'être (réchaud, filtre, radio…).</p>
      <h3>Mon plan d'achat (sacs + maison)</h3>
      <div class="row"><span class="kpi">${eur(b.total)}</span><span>prévus · acquis ${eur(b.spent)} · reste ${eur(b.left)} · budget cible ${eur(S.profile.budget)}</span></div>
      ${bar(S.profile.budget ? b.total / S.profile.budget * 100 : 0, b.total > S.profile.budget ? 'bad' : '')}
      <div class="tablewrap"><table><tr><th>Catégorie</th><th class="num">Prévu</th><th class="num">Acquis</th></tr>${Object.entries(b.byCat).sort((a, c) => c[1].total - a[1].total).map(([c, v]) => `<tr><td>${h(c)}</td><td class="num">${eur(v.total)}</td><td class="num">${eur(v.spent)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Ajoutez des objets à un sac ou à la maison.</td></tr>'}</table></div>
      <h3>Achats pour la maison</h3>
      <div class="tablewrap"><table><tr><th>✓</th><th>Objet</th><th class="num">Qté</th><th class="num">Prix u.</th><th></th></tr>${S.homePlan.map(it => `<tr><td><input type="checkbox" data-hh="${it.key}" ${it.have ? 'checked' : ''}></td><td>${h(it.name)}<div class="small muted">${h(it.category)}</div></td><td class="num"><input type="number" min="0" value="${it.qty}" data-hq="${it.key}" style="width:4em"></td><td class="num">${eur(it.price)}</td><td><button class="link danger" data-hdel="${it.key}">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Rien pour l\'instant — bouton « + Maison » dans le catalogue.</td></tr>'}</table></div>
      <button class="btn ghost" data-act="homeessential">Pré-remplir maison : essentiels</button> <button class="btn ghost" data-act="plancsv">Exporter le plan (CSV)</button> <button class="btn ghost" data-act="catcsv">Exporter le catalogue (CSV)</button>
    </div>
    <div class="card"><h2>Catalogue du matériel (${GEAR.length} références)</h2>
      <div class="row">
        <input id="gq" placeholder="Rechercher…" value="${h(gf.q)}" style="flex:1 1 200px">
        <select id="gcat"><option value="">Toutes catégories</option>${cats.map(c => `<option ${gf.cat === c ? 'selected' : ''}>${h(c)}</option>`).join('')}</select>
        <select id="gscope"><option value="">Sac + maison</option><option value="sac" ${gf.scope === 'sac' ? 'selected' : ''}>Sac</option><option value="maison" ${gf.scope === 'maison' ? 'selected' : ''}>Maison</option></select>
        <select id="gprio"><option value="">Toutes priorités</option>${['essentiel', 'recommandé', 'optionnel'].map(p => `<option ${gf.prio === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <select id="gbag">${S.bags.map(b => `<option value="${b.id}">→ ${h(b.name)}</option>`).join('')}</select>
      </div>
      <div class="tablewrap"><table><tr><th>Objet</th><th>Priorité</th><th class="num">Prix</th><th class="num hide-sm">Poids</th><th>Lien</th><th></th></tr>
      ${list.map(g => `<tr><td><b>${h(g.name)}</b>${g.model ? `<div class="small">${h(g.model)}</div>` : ''}<div class="small muted">${h(g.category)} · ${h(g.scope)}${g.qty > 1 ? ' · qté suggérée ' + g.qty : ''}</div>${g.note ? `<details class="small"><summary class="muted">Détails, alternatives</summary>${linkify(g.note)}</details>` : ''}</td>
        <td><span class="chip ${h(g.priority)}">${h(g.priority)}</span></td>
        <td class="num">${g.price_eur ? eur(g.price_eur) : '—'}<div class="small muted">${g.price_status === 'relevé' ? 'relevé' : 'estimation'}</div></td>
        <td class="num hide-sm">${g.weight_g ? g.weight_g + ' g' : '—'}</td>
        <td>${g.url ? `<a href="${h(g.url)}" target="_blank" rel="noopener">${h(new URL(g.url).hostname.replace('www.', ''))}</a>` : ''}</td>
        <td style="white-space:nowrap">${g.scope !== 'maison' ? `<button class="btn ghost" data-tobag="${g.id}">+ Sac</button>` : ''} ${g.scope !== 'sac' ? `<button class="btn ghost" data-tohome="${g.id}">+ Maison</button>` : ''}</td></tr>`).join('')}
      </table></div>
      <p class="small muted">Les liens mènent vers des pages produits ou des recherches chez des revendeurs, sans affiliation. Aucune marque n'est imposée : les modèles cités sont des exemples de référence.</p>
    </div>`;
    const upd = () => { gf = { q: $('#gq').value, cat: $('#gcat').value, scope: $('#gscope').value, prio: $('#gprio').value }; const pos = $('#gq').selectionStart; renderGear(); const q = $('#gq'); q.focus(); q.setSelectionRange(pos, pos); };
    $('#gq').oninput = upd; ['gcat', 'gscope', 'gprio'].forEach(id => $('#' + id).onchange = upd);
  }

  /* ---------- Plan & scénarios ---------- */
  function renderPlan() {
    const nc = nextCheck();
    $('#tab-plan').innerHTML = `
    <div class="grid">
      <div class="card"><h2>Contacts d'urgence</h2>
        <p class="small muted">Recopiez aussi cette liste sur papier (BBK, MSB) : sans réseau ni batterie, le téléphone ne sert plus.</p>
        <form id="ctForm" class="row"><input name="name" placeholder="Nom" required><input name="phone" placeholder="Téléphone"><input name="role" placeholder="Rôle (voisin, médecin…)"><button class="btn">Ajouter</button></form>
        <table>${S.contacts.map(c => `<tr><td>${h(c.name)}</td><td>${h(c.phone)}</td><td class="small muted">${h(c.role)}</td><td><button class="link danger" data-ctdel="${c.id}">✕</button></td></tr>`).join('') || '<tr><td class="muted">Aucun contact.</td></tr>'}</table>
      </div>
      <div class="card"><h2>Vérification du kit</h2>
        <p>Dernière vérification : <b>${S.lastCheck ? new Date(S.lastCheck).toLocaleDateString('fr-FR') : 'jamais'}</b><br>Prochaine : <b>${nc ? nc.toLocaleDateString('fr-FR') : '—'}</b></p>
        <p class="small">À contrôler : dates de péremption (eau, nourriture, médicaments), piles, charge des batteries, vêtements adaptés à la saison et à la taille des enfants, papiers à jour.</p>
        <button class="btn" data-act="checked">Vérification faite aujourd'hui</button>
        <p class="src">Rythme recommandé : deux fois par an (${srcLinks(['sgdsn'])}).</p>
      </div>
    </div>
    <div class="card"><h2>Plan familial</h2>
      <label style="display:block">Points de rendez-vous (1 proche du domicile, 1 hors du quartier, 1 hors de la ville) — placez-les aussi sur la carte :</label>
      <textarea data-note="rdv">${h(S.notes.rdv)}</textarea>
      <label style="display:block">Qui fait quoi (enfants, personnes âgées ou isolées, animaux, voisins) :</label>
      <textarea data-note="famille">${h(S.notes.famille)}</textarea>
      <label style="display:block">PIMS — Plan individuel de mise en sûreté (risques de l'adresse via Géorisques, pièce refuge, coupures eau/gaz/électricité) :</label>
      <textarea data-note="pims">${h(S.notes.pims)}</textarea>
      <button class="btn ghost" onclick="window.print()">Imprimer le plan</button>
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
        <li><b>Installer hors ligne</b> : ouvrez l'application via un petit serveur local (<code>lancer.sh</code> ou <code>lancer.bat</code>) ou depuis son adresse web, puis « Installer l'application » / « Ajouter à l'écran d'accueil ». Toute l'application (relief et fond vectoriel Europe compris) est alors disponible sans connexion. Un double-clic sur <code>index.html</code> fonctionne aussi, mais sans installation.</li>
        <li><b>Tableau de bord</b> : renseignez votre foyer et votre objectif d'autonomie ; les besoins en eau et en calories sont calculés à partir des repères officiels.</li>
        <li><b>Écosystème maison</b> : saisissez votre stock (litres, kcal, péremption) et cochez les 9 piliers.</li>
        <li><b>Sac d'évacuation</b> : un sac par personne ; pré-remplissez avec les essentiels, ajustez quantités, poids et prix, cochez ce qui est acquis.</li>
        <li><b>Matériel & budget</b> : catalogue avec liens et prix indicatifs, paliers de budget, plan d'achat, export CSV.</li>
        <li><b>Carte</b> : relief Europe et fond vectoriel intégrés ; <u>avant une coupure</u>, téléchargez le relief détaillé et les points OSM (eau, santé, énergie, dangers…) de vos zones (domicile, travail, famille, itinéraires). Ajoutez vos points de rendez-vous et caches, exportez-les en GPX pour un GPS.</li>
        <li><b>Carte détaillée de toute l'Europe hors ligne</b> : téléchargez un extrait <code>.pmtiles</code> (voir <code>docs/NOTICE.md</code>, section Carte) et chargez-le depuis la carte.</li>
        <li><b>Sauvegarde</b> : exportez régulièrement vos données (bouton ci-dessous) sur une clé USB. Vider les données du navigateur efface l'application locale.</li>
        <li><b>Imprimer</b> : imprimez plan familial, contacts et listes ; le papier fonctionne sans batterie.</li>
      </ol>
    </div>
    <div class="card"><h2>Données & réglages</h2>
      <button class="btn" data-act="export">Exporter mes données (JSON)</button>
      <label class="btn ghost file">Importer une sauvegarde<input type="file" accept=".json" data-act="import" hidden></label>
      <select data-act="theme"><option value="">Thème : système</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>Clair</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Sombre</option></select>
      <button class="btn ghost danger" data-act="reset">Tout effacer</button>
    </div>
    <div class="card"><h2>Sources</h2><ul>${Object.values(SOURCES).map(s => `<li><a href="${s.u}" target="_blank" rel="noopener">${h(s.t)}</a></li>`).join('')}</ul>
      <p class="small">Cartographie : Natural Earth (domaine public) ; Terrain Tiles AWS/Mapzen (EU-DEM Copernicus, SRTM…) ; Wikidata (CC0) ; WRI Global Power Plant Database (CC BY 4.0) ; OpenStreetMap (ODbL) ; OpenTopoMap (CC-BY-SA). Bibliothèques : Leaflet (BSD-2), PMTiles & protomaps-leaflet (BSD-3). Détails : <code>docs/SOURCES.md</code>.</p></div>`;
  }

  /* ---------- Rendu & événements ---------- */
  const RENDER = { dash: renderDash, home: renderHome, bag: renderBag, gear: renderGear, plan: renderPlan, notice: renderNotice };
  let current = 'dash';
  function show(tab) {
    current = tab;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + tab));
    if (tab === 'map') SurvivalMap.show(); else RENDER[tab]();
    try { localStorage.setItem('survie.tab', tab); } catch (e) { }
  }
  function commit() { App.save(); if (RENDER[current]) RENDER[current](); }
  function toCsv(rows) { return '﻿' + rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\n'); }
  function applyTheme() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }

  document.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (d.p) { S.profile[d.p] = +t.value; return commit(); }
    if (d.check) { if (t.checked) S.checks[d.check] = true; else delete S.checks[d.check]; return commit(); }
    if (d.invqty) { const it = S.inventory.find(x => x.id === d.invqty); it.qty = +t.value; return commit(); }
    if (d.bagname) { S.bags.find(b => b.id === d.bagname).name = t.value; return commit(); }
    if (d.bagadd) { const g = GEAR_BY_ID[t.value]; if (g) S.bags.find(b => b.id === d.bagadd).items.push(lineFromGear(g)); return commit(); }
    if (d.bh) { const [b, k] = d.bh.split('|'); S.bags.find(x => x.id === b).items.find(x => x.key === k).have = t.checked; return commit(); }
    if (d.bf) { const [b, k, f] = d.bf.split('|'); S.bags.find(x => x.id === b).items.find(x => x.key === k)[f] = +t.value; return commit(); }
    if (d.hh) { S.homePlan.find(x => x.key === d.hh).have = t.checked; return commit(); }
    if (d.hq) { S.homePlan.find(x => x.key === d.hq).qty = +t.value; return commit(); }
    if (d.note) { S.notes[d.note] = t.value; return App.save(); }
    if (d.act === 'theme') { S.theme = t.value || null; applyTheme(); return App.save(); }
    if (d.act === 'import' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => { try { const o = JSON.parse(r.result); if (!o.profile) throw 0; if (confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) { Store.save(o); location.reload(); } } catch (err) { alert('Fichier de sauvegarde invalide.'); } };
      r.readAsText(t.files[0]);
    }
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('button, [data-tab]'); if (!t) return;
    const d = t.dataset;
    if (d.tab) return show(d.tab);
    if (d.quick) { S.inventory.push({ id: uid(), name: d.quick === '9' ? 'Pack eau 6 × 1,5 L' : d.quick === '5' ? 'Bidon eau 5 L' : 'Jerrican eau 20 L', cat: 'eau', qty: 1, litres: +d.quick, kcal: 0, expiry: '', where: '' }); return commit(); }
    if (d.invdel) { S.inventory = S.inventory.filter(x => x.id !== d.invdel); return commit(); }
    if (d.bagdel) { if (confirm('Supprimer ce sac ?')) { S.bags = S.bags.filter(b => b.id !== d.bagdel); commit(); } return; }
    if (d.bagessential) { const b = S.bags.find(x => x.id === d.bagessential), have = new Set(b.items.map(i => i.gearId)); GEAR.filter(g => g.scope !== 'maison' && g.priority === 'essentiel' && !have.has(g.id)).forEach(g => b.items.push(lineFromGear(g))); return commit(); }
    if (d.bagcustom) { const n = prompt('Nom de l\'objet :'); if (n) { S.bags.find(x => x.id === d.bagcustom).items.push({ key: uid(), name: n, category: 'Personnel', qty: 1, weight_g: 0, price: 0, have: false }); commit(); } return; }
    if (d.bdel) { const [b, k] = d.bdel.split('|'); const bag = S.bags.find(x => x.id === b); bag.items = bag.items.filter(x => x.key !== k); return commit(); }
    if (d.tobag) { const bag = S.bags.find(b => b.id === $('#gbag').value) || S.bags[0]; bag.items.push(lineFromGear(GEAR_BY_ID[d.tobag])); t.textContent = '✓ ajouté'; App.save(); return setTimeout(renderGear, 600); }
    if (d.tohome) { const g = GEAR_BY_ID[d.tohome], l = lineFromGear(g); S.homePlan.push(l); t.textContent = '✓ ajouté'; App.save(); return setTimeout(renderGear, 600); }
    if (d.hdel) { S.homePlan = S.homePlan.filter(x => x.key !== d.hdel); return commit(); }
    if (d.ctdel) { S.contacts = S.contacts.filter(x => x.id !== d.ctdel); return commit(); }
    switch (d.act) {
      case 'bagnew': S.bags.push({ id: uid(), name: 'Sac ' + (S.bags.length + 1), owner: '', items: [] }); return commit();
      case 'homeessential': { const have = new Set(S.homePlan.map(i => i.gearId)); GEAR.filter(g => g.scope !== 'sac' && g.priority === 'essentiel' && !have.has(g.id)).forEach(g => S.homePlan.push(lineFromGear(g))); return commit(); }
      case 'checked': S.lastCheck = today(); return commit();
      case 'export': return App.download(`kit-survie-sauvegarde-${today()}.json`, JSON.stringify(S, null, 1), 'application/json');
      case 'reset': if (confirm('Effacer toutes vos données locales ? (les cartes téléchargées restent en cache)')) { localStorage.removeItem('survie.v1'); location.reload(); } return;
      case 'invcsv': return App.download('inventaire.csv', toCsv([['Article', 'Catégorie', 'Quantité', 'Litres/unité', 'kcal/unité', 'Péremption', 'Emplacement'], ...S.inventory.map(i => [i.name, CAT_LABEL[i.cat], i.qty, i.litres, i.kcal, i.expiry, i.where])]), 'text/csv');
      case 'plancsv': return App.download('plan-achat.csv', toCsv([['Emplacement', 'Objet', 'Catégorie', 'Quantité', 'Prix unitaire', 'Total', 'Acquis'], ...planLines().map(l => [l.where, l.name, l.category, l.qty, l.price, (l.qty || 1) * (l.price || 0), l.have ? 'oui' : 'non'])]), 'text/csv');
      case 'catcsv': return App.download('catalogue-materiel.csv', toCsv([['Catégorie', 'Objet', 'Modèle', 'Qté', 'Poids (g)', 'Prix (€)', 'Statut prix', 'Priorité', 'Usage', 'Lien', 'Note'], ...GEAR.map(g => [g.category, g.name, g.model, g.qty, g.weight_g, g.price_eur, g.price_status, g.priority, g.scope, g.url, g.note])]), 'text/csv');
    }
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), o = Object.fromEntries(f.entries());
    if (e.target.id === 'invForm') S.inventory.push({ id: uid(), name: o.name, cat: o.cat, qty: +o.qty || 0, litres: +o.litres || 0, kcal: +o.kcal || 0, expiry: o.expiry, where: o.where });
    if (e.target.id === 'ctForm') S.contacts.push({ id: uid(), name: o.name, phone: o.phone, role: o.role });
    commit();
  });

  function net() { $('#netState').textContent = navigator.onLine ? 'En ligne — données locales' : 'Hors ligne — tout reste utilisable'; }
  window.addEventListener('online', net); window.addEventListener('offline', net); net();
  applyTheme();
  let startTab = 'dash'; try { startTab = localStorage.getItem('survie.tab') || 'dash'; } catch (e) { }
  show(RENDER[startTab] || startTab === 'map' ? startTab : 'dash');
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
})();
