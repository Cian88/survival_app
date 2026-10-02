/* État des lieux matériel personnalisé : besoins calculés à partir du profil de l'utilisateur,
   comparés à ce qu'il possède (inventaire, sacs, achats cochés, saisie directe).
   Chaque besoin porte sa justification et sa source. */
(function () {
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const fr = (n, d = 1) => (+n || 0).toLocaleString('fr-FR', { maximumFractionDigits: d });
  const src = (t, u) => ({ t, u });
  const S_ = {
    tp: src('The Prepared', 'https://theprepared.com/prepping-basics/guides/emergency-preparedness-checklist-prepping-beginners/'),
    tpw: src('The Prepared (eau)', 'https://theprepared.com/homestead/reviews/best-two-week-emergency-water-storage-containers/'),
    tpbob: src('The Prepared (sac)', 'https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/'),
    tpcold: src('The Prepared (froid)', 'https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/'),
    tpf: src('The Prepared (filtres)', 'https://theprepared.com/gear/reviews/portable-water-filters/'),
    sphere: src('Sphere/UNHCR', 'https://emergency.unhcr.org/sites/default/files/2024-05/SphereFS+N.pdf'),
    helene: src('r/preppers, retour Helene (129 votes)', 'https://www.reddit.com/r/preppers/comments/1gua185/'),
    wremo: src('WREMO (toilette à deux seaux)', 'https://www.wremo.nz/get-ready/home-ready/emergency-toilets'),
    cdc: src('CDC', 'https://www.cdc.gov/water-emergency/about/index.html'),
    nist: src('NIST (CO)', 'https://www.nist.gov/news-events/news/2013/04/prototype-generators-emit-much-less-carbon-monoxide-nist-finds'),
    texas: src('Texas 2021 (Houston Chronicle)', 'https://www.houstonchronicle.com/news/houston-weather/article/Long-lines-limited-supply-greet-customers-15957659.php'),
    ukr: src('Ukraine (NPR)', 'https://www.wvpe.org/npr-news/2026-01-26/ukrainians-are-sharing-hacks-online-on-how-to-survive-winter-power-cuts'),
    ukrstrike: src('Ukraine, retours après frappes', 'https://euromaidanpress.com/2026/02/26/how-kyiv-residents-engineer-their-own-survival-systems/'),
    iberia: src('Black-out ibérique (Nuevaradio)', 'https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/'),
    ecb: src('BCE, 2025', 'https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html'),
    msb: src('MSB (Suède)', 'https://rib.msb.se/filer/pdf/30874.pdf'),
    sgdsn: src('SGDSN', 'https://www.sgdsn.gouv.fr/files/files/Publications/Guide_Tous%20responsables.pdf'),
    asnr: src('ASNR (iode)', 'https://reglementation-controle.asnr.fr/autres-activites/situations-d-urgence/la-distribution-d-iode'),
    fake: src('garrots contrefaits (Crisis Medicine)', 'https://www.crisis-medicine.com/counterfeit-tourniquets-are-a-serious-problem/'),
    patts: src('essai PATTS', 'https://clinicaltrials.gov/study/NCT03479112'),
    ceets: src('CEETS', 'https://ceets.org/go-bag-discret-24-48h-une-checklist-simple-testee-adaptable/'),
    ceetsA: src('CEETS (alerter)', 'https://ceets.org/alerter-les-secours-partout/'),
    helenemist: src('Retour Helene (erreurs)', 'https://singlegirlsdiy.com/prepping-mistakes-hurricane-helene/'),
    pace: src('CISA (plan PACE)', 'https://www.cisa.gov/sites/default/files/2024-10/2024_NCSWICPTE_Leveraging_PACE_Plan_Emergency_Comms_Ecosystems.pdf'),
    half: src('TruePrepper', 'https://trueprepper.com/half-tank-rule/'),
    fin: src('wiki r/preppers', 'https://old.reddit.com/r/preppers/wiki/financial'),
    ciaran: src('Ciarán, puits (France 3)', 'https://france3-regions.franceinfo.fr/bretagne/morbihan/tempete-ciaran-la-longue-et-difficile-remise-en-etat-du-reseau-electrique-face-a-l-impatience-des-foyers-sans-courant-2867558.html'),
    ppreppers: src('Practical Preppers', 'https://practicalpreppers.com/how-to-stay-prepared-for-a-power-outage/'),
    ol: src('test Outdoor Life', 'https://www.outdoorlife.com/gear/best-portable-power-stations/'),
    valence: src('Valence 2024 (Telemadrid)', 'https://www.telemadrid.es/programas/telenoticias-fin-de-semana/Los-garajes-la-trampa-mortal-de-la-DANA-en-Valencia-2-2721347846--20241102025829.html'),
    vilaine: src('La Vilaine Mémère', 'https://youtu.be/V-JmleZvu3U'),
  };
  const FN = [
    ['eau', '💧', 'Eau'], ['nour', '🥫', 'Nourriture & cuisson'], ['chaud', '🔥', 'Chaleur & abri'], ['lum', '🔦', 'Lumière & énergie'],
    ['sante', '⛑', 'Santé'], ['hyg', '🧼', 'Hygiène'], ['com', '📻', 'Information & communication'], ['nav', '🧭', 'Cartes & orientation'],
    ['arg', '💶', 'Documents & argent'], ['secu', '🧯', 'Sécurité'], ['evac', '🎒', 'Évacuation'], ['sav', '🧠', 'Savoirs & exercices'],
  ];
  const CRIT = { 1: 'vital', 2: 'important', 3: 'utile' };

  function dist(a, b, c, d) { const t = Math.PI / 180, x = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); }
  function nearestNuclear(P) {
    const hm = P.home; if (!hm || !isFinite(hm.lat) || !(hm.lat || hm.lon)) return null;
    let best = null;
    for (const p of (window.POI_EUROPE || {}).nuclear || []) {
      if (p.state && /annulé|abandonné|projet/i.test(p.state)) continue;
      const d = dist(hm.lat, hm.lon, p.lat, p.lon); if (!best || d < best.d) best = { d, p };
    }
    return best;
  }

  /* Besoins selon le profil. need = null → oui/non. */
  function computeNeeds(S) {
    const pro = !window.Premium || Premium.isPremium();
    const P = pro ? S.profile : Object.assign({}, S.profile, { lieu: [], climat: [], health: {}, heating: 'electrique', cooking: 'electrique', water: 'reseau', vehicle: false, dwelling: 'maison', floor: 1 }), n = Math.max(1, (+P.adults || 0) + (+P.children || 0)), ad = Math.max(1, +P.adults || 1), days = +P.days || 3;
    const cold = (P.climat || []).includes('froid'), hot = (P.climat || []).includes('chaud');
    const H = P.health || {}, heatNeedsPower = ['electrique', 'pac', 'gaz', 'fioul', 'collectif'].includes(P.heating || 'electrique');
    const combustion = ['gaz', 'fioul', 'bois'].includes(P.heating) || P.cooking === 'gaz' || P.cooking === 'mixte';
    const nuc = nearestNuclear(P);
    const L = [];
    const add = o => L.push(Object.assign({ crit: 2, unit: '', need: null }, o));
    // Eau
    const wd = Math.min(days, 14);
    add({ id: 'eau_stock', fn: 'eau', label: 'Eau stockée (boisson + hygiène minimale)', need: Math.ceil(n * wd * (+P.waterL || 4) * (hot ? 1.5 : 1)), unit: 'L', crit: 1, auto: 'water', why: `${n} pers. × ${wd} j × ${P.waterL || 4} L${hot ? ' × 1,5 (chaleur)' : ''}${days > 14 ? ' (stock plafonné à 14 jours ; au-delà : source renouvelable + traitement)' : ''}. Les praticiens comptent ≈ 4 L/pers/j ; l'eau manque avant la nourriture dans presque toutes les crises réelles.`, src: [S_.tpw, S_.helene] });
    if (days > 14) add({ id: 'eau_source', fn: 'eau', label: 'Source d\'eau renouvelable repérée et équipée (récupérateur de pluie, puits, cours d\'eau) + traitement', crit: 1, why: `Au-delà de 2 semaines, stocker l'eau devient irréaliste (${Math.ceil(n * days * (+P.waterL || 4))} L pour ${days} jours) : on s'appuie sur une source et sur un traitement durable (filtre).`, src: [src('Creek Stewart (source autonome au-delà de 3 mois)', 'https://www.artofmanliness.com/skills/outdoor-survival/survival-bugging-in-shelter-in-place/'), S_.tpw] });
    add({ id: 'eau_filtre', fn: 'eau', label: 'Filtre à eau (≤ 0,1–0,3 µm), certifié par un tiers', need: 1, crit: 1, gear: 'G005', why: 'Pour traiter l\'eau de récupération. Ne retient ni virus ni produits chimiques : filtrer puis désinfecter.', src: [S_.tpf, S_.cdc] });
    add({ id: 'eau_past', fn: 'eau', label: 'Pastilles de désinfection', need: n, unit: 'boîte(s) de 50', crit: 2, gear: 'G007', why: 'Deuxième moyen de traitement (virus), et seul moyen si le filtre a gelé.', src: [S_.tpf] });
    add({ id: 'eau_seaux', fn: 'eau', label: 'Seaux de 15–20 L à couvercle (eau non potable, toilettes)', need: 2, crit: 2, why: 'L\'oubli le plus cité après l\'ouragan Helene : de quoi stocker l\'eau des toilettes.', src: [S_.helene, S_.wremo] });
    if (P.water === 'puits') add({ id: 'eau_puits', fn: 'eau', label: 'Moyen de puiser sans électricité (pompe manuelle, seau et corde)', crit: 1, why: 'Pendant Ciarán, les pompes électriques des puits se sont arrêtées avec le courant.', src: [S_.ciaran] });
    // Nourriture
    add({ id: 'nour_kcal', fn: 'nour', label: 'Nourriture stockée', need: n * days * (+P.kcal || 2100), unit: 'kcal', crit: 1, auto: 'kcal', why: `${n} pers. × ${days} j × ${P.kcal || 2100} kcal. « Stocker ce qu'on mange, manger ce qu'on stocke ».`, src: [S_.sphere, S_.tp] });
    add({ id: 'nour_cru', fn: 'nour', label: 'Au moins 3 jours de repas sans cuisson', crit: 2, why: 'Sans gaz ni électricité, il faut pouvoir manger tout de suite.', src: [S_.helene, S_.tp] });
    add({ id: 'nour_rechaud', fn: 'nour', label: 'Réchaud indépendant du réseau + combustible pour la durée visée', need: 1, crit: P.cooking === 'gaz' ? 3 : 1, gear: 'G023', why: P.cooking === 'gaz' ? 'Vous cuisinez au gaz : un réchaud de secours reste utile en évacuation.' : 'Votre cuisson dépend de l\'électricité.', src: [S_.sgdsn, S_.tp] });
    add({ id: 'nour_ouvre', fn: 'nour', label: 'Ouvre-boîte manuel', need: 1, crit: 2, why: 'Indispensable pour les conserves.', src: [S_.sgdsn] });
    if (+P.pets) add({ id: 'nour_anim', fn: 'nour', label: `Nourriture et eau des animaux (${P.pets}) pour ${days} jours`, crit: 2, why: 'Oubli fréquent ; prévoir aussi laisse, caisse de transport, carnet de vaccination.', src: [S_.vilaine] });
    if (+P.babies) add({ id: 'nour_bebe', fn: 'nour', label: `Lait infantile prêt à l'emploi, couches pour ${days} jours`, crit: 1, why: 'Le lait en poudre demande de l\'eau potable et chaude.', src: [S_.sgdsn, S_.vilaine] });
    // Chaleur & abri
    add({ id: 'ch_couchage', fn: 'chaud', label: 'Sac de couchage adapté à la saison', need: n, crit: cold ? 1 : 2, gear: 'G030', why: 'Au froid, se regrouper dans une pièce avec couchages et couvertures.', src: [S_.tpcold, S_.msb] });
    add({ id: 'ch_couv', fn: 'chaud', label: 'Couverture de survie', need: n, crit: 2, gear: 'G027', why: 'Premières nuits dehors ou en voiture (séisme en Turquie).', src: [S_.tpbob] });
    add({ id: 'ch_laine', fn: 'chaud', label: 'Vêtements chauds en laine / couches (par personne)', need: n, crit: cold ? 1 : 2, why: 'Le coton mouillé refroidit ; la laine isole même humide.', src: [S_.tpcold] });
    if (heatNeedsPower) add({ id: 'ch_piece', fn: 'chaud', label: 'Plan « une pièce chaude » : tente intérieure, bouillottes, isolation des fenêtres', crit: cold ? 1 : 2, why: 'Votre chauffage dépend de l\'électricité. Méthode la plus sûre selon les Ukrainiens (tente + bouillottes).', src: [S_.ukr, S_.tpcold] });
    // Lumière & énergie
    add({ id: 'lum_front', fn: 'lum', label: 'Lampe frontale (une par personne)', need: n, crit: 1, gear: 'G039', why: 'Mains libres ; les témoins du black-out ibérique manquaient de lampes.', src: [S_.iberia, S_.tp] });
    add({ id: 'lum_piles', fn: 'lum', label: 'Stock de piles standard (même format pour tout)', crit: 2, gear: 'G041', why: 'Les piles remplaçables ont battu les appareils rechargeables après Helene.', src: [S_.helenemist] });
    add({ id: 'lum_batt', fn: 'lum', label: 'Batterie externe chargée (≥ 10 000 mAh) par adulte', need: ad, crit: 2, gear: 'G044', why: 'Téléphone = alerte, lampe, informations.', src: [S_.ceets] });
    add({ id: 'lum_auto', fn: 'lum', label: 'Recharge autonome (station électrique, panneau solaire ou dynamo)', need: 1, crit: H.device ? 1 : 3, gear: 'G046', why: 'Les stations restituent 62–90 % de leur capacité ; privilégiez l\'USB/12 V pour les petits appareils.', src: [S_.ol] });
    if (H.device) add({ id: 'lum_med', fn: 'lum', label: 'Alimentation de secours dimensionnée pour l\'appareil médical', crit: 1, why: 'Pendant le black-out ibérique, des appareils médicaux se sont retrouvés sans autonomie.', src: [S_.ppreppers, S_.iberia] });
    // Santé
    add({ id: 'sa_trousse', fn: 'sante', label: 'Trousse de premiers secours complète', need: 1, crit: 1, gear: 'G064', why: 'Adaptée à vos formations.', src: [S_.tp] });
    add({ id: 'sa_garrot', fn: 'sante', label: 'Garrot homologué (acheté chez un revendeur agréé)', need: 1, crit: 2, gear: 'G065', why: 'Les copies ont une force plus faible et cassent plus souvent.', src: [S_.fake] });
    add({ id: 'sa_compr', fn: 'sante', label: 'Pansement compressif', need: 2, crit: 2, gear: 'G066', why: 'Hémorragie : comprimer, mécher, garrot.', src: [S_.fake] });
    if (H.chronic) add({ id: 'sa_ttt', fn: 'sante', label: 'Traitements chroniques d\'avance (≈ 1 mois) + ordonnances', crit: 1, why: 'Les médicaments courants ont été rationnés en mars 2020 ; la Suède conseille un mois de réserve.', src: [S_.msb] });
    if (H.glasses) add({ id: 'sa_lun', fn: 'sante', label: 'Lunettes de rechange', crit: 2, why: 'Sans lunettes, pas de lecture de carte ni de conduite.', src: [S_.sgdsn] });
    add({ id: 'sa_ffp2', fn: 'sante', label: 'Masques FFP2 (fumées, poussières, épidémie)', need: n * 10, crit: 2, gear: 'G068', per: 20, why: 'Après une frappe ou un incendie : poussière pendant des semaines. Ne filtre pas les gaz.', src: [S_.ukrstrike] });
    if (nuc && nuc.d <= 20) add({ id: 'sa_iode', fn: 'sante', label: `Comprimés d'iode (${nuc.p.name} à ${fr(nuc.d, 0)} km)`, need: 1, unit: 'boîte', crit: 1, gear: 'G067', why: 'Votre domicile est dans un rayon de 20 km (PPI). À prendre uniquement sur ordre du préfet.', src: [S_.asnr] });
    // Hygiène
    add({ id: 'hy_wc', fn: 'hyg', label: 'Toilettes de secours : seau, sacs épais, matière sèche (sciure, litière)', crit: 1, gear: 'G075', why: 'À installer dès le début de la coupure d\'eau, pas au 3e jour.', src: [S_.wremo, S_.helenemist] });
    add({ id: 'hy_savon', fn: 'hyg', label: 'Savon, gel hydroalcoolique, papier toilette, protections périodiques', crit: 2, gear: 'G072', why: 'Les maladies liées à l\'hygiène ont tué autant que les balles dans le siège décrit par Selco.', src: [src('Selco', 'https://survivalistprepper.net/surviving-one-year-in-hell-interview-with-selco-of-shtfschool/')] });
    // Communication
    add({ id: 'co_radio', fn: 'com', label: 'Radio à piles ou à manivelle (FM/AM)', need: 1, crit: 1, gear: 'G048', why: 'Leçon n° 1 du black-out ibérique (« día de los transistores ») et des tempêtes de 1999.', src: [S_.iberia] });
    add({ id: 'co_contacts', fn: 'com', label: 'Contacts d\'urgence notés (et copiés sur papier)', need: 3, crit: 1, auto: 'contacts', why: 'Sans réseau ni batterie, le répertoire du téléphone est inaccessible.', src: [S_.ukrstrike, S_.ceetsA] });
    add({ id: 'co_pace', fn: 'com', label: 'Plan de communication familial (SMS → radio → point de RDV → message laissé)', crit: 2, auto: 'plan', why: 'Joindre ses proches est la 2e angoisse dans toutes les crises étudiées.', src: [S_.pace] });
    add({ id: 'co_sifflet', fn: 'com', label: 'Sifflet (un par personne)', need: n, crit: 2, gear: 'G051', why: 'Se signaler sous des décombres (Ukraine, Turquie).', src: [S_.ukrstrike] });
    add({ id: 'co_pmr', fn: 'com', label: 'Talkies-walkies PMR446 (sans licence)', need: 1, unit: 'paire', crit: 3, gear: 'G050', why: 'Communication locale sans réseau (quelques centaines de mètres en ville).', src: [S_.pace] });
    // Cartes & orientation
    add({ id: 'na_pack', fn: 'nav', label: 'Carte topographique hors ligne de ma zone (domicile)', crit: 1, auto: 'pack', why: 'Téléchargée dans l\'onglet Carte : fonctionne sans Internet, avec le GPS du téléphone.', src: [src('OpenStreetMap / Mapterhorn', 'https://mapterhorn.com')] });
    add({ id: 'na_osm', fn: 'nav', label: 'Points utiles hors ligne de ma zone (eau, santé, abris, dangers)', crit: 2, auto: 'osm', why: 'Pour trouver le point d\'eau ou la pharmacie la plus proche sans réseau.', src: [src('OpenStreetMap', 'https://www.openstreetmap.org')] });
    add({ id: 'na_papier', fn: 'nav', label: 'Carte papier IGN TOP 25 de ma zone', need: 1, crit: 2, gear: 'G054', why: 'Fonctionne sans batterie.', src: [S_.msb] });
    add({ id: 'na_bouss', fn: 'nav', label: 'Boussole', need: 1, crit: 2, gear: 'G053', why: 'Avec la carte papier, pour les caps donnés par l\'onglet Instant T.', src: [S_.msb] });
    add({ id: 'na_rdv', fn: 'nav', label: 'Point de rendez-vous placé sur la carte', need: 1, crit: 2, auto: 'rdv', why: 'En cas de dispersion de la famille, sans téléphone.', src: [S_.vilaine] });
    // Documents & argent
    add({ id: 'ar_cash', fn: 'arg', label: 'Espèces en petites coupures', need: n * 100, unit: '€', crit: 1, why: 'Distributeurs et cartes en panne pendant le black-out ibérique. Repère : 70–100 €/pers. (BCE) ; la Suède conseille une semaine de dépenses.', src: [S_.ecb, S_.iberia] });
    add({ id: 'ar_docs', fn: 'arg', label: 'Copies des papiers et ordonnances en pochette étanche', crit: 1, gear: 'G077', why: 'Le stress fait oublier : documents regroupés près de la sortie.', src: [S_.ukrstrike, S_.sgdsn] });
    add({ id: 'ar_cles', fn: 'arg', label: 'Double des clés (maison, voiture)', crit: 2, why: 'Évacuation rapide.', src: [S_.sgdsn] });
    add({ id: 'ar_epargne', fn: 'arg', label: 'Épargne de précaution (avant le matériel)', crit: 2, why: 'En crise économique, les liquidités et les revenus protègent plus que le troc.', src: [S_.fin] });
    // Sécurité
    add({ id: 'se_co', fn: 'secu', label: 'Détecteur de monoxyde de carbone (CO)', need: 1, crit: combustion || cold ? 1 : 2, gear: 'G081', why: 'Texas 2021 : plus de 500 intoxications au CO dans un seul comté (four, barbecue, voiture, groupe). La norme EN 50291 ne sonne pas à 30 ppm.', src: [S_.texas, S_.nist] });
    add({ id: 'se_fumee', fn: 'secu', label: 'Détecteur de fumée', need: 1, crit: 1, gear: 'G080', why: 'Bougies et chauffages d\'appoint augmentent le risque d\'incendie (1 mort par bougie en Espagne).', src: [S_.iberia] });
    add({ id: 'se_ext', fn: 'secu', label: 'Extincteur', need: 1, crit: 2, gear: 'G079', why: 'Ne pas dépendre des secours saturés.', src: [S_.sgdsn] });
    add({ id: 'se_coupures', fn: 'secu', label: 'Savoir couper eau, gaz, électricité (emplacements repérés)', crit: 2, why: 'Réflexe d\'évacuation et d\'inondation.', src: [S_.sgdsn] });
    // Évacuation
    add({ id: 'ev_sacs', fn: 'evac', label: 'Sacs d\'évacuation prêts (≥ 80 % cochés)', need: n, crit: 1, auto: 'bags', why: 'Un sac par personne, près de la porte ; la vitesse compte plus que la quantité.', src: [S_.ukrstrike, S_.tpbob] });
    add({ id: 'ev_chaussures', fn: 'evac', label: 'Chaussures solides et lampe au pied du lit', crit: 2, why: 'Verre au sol après une frappe ou un séisme.', src: [S_.ukrstrike] });
    if (P.vehicle) add({ id: 'ev_plein', fn: 'evac', label: 'Réservoir toujours au moins à moitié plein', crit: 2, why: 'Au Texas, plus d\'une heure d\'attente pour l\'essence.', src: [S_.half, S_.texas] });
    if ((+P.floor || 0) === 0 && P.dwelling !== 'appartement') add({ id: 'ev_etage', fn: 'evac', label: 'Accès à un étage ou point haut en cas de crue', crit: 2, why: 'À Valence et dans l\'Ahr, les victimes étaient surtout en rez-de-chaussée, caves et garages.', src: [S_.valence] });
    for (const id of [...(P.lieu || []), ...(P.climat || [])]) {
      const e = (window.ENV_VARIANTS || []).find(x => x.id === id); if (!e) continue;
      (e.add || []).forEach((a, i) => { if (a.priority === 'essentiel') add({ id: `env_${id}_${i}`, fn: 'evac', label: `${a.item} (${e.short || e.name})`, crit: 2, auto: 'env:' + id + ':' + i, why: a.why, src: [src('source', a.src)] }); });
    }
    // Savoirs
    add({ id: 'sv_psc', fn: 'sav', label: 'Formation premiers secours (PSC1 / Gestes qui sauvent / Stop the Bleed) + rappel tous les 6 mois', crit: 1, why: 'Seuls 54,5 % posent encore correctement un garrot 3 à 9 mois après la formation.', src: [S_.patts] });
    add({ id: 'sv_blackout', fn: 'sav', label: 'Exercice « coupure » réalisé (24–48 h, disjoncteur coupé)', crit: 2, why: 'Un matériel jamais testé ne sert pas.', src: [S_.tp, S_.helenemist] });
    add({ id: 'sv_marche', fn: 'sav', label: 'Marche test avec le sac chargé (≥ 2 km)', crit: 2, why: 'Erreur de débutant n° 1 : sac trop lourd, jamais porté.', src: [S_.ceets] });
    add({ id: 'sv_verif', fn: 'sav', label: 'Vérification du kit il y a moins de 6 mois', crit: 2, auto: 'check', why: 'Piles, dates, vêtements de saison.', src: [S_.sgdsn] });
    return { list: L, nuc };
  }

  /* Ce que l'utilisateur possède */
  function ownedFromLines(S, gid) {
    let q = 0;
    for (const b of S.bags) for (const it of b.items) if (it.gearId === gid && it.have) q += +it.qty || 1;
    for (const it of S.homePlan) if (it.gearId === gid && it.have) q += +it.qty || 1;
    return q;
  }
  function stock(S) { let w = 0, k = 0; for (const it of S.inventory) { w += (+it.qty || 0) * (+it.litres || 0); k += (+it.qty || 0) * (+it.kcal || 0); } return { w, k }; }
  function bagsReady(S) { return S.bags.filter(b => b.items.length && b.items.filter(i => i.have).length / b.items.length >= 0.8).length; }
  function autoHave(S, nd, ctx) {
    const a = nd.auto; if (!a) return undefined;
    if (a === 'water') return stock(S).w;
    if (a === 'kcal') return stock(S).k;
    if (a === 'contacts') return S.contacts.length;
    if (a === 'rdv') return (S.points || []).filter(p => p.type === 'rdv').length;
    if (a === 'plan') return !!((S.notes.rdv || '').trim().length > 10 && S.contacts.length);
    if (a === 'bags') return bagsReady(S);
    if (a === 'check') { if (!S.lastCheck) return false; const d = new Date(S.lastCheck); d.setMonth(d.getMonth() + 6); return d > new Date(); }
    if (a === 'pack') return ctx.pack;
    if (a === 'osm') return ctx.osm;
    if (a.startsWith('env:')) { const k = a.slice(4); return S.bags.some(b => b.items.some(i => i.envKey === k && i.have)); }
  }
  function evaluate(S, ctx = {}) {
    S.audit = S.audit || {};
    const { list, nuc } = computeNeeds(S);
    for (const nd of list) {
      const st = S.audit[nd.id] || {};
      nd.na = !!st.na;
      const auto = autoHave(S, nd, ctx), lines = nd.gear ? ownedFromLines(S, nd.gear) : 0;
      if (nd.need == null) { nd.have = st.have != null ? !!st.have : !!auto; nd.ratio = nd.have ? 1 : 0; }
      else { nd.have = st.have != null ? +st.have : (auto !== undefined ? +auto : lines); nd.ratio = Math.min(1, nd.have / nd.need); }
      nd.auto = auto !== undefined; nd.lines = lines; nd.manual = st.have != null;
      nd.status = nd.na ? 'na' : nd.ratio >= 1 ? 'ok' : nd.ratio > 0 ? 'part' : 'miss';
    }
    const act = list.filter(x => !x.na), w = x => ({ 1: 3, 2: 2, 3: 1 })[x.crit];
    const score = act.length ? Math.round(act.reduce((a, x) => a + w(x) * x.ratio, 0) / act.reduce((a, x) => a + w(x), 0) * 100) : 0;
    const vital = act.filter(x => x.crit === 1);
    return { list, nuc, score, vitalOk: vital.filter(x => x.status === 'ok').length, vitalN: vital.length, gaps: act.filter(x => x.status !== 'ok') };
  }

  const ST = { ok: ['✓', 'ok'], part: ['◐', 'part'], miss: ['✗', 'miss'], na: ['–', 'na'] };
  let onlyGaps = false, ctxCache = { pack: false, osm: false };
  async function refreshCtx(S) {
    const hm = S.profile.home;
    if (hm && (hm.lat || hm.lon) && window.SurvivalMap) { try { const c = await SurvivalMap.coverage(hm.lat, hm.lon); ctxCache = { pack: c.packs.length > 0, osm: c.zones.length > 0 }; } catch (e) { } }
    return ctxCache;
  }
  function render(el, S) {
    const R = evaluate(S, ctxCache), G = window.GEAR_BY_ID || {};
    const st = stock(S), n = Math.max(1, (+S.profile.adults || 0) + (+S.profile.children || 0));
    const dW = st.w / (n * (+S.profile.waterL || 4)), dK = st.k / (n * (+S.profile.kcal || 2100));
    const tier = S.profile.tier, offer = g => window.Shop && Shop.offer(g.id, tier);
    const price = g => { const o = offer(g); return o && !o.none ? o.price : g.price_eur || 0; };
    const buy = nd => { const g = nd.gear && G[nd.gear], o = g && offer(g); if (!g) return ''; if (!o) return `<span class="small">${h(g.model || g.name)}</span>`; if (o.none) return ''; return `<a href="${h(o.url)}" target="_blank" rel="noopener sponsored" class="small buy">${h(o.model)} · ≈ ${eur(o.price)}</a>`; };
    const missV = R.gaps.filter(x => x.crit === 1);
    const cost = R.gaps.reduce((a, x) => { const g = x.gear && G[x.gear]; if (!g) return a; return a + (x.need == null ? (x.have ? 0 : 1) : Math.max(0, Math.ceil((x.need - x.have) / (x.per || 1)))) * price(g); }, 0);
    const row = nd => `<tr class="st-${nd.status}">
      <td><span class="stchip ${ST[nd.status][1]}" title="${nd.status}">${ST[nd.status][0]}</span></td>
      <td><b>${h(nd.label)}</b> <span class="chip crit${nd.crit}">${CRIT[nd.crit]}</span><div class="small muted">${h(nd.why)} ${nd.src.map(s => `<a class="src" href="${h(s.u)}" target="_blank" rel="noopener">[${h(s.t)}]</a>`).join(' ')}</div>${buy(nd) ? `<div>${buy(nd)}</div>` : ''}</td>
      <td class="num">${nd.need == null ? '' : `${fr(nd.need, 0)} ${h(nd.unit)}`}</td>
      <td class="num">${nd.need == null
        ? `<label class="small chk"><input type="checkbox" aria-label="Disponible : ${h(nd.label)}" data-aud="${nd.id}" ${nd.have ? 'checked' : ''} ${nd.auto && !nd.manual ? 'data-auto="1"' : ''}> <span>oui</span></label>`
        : `<input type="number" min="0" step="any" aria-label="Quantité disponible : ${h(nd.label)} (${h(nd.unit)})" value="${Math.round(nd.have * 10) / 10}" data-audq="${nd.id}" style="width:6em">`}
        ${nd.auto && !nd.manual ? '<div class="small muted">calculé</div>' : nd.lines && !nd.manual ? '<div class="small muted">d\'après vos sacs/achats</div>' : nd.manual ? `<button class="link small" data-audreset="${nd.id}">auto</button>` : ''}</td>
      <td><button class="link small" data-audna="${nd.id}">${nd.na ? 'réactiver' : 'sans objet'}</button></td></tr>`;
    el.innerHTML = `
    <div class="card">
      <h2>Mon état des lieux matériel</h2>
      <p class="small">Calculé pour <b>votre</b> profil (${n} pers., ${S.profile.days} jours d'autonomie visés${(S.profile.lieu || []).length || (S.profile.climat || []).length ? ', ' + [...(S.profile.lieu || []), ...(S.profile.climat || [])].map(id => ((window.ENV_VARIANTS || []).find(e => e.id === id) || {}).short || id).join(', ') : ''}). Indiquez ce que vous avez ; certains points se calculent seuls (inventaire, sacs, carte, contacts). <a href="#" data-go="profile">Modifier mon profil</a></p>
      <div class="grid kpis">
        <div><div class="muted small">Préparation globale</div><div class="kpi">${R.score} %</div><div class="bar ${R.score < 40 ? 'bad' : R.score < 75 ? 'warn' : ''}"><i style="width:${R.score}%"></i></div></div>
        <div><div class="muted small">Besoins vitaux couverts</div><div class="kpi">${R.vitalOk}/${R.vitalN}</div></div>
        <div><div class="muted small">Autonomie eau / nourriture</div><div class="kpi">${fr(dW)} j <small>/ ${fr(dK)} j</small></div></div>
        <div><div class="muted small">Manques (estimation d'achat)</div><div class="kpi">${R.gaps.length} <small>≈ ${eur(cost)}</small></div></div>
      </div>
      ${R.nuc ? `<p class="small">☢ Site nucléaire le plus proche du domicile : <b>${h(R.nuc.p.name)}</b> à ${fr(R.nuc.d, 0)} km${R.nuc.d <= 20 ? ' — <b>dans le rayon PPI de 20 km</b>' : ''}.</p>` : ''}
    </div>
    ${missV.length ? `<div class="card alertcard"><h3>Manques vitaux à combler d'abord</h3><ul>${missV.map(x => `<li><b>${h(x.label)}</b>${x.need != null ? ` — ${fr(x.have, 0)} / ${fr(x.need, 0)} ${h(x.unit)}` : ''} ${buy(x)}</li>`).join('')}</ul></div>` : '<div class="card"><p>✅ Tous vos besoins vitaux sont couverts.</p></div>'}
    ${!(window.Premium && Premium.isPremium()) ? '' : `<div class="card"><div class="row"><label class="chk"><input type="checkbox" id="audGaps" ${onlyGaps ? 'checked' : ''}> <span>Afficher seulement les manques</span></label>
      <button class="btn ghost" data-act="audcsv">Liste de courses des manques (CSV)</button></div></div>`}
    ${!(window.Premium && Premium.isPremium()) ? `<div class="card">${Premium.lockNote('Le détail des ' + R.list.length + ' besoins calculés pour vous (quantités, statut, justification, sources, liens d\'achat) et la liste de courses font partie de Premium.')}</div>` : FN.map(([id, ic, name]) => {
      const rows = R.list.filter(x => x.fn === id && (!onlyGaps || x.status === 'miss' || x.status === 'part'));
      if (!rows.length) return '';
      const all = R.list.filter(x => x.fn === id && !x.na), ok = all.filter(x => x.status === 'ok').length;
      return `<div class="card"><h3>${ic} ${name} <span class="chip">${ok}/${all.length}</span></h3><div class="tablewrap"><table class="audit"><tr><th></th><th>Besoin</th><th class="num">Nécessaire</th><th class="num">J'ai</th><th></th></tr>${rows.map(row).join('')}</table></div></div>`;
    }).join('')}`;
    const ag = el.querySelector('#audGaps'); if (ag) ag.onchange = e => { onlyGaps = e.target.checked; UI.preserveFocus(el, () => render(el, S)); };
  }
  function gapsCsv(S) {
    const R = evaluate(S, ctxCache), G = window.GEAR_BY_ID || {};
    const rows = [['Priorité', 'Fonction', 'Besoin', 'Nécessaire', 'J\'ai', 'Unité', 'Modèle conseillé', 'Prix indicatif (€)', 'Lien Amazon']];
    R.gaps.sort((a, b) => a.crit - b.crit).forEach(x => {
      const g = x.gear && G[x.gear], o = g && window.Shop && Shop.offer(g.id, S.profile.tier), ok = o && !o.none;
      rows.push([CRIT[x.crit], (FN.find(f => f[0] === x.fn) || [])[2], x.label, x.need == null ? 'oui' : x.need, x.need == null ? (x.have ? 'oui' : 'non') : x.have, x.unit, ok ? o.model : g ? g.model : '', ok ? o.price : g ? g.price_eur : '', ok ? o.url : '']);
    });
    return '﻿' + rows.map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\n');
  }
  window.Needs = { computeNeeds, evaluate, render, refreshCtx, gapsCsv, stock, ownedFromLines, FN };
})();
