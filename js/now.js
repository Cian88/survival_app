/* Instant T : l'écran de la situation présente. Position GPS (sans Internet), autonomie réelle,
   actions immédiates selon la situation, matériel que VOUS avez pour y faire face,
   ressources et dangers les plus proches d'après vos données hors ligne. */
(function () {
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fr = (n, d = 1) => (+n || 0).toLocaleString('fr-FR', { maximumFractionDigits: d });
  const s = (t, u) => ({ t, u });
  const SG = s('SGDSN', 'https://www.sgdsn.gouv.fr/files/files/Publications/Guide_Tous%20responsables.pdf');
  const OSMC = { eau: 'Eau', sante: 'Santé', secours: 'Secours & abris', energie: 'Énergie', dangers: 'Dangers', ravito: 'Ravitaillement', nucleaire: 'Site nucléaire', barrage: 'Grand barrage' };
  const SIT = {
    courant: { n: 'Coupure de courant', ic: '🔌', needs: ['lum_front', 'co_radio', 'lum_batt', 'lum_auto', 'nour_rechaud', 'se_co', 'lum_piles'], cats: ['secours', 'sante', 'energie'], steps: [
      ['Allumer la radio (FM locale, service public) ; mode avion hors des moments d\'appel, un seul SMS d\'état aux proches.', s('Black-out ibérique', 'https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/')],
      ['Remplir des récipients d\'eau tant qu\'il reste de la pression (immeuble, puits).', s('Ukraine (Al Jazeera)', 'https://www.aljazeera.com/amp/news/2022/11/26/hold-amid-attacks-kyivans-offer-tips-on-survival-optimism')],
      ['Garder frigo et congélateur fermés ; consommer d\'abord le frais.', s('Helene (témoignages)', 'https://singlegirlsdiy.com/prepping-mistakes-hurricane-helene/')],
      ['Aucune combustion à l\'intérieur sans aération ni détecteur de CO ; groupe électrogène dehors, loin des ouvertures.', s('NIST', 'https://www.nist.gov/news-events/news/2013/04/prototype-generators-emit-much-less-carbon-monoxide-nist-finds')],
      ['Réserver la batterie à la lumière, la radio et la communication, pas à chauffer de l\'eau.', s('Ciarán (5 jours sans courant)', 'https://france3-regions.franceinfo.fr/bretagne/morbihan/tempete-ciaran-la-longue-et-difficile-remise-en-etat-du-reseau-electrique-face-a-l-impatience-des-foyers-sans-courant-2867558.html')],
      ['Retirer des espèces avant d\'en avoir besoin ; éviter les ascenseurs ; passer voir les voisins âgés ou dépendants.', s('Black-out ibérique', 'https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/')]] },
    eau: { n: 'Coupure d\'eau / eau non potable', ic: '🚱', needs: ['eau_stock', 'eau_filtre', 'eau_past', 'eau_seaux', 'hy_wc'], cats: ['eau'], steps: [
      ['Considérer l\'eau du robinet comme non potable tant qu\'aucune consigne ne dit le contraire (Asheville : 53 jours).', s('Asheville Watchdog', 'https://avlwatchdog.org/2024-in-review-water-outage-and-restoration-took-center-stage-this-fall-after-helene/')],
      ['Récupérer les réserves cachées : chauffe-eau, chasse d\'eau, baignoire.', s('Citoyen Prévoyant', 'https://youtu.be/2LSkLW60Phk')],
      ['Séparer et étiqueter les contenants : « potable », « filtrée », « chasse ».', s('NPR (Helene)', 'https://www.pbs.org/newshour/nation/north-carolina-residents-support-each-other-in-old-fashioned-ways-after-helene-cuts-power-phones')],
      ['Traiter l\'eau de récupération : filtrer puis désinfecter (ébullition 1 min, ou chlore — voir Calculateurs).', s('CDC', 'https://www.cdc.gov/water-emergency/about/index.html')],
      ['Installer tout de suite les toilettes de secours (seau, sacs épais, matière sèche).', s('WREMO', 'https://www.wremo.nz/get-ready/home-ready/emergency-toilets')]] },
    crue: { n: 'Inondation / crue', ic: '🌊', needs: ['ev_sacs', 'co_radio', 'lum_front', 'ev_etage'], cats: ['secours', 'sante'], alt: true, steps: [
      ['Monter à l\'étage ou sur un point haut. Ne jamais descendre au garage ni en cave chercher la voiture.', s('Valence 2024', 'https://www.telemadrid.es/programas/telenoticias-fin-de-semana/Los-garajes-la-trampa-mortal-de-la-DANA-en-Valencia-2-2721347846--20241102025829.html')],
      ['Ne pas attendre l\'alerte officielle : la pluie en amont et l\'eau qui monte suffisent.', s('Público', 'https://www.publico.es/politica/tribunales/mayoria-fallecidos-dana-valencia-murieron-enviase-alerta-generalitat.amp.html')],
      ['Ne pas s\'engager dans l\'eau qui coule : ≈ 15 cm peuvent faire tomber un adulte ; 30 cm peuvent emporter une voiture.', s('NWS', 'https://weather.gov/tsa/hydro_tadd')],
      ['Couper électricité et gaz si c\'est sans danger ; emporter le sac, les médicaments, le téléphone chargé.', SG],
      ['Après la crue : eau du robinet non potable, secours organisés au bout de plusieurs jours.', s('Ara (Paiporta)', 'https://es.ara.cat/valencia/autogestion-gobierna-catastrofe-paiporta-no-no-quedarme-casa_1_5189061.html')]] },
    froid: { n: 'Grand froid sans chauffage', ic: '🥶', needs: ['ch_couchage', 'ch_laine', 'ch_piece', 'se_co', 'ch_couv'], cats: ['secours', 'energie'], steps: [
      ['Se replier dans une seule petite pièce : tente ou couvertures sur une table, bouillottes, couches de laine.', s('Ukraine (NPR)', 'https://www.wvpe.org/npr-news/2026-01-26/ukrainians-are-sharing-hacks-online-on-how-to-survive-winter-power-cuts')],
      ['Jamais de four, de barbecue ni de voiture au garage pour se chauffer.', s('Texas 2021', 'https://www.uh.edu/hobby/winter2021/index.php')],
      ['Protéger les canalisations : débit continu, tuyaux extérieurs débranchés.', s('Texas 2021 (KXXV)', 'https://www.kxxv.com/news/local-news/in-your-neighborhood/surviving-the-freeze-lessons-learned-from-a-battle-with-burst-pipes')],
      ['Partir tôt chez un proche ou dans un lieu chauffé si la pièce n\'atteint plus une température supportable.', s('Texas 2021 (UH)', 'https://www.uh.edu/hobby/winter2021/index.php')],
      ['Hypothermie (frissons, confusion) : isoler du sol, vêtements secs, boisson chaude si conscient, appeler le 15/112. Pas d\'alcool.', s('British Red Cross', 'https://www.redcross.org.uk/first-aid/learn-first-aid/hypothermia')]] },
    chaleur: { n: 'Canicule', ic: '🥵', needs: ['eau_stock'], cats: ['eau', 'sante'], env: 'chaud', steps: [] },
    feu: { n: 'Feu de forêt / fumées', ic: '🔥', needs: ['sa_ffp2', 'ev_sacs'], cats: ['secours', 'sante'], env: 'foret', steps: [
      ['Se confiner dans un bâtiment en dur, boucher les aérations, se couvrir le visage d\'un linge humide.', SG],
      ['Ne pas sortir sauf ordre d\'évacuation ; ne pas bloquer l\'accès des secours.', SG],
      ['Si vous devez fuir : à l\'opposé du vent et du feu.', s('La Vilaine Mémère', 'https://youtu.be/V-JmleZvu3U')]] },
    nuc: { n: 'Alerte nucléaire / chimique', ic: '☢', needs: ['sa_iode', 'co_radio', 'eau_stock', 'nour_kcal'], cats: ['nucleaire', 'dangers'], steps: [
      ['Se mettre à l\'abri dans un bâtiment en dur, fermer portes et fenêtres, couper ventilation et climatisation.', SG],
      ['Écouter la radio ; ne pas aller chercher les enfants à l\'école.', SG],
      ['Iode : uniquement sur ordre du préfet (65 mg : dès 12 ans 2 cp ; 3–12 ans 1 ; 1 mois–3 ans ½ ; < 1 mois ¼).', s('ASNR', 'https://reglementation-controle.asnr.fr/autres-activites/situations-d-urgence/la-distribution-d-iode')],
      ['N\'évacuer que sur ordre des autorités, par les itinéraires indiqués.', SG]] },
    evac: { n: 'Évacuation', ic: '🏃', needs: ['ev_sacs', 'ar_docs', 'ar_cash', 'ev_chaussures', 'ev_plein', 'na_pack'], cats: ['secours', 'energie'], rdv: true, steps: [
      ['Prendre les sacs, papiers, médicaments, chargeurs, animaux. La vitesse compte plus que la quantité.', s('Ukraine (bug.org.ua)', 'https://euromaidanpress.com/2026/02/26/how-kyiv-residents-engineer-their-own-survival-systems/')],
      ['Couper eau, gaz, électricité ; fermer à clé.', SG],
      ['Faire le plein et retirer des espèces avant de partir si possible ; s\'attendre à des rayons vides à l\'arrivée.', s('r/preppers', 'https://www.reddit.com/r/preppers/comments/1fz6o1q/')],
      ['Aller vers une destination connue (proches) par l\'itinéraire prévu ; prévenir votre contact hors zone.', s('The Prepared', 'https://theprepared.com/prepping-basics/guides/emergency-preparedness-checklist-prepping-beginners/')]] },
    blesse: { n: 'Blessé / urgence médicale', ic: '⛑', needs: ['sa_trousse', 'sa_garrot', 'sa_compr'], cats: ['sante'], steps: [
      ['Sécuriser, apprécier l\'état, alerter (15, 18, 112 ; SMS 114), puis faire les gestes.', s('Croix-Rouge', 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/4-etapes-pour-porter-secours')],
      ['Hémorragie : comprimer fort, mécher la plaie, garrot 5–7 cm au-dessus si ça ne s\'arrête pas ; noter l\'heure de pose.', s('Stop the Bleed', 'https://www.stopthebleed.org/')],
      ['Arrêt cardiaque : 30 compressions (5–6 cm, ≈ 100/min) / 2 insufflations, défibrillateur dès que possible.', s('Croix-Rouge', 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/arret-cardiaque')],
      ['Donner aux secours : numéro, nature, dangers, localisation précise (coordonnées ci-dessus), nombre de victimes.', s('CEETS', 'https://ceets.org/alerter-les-secours-partout/')]] },
    seisme: { n: 'Séisme / effondrement', ic: '🏚', needs: ['co_sifflet', 'ev_chaussures', 'sa_ffp2', 'lum_front', 'ch_couv'], cats: ['secours', 'sante'], steps: [
      ['Chaussures avant tout (verre au sol) ; lampe, sifflet, masque filtrant.', s('Ukraine, retours après frappes', 'https://euromaidanpress.com/2026/02/26/how-kyiv-residents-engineer-their-own-survival-systems/')],
      ['Sous des décombres : économiser l\'eau et ses forces, se signaler par le bruit (taper sur du métal, sifflet).', s('ABC News (Turquie)', 'https://abcnews.com/Health/people-survive-days-earthquake-rubble-survivors-found-turkey/story?id=97035249')],
      ['Prévoir de passer les premières nuits dehors ou en voiture : couche chaude et couverture de survie.', s('AFP (Turquie)', 'https://www.gmanetwork.com/news/topstories/world/860240/turkish-quake-survivors-face-big-freeze-in-cars-tents/story/')]] },
    perdu: { n: 'Perdu / isolé', ic: '🧭', needs: ['na_pack', 'na_bouss', 'co_sifflet', 'lum_batt'], cats: ['secours', 'eau'], alt: true, home: true, steps: [
      ['Ne pas s\'épuiser : faire le point avec la position, l\'altitude et le cap ci-dessus.', s('CEETS', 'https://ceets.org/alerter-les-secours-partout/')],
      ['Alerter : 112 (ou SMS 114), en donnant les coordonnées ; sifflet : 6 coups par minute.', s('CEETS', 'https://ceets.org/alerter-les-secours-partout/')],
      ['Pas de réseau : gagner un point haut, économiser la batterie, essayer le SMS.', s('Club Alpin Suisse', 'https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/')]] },
  };

  let cur = null, pos = null;
  function where(S) {
    if (pos) return { lat: pos.lat, lon: pos.lon, src: `GPS ± ${Math.round(pos.acc)} m, ${new Date(pos.t).toLocaleTimeString('fr-FR')}` };
    const hm = S.profile.home; if (hm && (hm.lat || hm.lon)) return { lat: hm.lat, lon: hm.lon, src: 'domicile (profil)' };
    return null;
  }
  function envSteps(id) { const e = (window.ENV_VARIANTS || []).find(x => x.id === id); return e ? (e.reflexes || []).map(r => [r.t, s('source', r.src)]) : []; }
  function render(el, S) {
    const R = Needs.evaluate(S), st = Needs.stock(S), n = Math.max(1, (+S.profile.adults || 0) + (+S.profile.children || 0));
    const dW = st.w / (n * (+S.profile.waterL || 4)), dK = st.k / (n * (+S.profile.kcal || 2100));
    const byId = Object.fromEntries(R.list.map(x => [x.id, x]));
    const W = where(S), sit = cur && SIT[cur];
    const cash = byId.ar_cash;
    el.innerHTML = `
    <div class="card now-head">
      <div class="row between"><h2>Instant T</h2><span class="small muted">${new Date().toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })} · ${navigator.onLine ? 'en ligne' : '<b>hors ligne</b> — tout reste utilisable'}</span></div>
      <div class="row">
        <button class="btn" data-now="gps">📍 Me localiser (GPS, sans Internet)</button>
        ${W ? `<div class="pos"><b>${W.lat.toFixed(5)}, ${W.lon.toFixed(5)}</b> <span class="small muted">(${h(W.src)})</span> <span id="nowAlt" class="small"></span> <button class="link small" data-now="map">voir sur la carte</button></div>` : '<span class="small muted">Position inconnue : localisez-vous ou renseignez votre domicile dans Mon profil.</span>'}
      </div>
      <div id="nowHome" class="small"></div>
      <div class="grid kpis">
        <div><div class="muted small">Eau</div><div class="kpi ${dW < 3 ? 'bad-t' : ''}">${fr(dW)} j</div><div class="small muted">${fr(st.w, 0)} L pour ${n} pers.</div></div>
        <div><div class="muted small">Nourriture</div><div class="kpi ${dK < 3 ? 'bad-t' : ''}">${fr(dK)} j</div><div class="small muted">${fr(st.k, 0)} kcal</div></div>
        <div><div class="muted small">Sacs prêts</div><div class="kpi">${byId.ev_sacs ? `${byId.ev_sacs.have}/${byId.ev_sacs.need}` : '—'}</div></div>
        <div><div class="muted small">Espèces</div><div class="kpi">${cash ? fr(cash.have, 0) + ' €' : '—'}</div><div class="small muted">objectif ${cash ? fr(cash.need, 0) : '—'} €</div></div>
      </div>
    </div>
    <div class="card"><h3>Que se passe-t-il ?</h3>
      <div class="sitgrid">${Object.entries(SIT).map(([k, v]) => `<button class="sit ${cur === k ? 'on' : ''}" data-sit="${k}"><span>${v.ic}</span>${h(v.n)}</button>`).join('')}</div>
    </div>
    ${sit ? sitPanel(S, sit, byId, W) : `<div class="card"><h3>Premiers réflexes, quelle que soit la situation</h3><ol>
      <li>Se mettre en sécurité, puis s'informer par la radio. <a class="src" href="https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/" target="_blank" rel="noopener">[black-out ibérique]</a></li>
      <li>Donner des nouvelles aux proches par SMS, selon votre plan. <a class="src" href="https://www.cisa.gov/sites/default/files/2024-10/2024_NCSWICPTE_Leveraging_PACE_Plan_Emergency_Comms_Ecosystems.pdf" target="_blank" rel="noopener">[PACE]</a></li>
      <li>Sécuriser l'eau (remplir des récipients tant qu'il y a de la pression). <a class="src" href="https://www.aljazeera.com/amp/news/2022/11/26/hold-amid-attacks-kyivans-offer-tips-on-survival-optimism" target="_blank" rel="noopener">[Ukraine]</a></li>
      <li>Aucune improvisation avec le feu ou le CO. <a class="src" href="https://www.uh.edu/hobby/winter2021/index.php" target="_blank" rel="noopener">[Texas 2021]</a></li>
      <li>Penser aux voisins isolés ; les secours organisés arrivent souvent après 3 jours. <a class="src" href="https://es.ara.cat/valencia/autogestion-gobierna-catastrofe-paiporta-no-no-quedarme-casa_1_5189061.html" target="_blank" rel="noopener">[Valence]</a></li></ol></div>`}
    <div class="card"><h3>Appeler</h3>
      <div class="row">${[['112', 'Urgence UE'], ['15', 'SAMU'], ['18', 'Pompiers'], ['17', 'Police'], ['114', 'SMS urgence']].map(([n, t]) => `<a class="callbtn" href="${n === '114' ? 'sms:114' : 'tel:' + n}"><b>${n}</b><span>${t}</span></a>`).join('')}</div>
      ${S.contacts.length ? `<ul>${S.contacts.map(c => `<li><b>${h(c.name)}</b> ${h(c.role || '')} — <span class="sel">${h(c.phone)}</span></li>`).join('')}</ul>` : '<p class="small muted">Aucun contact enregistré (onglet Plan).</p>'}
    </div>`;
    if (W) fillNearby(W, sit);
  }
  function sitPanel(S, sit, byId, W) {
    const steps = sit.steps.concat(sit.env ? envSteps(sit.env) : []);
    const nd = sit.needs.map(id => byId[id]).filter(Boolean);
    const have = nd.filter(x => x.status === 'ok' || x.status === 'part'), miss = nd.filter(x => x.status === 'miss');
    const rdv = (S.points || []).filter(p => p.type === 'rdv' || p.type === 'base');
    return `<div class="card sitpanel"><h3>${sit.ic} ${h(sit.n)} — à faire maintenant</h3>
      <ol class="steps">${steps.map(([t, sr]) => `<li><label><input type="checkbox"> <span>${h(t)}</span></label> <a class="src" href="${h(sr.u)}" target="_blank" rel="noopener">[${h(sr.t)}]</a></li>`).join('')}</ol>
      <div class="grid">
        <div><h4>Votre matériel pour ça</h4>${have.length ? `<ul class="small">${have.map(x => `<li>✓ ${h(x.label)}${x.need != null ? ` (${fr(x.have, 0)}/${fr(x.need, 0)} ${h(x.unit)})` : ''}</li>`).join('')}</ul>` : '<p class="small muted">Rien de déclaré.</p>'}
          ${miss.length ? `<p class="small"><b>Il vous manque :</b></p><ul class="small">${miss.map(x => `<li>✗ ${h(x.label)}</li>`).join('')}</ul>` : ''}</div>
        <div><h4>Autour de vous</h4><div id="nowNear" class="small">${W ? 'Recherche dans vos données hors ligne…' : 'Position inconnue.'}</div></div>
      </div>
      ${sit.rdv && rdv.length ? `<h4>Vos points de rendez-vous / refuges</h4><ul class="small" id="nowRdv">${rdv.map(p => `<li data-rdv="${p.lat},${p.lon}"><b>${h(p.name)}</b> <span class="d"></span> <button class="link" data-goll="${p.lat},${p.lon}">carte</button></li>`).join('')}</ul>` : ''}
    </div>`;
  }
  async function fillNearby(W, sit) {
    const M = window.SurvivalMap; if (!M) return;
    const hm = App.state.profile.home, hel = document.getElementById('nowHome');
    if (hel && hm && (hm.lat || hm.lon) && pos) { const d = M.distKm(W.lat, W.lon, hm.lat, hm.lon), b = M.bearing(W.lat, W.lon, hm.lat, hm.lon); hel.innerHTML = `🏠 Domicile : <b>${fr(d)} km</b> au <b>${M.cardinal(b)}</b> (cap ${Math.round(b)}°) — ≈ ${fr(d / 4.5)} h de marche sur le plat.`; }
    document.querySelectorAll('#nowRdv [data-rdv]').forEach(li => { const [la, lo] = li.dataset.rdv.split(',').map(Number), d = M.distKm(W.lat, W.lon, la, lo), b = M.bearing(W.lat, W.lon, la, lo); li.querySelector('.d').textContent = `${fr(d)} km au ${M.cardinal(b)} (cap ${Math.round(b)}°)`; });
    if (sit && sit.alt) { try { const e = await M.elevationAt({ lat: W.lat, lng: W.lon }); const a = document.getElementById('nowAlt'); if (a && e) a.textContent = `· altitude ≈ ${e.h} m`; } catch (e) { } }
    const el = document.getElementById('nowNear'); if (!el || !sit) return;
    const [cov, near] = await Promise.all([M.coverage(W.lat, W.lon), M.nearest(W.lat, W.lon, sit.cats, 3)]);
    const rows = sit.cats.map(c => (near[c] || []).length ? `<p><b>${OSMC[c]}</b></p><ul>${near[c].map(p => `<li>${h(p.name)} <span class="muted">${h(p.kind)}</span> — <b>${fr(p.d)} km</b> au ${M.cardinal(p.b)} (${Math.round(p.b)}°) <button class="link" data-goll="${p.lat},${p.lon}">carte</button></li>`).join('')}</ul>` : '').join('');
    el.innerHTML = (rows || '<p class="muted">Aucun point hors ligne pour ces catégories.</p>') + (cov.zones.length ? '' : '<p class="alert">Aucune zone de points OSM téléchargée ici : préparez-la dans l\'onglet Carte (« Points OSM hors ligne »).</p>') + (cov.packs.length ? '' : '<p class="alert">Pas de carte hors ligne détaillée pour cette position : onglet Carte → « Cartes hors ligne ».</p>');
  }
  function bind(root, S, rerender) {
    root.addEventListener('click', async e => {
      const t = e.target.closest('button, a'); if (!t) return; const d = t.dataset;
      if (d.sit) { cur = cur === d.sit ? null : d.sit; return rerender(); }
      if (d.now === 'gps') { t.textContent = 'Localisation…'; try { pos = await SurvivalMap.getGPS(); } catch (err) { UI.notice('Position indisponible : ' + err.message + '. Activez la localisation de l\'appareil (le GPS fonctionne sans Internet).'); } return rerender(); }
      if (d.now === 'map') { const W = where(S); if (W) SurvivalMap.focus(W.lat, W.lon, 15, 'Vous êtes ici'); }
      if (d.goll) { const [la, lo] = d.goll.split(',').map(Number); SurvivalMap.focus(la, lo, 16); }
    });
  }
  window.Now = { render, bind, SIT };
})();
