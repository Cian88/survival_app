/* Profil personnel : c'est lui qui rend l'état des lieux, les sacs et l'écran Instant T propres à chaque utilisateur. */
(function () {
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const opt = (v, cur, t) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${t}</option>`;
  function render(el, S) {
    const P = S.profile, H = P.health = P.health || {}, K = P.skills = P.skills || {}, hm = P.home || {};
    const envs = window.ENV_VARIANTS || [];
    const chip = (axis, key) => envs.filter(e => e.axis === axis).map(e => `<button type="button" class="envchip ${(P[key] || []).includes(e.id) ? 'on' : ''}" data-penv="${key}|${e.id}">${h(e.short || e.name)}</button>`).join('');
    const nuc = window.Needs ? Needs.evaluate(S).nuc : null;
    const pro = window.Premium && Premium.isPremium(), lock = t => pro ? '' : Premium.lockNote(t), dis = pro ? '' : 'disabled';
    el.innerHTML = `
    <div class="card"><h2>Mon profil</h2>
      <p class="small">Ces informations restent sur votre appareil. Elles servent à calculer <b>votre</b> état des lieux matériel, à adapter vos sacs et à orienter l'écran Instant T.</p></div>
    <div class="grid">
      <div class="card"><h3>Foyer</h3>
        <label>Adultes <input type="number" min="0" data-pp="adults" value="${P.adults}"></label>
        <label>Enfants <input type="number" min="0" data-pp="children" value="${P.children || 0}"></label>
        <label>Dont nourrissons <input type="number" min="0" data-pp="babies" value="${P.babies || 0}"></label>
        <label>Animaux <input type="number" min="0" data-pp="pets" value="${P.pets || 0}"></label>
        <h3>Santé (cochez si au moins une personne est concernée)</h3>
        ${lock('Les besoins liés à la santé (traitements, appareil médical, lunettes, mobilité) sont calculés en Premium.')}
        ${[['chronic', 'Traitement chronique'], ['device', 'Appareil médical électrique (oxygène, respirateur…)'], ['glasses', 'Lunettes / lentilles'], ['mobility', 'Mobilité réduite']].map(([k, t]) => `<label class="chk"><input type="checkbox" data-ph="${k}" ${H[k] ? 'checked' : ''} ${dis}> ${t}</label>`).join('')}
      </div>
      <div class="card"><h3>Domicile</h3>
        ${lock('Le logement (étage, chauffage, cuisson, puits, véhicule) affine votre état des lieux en Premium. La position du domicile reste gratuite.')}
        <fieldset class="plain" ${dis}>
        <label>Logement <select data-pp="dwelling">${opt('maison', P.dwelling, 'Maison')}${opt('appartement', P.dwelling, 'Appartement')}</select></label>
        <label>Étage <input type="number" min="0" data-pp="floor" value="${P.floor || 0}"></label>
        <label>Chauffage <select data-pp="heating">${[['electrique', 'Électrique'], ['pac', 'Pompe à chaleur'], ['gaz', 'Gaz'], ['fioul', 'Fioul'], ['bois', 'Bois / poêle'], ['collectif', 'Collectif']].map(([v, t]) => opt(v, P.heating || 'electrique', t)).join('')}</select></label>
        <label>Cuisson <select data-pp="cooking">${[['electrique', 'Électrique'], ['gaz', 'Gaz'], ['mixte', 'Mixte']].map(([v, t]) => opt(v, P.cooking || 'electrique', t)).join('')}</select></label>
        <label>Eau <select data-pp="water">${opt('reseau', P.water || 'reseau', 'Réseau public')}${opt('puits', P.water, 'Puits / forage (pompe)')}</select></label>
        <label class="chk"><input type="checkbox" data-pp="vehicle" ${P.vehicle ? 'checked' : ''}> Véhicule disponible</label>
        </fieldset>
        <h3>Position du domicile</h3>
        <div class="row"><label>Latitude <input id="pLat" type="number" step="any" value="${hm.lat ?? ''}" style="width:9em"></label><label>Longitude <input id="pLon" type="number" step="any" value="${hm.lon ?? ''}" style="width:9em"></label></div>
        <button type="button" class="btn ghost" data-pgps>Utiliser ma position GPS actuelle</button> <button type="button" class="btn ghost" data-psave>Enregistrer</button>
        <p class="small muted">Sert à calculer les risques proches (sites nucléaires, barrages), à préparer la carte hors ligne de votre zone en un clic et à vous guider vers chez vous.</p>
        ${nuc ? `<p class="small">☢ Site nucléaire le plus proche : <b>${h(nuc.p.name)}</b> à ${Math.round(nuc.d)} km.</p>` : ''}
      </div>
      <div class="card"><h3>Environnement</h3>
        ${lock('Les besoins propres à votre lieu et à votre climat sont ajoutés en Premium.')}
        <p class="small">Lieu :</p><div class="envsel">${chip('lieu', 'lieu')}</div>
        <p class="small">Climat / saison :</p><div class="envsel">${chip('climat', 'climat')}</div>
        <p class="small muted">Ajoute les besoins propres à ces environnements (risques, matériel, réflexes) à votre état des lieux et à vos sacs.</p>
        <h3>Objectifs</h3>
        <label>Autonomie visée <select data-pp="days">${[3, 7, 14, 30, 60, 90].map(d => opt(d, P.days, d + ' jours' + (d === 14 ? ' (praticiens)' : d === 3 ? ' (minimum)' : ''))).join('')}</select></label>
        <label>Eau par pers. et par jour <select data-pp="waterL">${[[2, '2 L (boisson seule)'], [3, '3 L'], [4, '4 L (praticiens : boisson + hygiène minimale)'], [7.5, '7,5 L'], [15, '15 L (humanitaire)']].map(([v, t]) => opt(v, P.waterL, t)).join('')}</select></label>
        <label>kcal par pers. et par jour <input type="number" step="100" min="0" data-pp="kcal" value="${P.kcal}"></label>
        <label>Budget (€) <input type="number" step="50" min="0" data-pp="budget" value="${P.budget}"></label>
      </div>
      <div class="card"><h3>Compétences</h3>
        ${lock('Le suivi des compétences fait partie de Premium.')}
        ${[['psc1', 'Premiers secours (PSC1 / Gestes qui sauvent / Stop the Bleed)'], ['carte', 'Lire une carte, utiliser une boussole'], ['eau', 'Rendre l\'eau potable'], ['feu', 'Faire du feu en sécurité'], ['radio', 'Radio (PMR446, radioamateur)'], ['meca', 'Réparations de base (électricité, plomberie, mécanique)']].map(([k, t]) => `<label class="chk"><input type="checkbox" data-pk="${k}" ${K[k] ? 'checked' : ''} ${dis}> ${t}</label>`).join('')}
        <p class="small muted">Les praticiens sont unanimes : les compétences passent avant le matériel.</p>
      </div>
    </div>`;
  }
  function bind(root, S, commit) {
    root.addEventListener('change', e => {
      const t = e.target, d = t.dataset, P = S.profile;
      if (d.pp) { P[d.pp] = t.type === 'checkbox' ? t.checked : t.type === 'number' || ['days', 'waterL'].includes(d.pp) ? +t.value : t.value; commit(); }
      if (d.ph) { P.health[d.ph] = t.checked; commit(); }
      if (d.pk) { P.skills[d.pk] = t.checked; commit(); }
    });
    root.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return; const d = t.dataset, P = S.profile;
      if (d.penv && !Premium.gate('Les besoins propres à votre lieu et à votre climat font partie de Premium.')) return;
      if (d.penv) { const [k, id] = d.penv.split('|'); P[k] = P[k] || []; P[k] = P[k].includes(id) ? P[k].filter(x => x !== id) : [...P[k], id]; return commit(); }
      if (d.psave !== undefined) { const la = parseFloat(root.querySelector('#pLat').value), lo = parseFloat(root.querySelector('#pLon').value); if (isFinite(la) && isFinite(lo)) { P.home = { lat: la, lon: lo }; commit(); } else UI.notice('Latitude et longitude invalides.'); }
      if (d.pgps !== undefined) { try { const g = await SurvivalMap.getGPS(); P.home = { lat: +g.lat.toFixed(5), lon: +g.lon.toFixed(5) }; commit(); } catch (err) { UI.notice('Position indisponible : ' + err.message); } }
    });
  }
  window.Profile = { render, bind };
})();
