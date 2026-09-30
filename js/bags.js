/* Types de sac et quantités de consommables selon la durée d'autonomie.
   - Sac d'évacuation : quitter vite son domicile pour rejoindre un lieu sûr (proches, hébergement, centre d'accueil).
   - Sac de survie : tenir en autonomie en milieu naturel, sans aide extérieure (abri, feu, eau, orientation, outils).
   Les règles de quantité citent leur base ; « hypothèse » signale un choix raisonnable sans source chiffrée. */
(function () {
  const s = (t, u) => ({ t, u });
  const SRC = {
    aps: s('Apprendre Préparer (Sur)vivre — sac d\'évacuation vs sac de survie', 'https://www.youtube.com/watch?v=SlCeW_V7RrY'),
    apsPdf: s('APS — Le sac d\'évacuation d\'urgence (PDF)', 'https://static.apprendre-preparer-survivre.com/leadgen/Apprendre-Preparer-Survivre-GPS-Sac-evacuation-urgence.pdf'),
    tp: s('The Prepared — bug out bag', 'https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/'),
    reddit: s('r/preppers — retour d\'une vraie évacuation (334 votes)', 'https://www.reddit.com/r/preppers/comments/1ervsgc/'),
    creek: s('Creek Stewart — sac 72 h', 'https://www.artofmanliness.com/skills/survival/how-to-make-a-bug-out-bag-your-72-hour-emergency-evacuation-survival-kit/'),
    c10: s('Dave Canterbury — les 10 C', 'https://www.selfrelianceoutfitters.com/blogs/survival-blog/dave-canterbury-s-10-c-s-of-survival'),
    ukr: s('Ukraine — « la vitesse compte plus que la quantité »', 'https://euromaidanpress.com/2026/02/26/how-kyiv-residents-engineer-their-own-survival-systems/'),
    msb: s('MSB (3 L/jour)', 'https://rib.msb.se/filer/pdf/30874.pdf'),
    ecb: s('BCE (espèces)', 'https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html'),
  };
  const ceil = Math.ceil, min = Math.min;
  /* q(d, K) : d = jours, K = kcal/jour du profil. note : base de la règle. */
  const TYPES = {
    evac: {
      name: 'Sac d\'évacuation', icon: '🎒', durations: [1, 2, 3, 5, 7], def: 3,
      purpose: 'Quitter vite son domicile pour rejoindre un lieu sûr (proches, hôtel, centre d\'hébergement) : de quelques heures à quelques jours, le plus souvent en ville, à pied ou en voiture. Priorités : papiers, argent, médicaments, eau, chargeur, vêtements. Sac discret (« homme gris »), léger, prêt près de la porte ; pas d\'arme ni de couteau visible (interdits dans les centres d\'hébergement).',
      src: [SRC.apsPdf, SRC.tp, SRC.reddit, SRC.ukr],
      items: [
        { g: 'G001' }, { g: 'G002' }, { g: 'G003', q: () => 1 },
        { g: 'G004' }, { g: 'G009', q: d => 2 * min(d, 3), note: '≈ 1 L d\'eau portée par jour, plafonné à 3 L (au-delà : traiter l\'eau trouvée) — Creek Stewart, The Prepared' },
        { g: 'G005', q: d => d >= 2 ? 1 : 0, note: 'filtre dès 2 jours' }, { g: 'G007', q: d => ceil(d * 3 / 50), note: 'boîtes de 50 comprimés (1 cp/L) pour 3 L/jour — MSB' },
        { g: 'G015', q: (d, K) => ceil(d * K / 2300), note: 'rations sans cuisson : besoin kcal/jour du profil ÷ 2 300 kcal par boîte NRG-5 (chiffre cité par APS)' },
        { g: 'G016', q: d => d, note: '1 barre par jour (moral, en-cas) — hypothèse' },
        { g: 'G027' }, { g: 'G031' }, { g: 'G034' }, { g: 'G035' }, { g: 'G036' }, { g: 'G037' },
        { g: 'G038', q: d => min(d, 3), note: '1 paire par jour, 3 au plus (on lave) — hypothèse' },
        { c: 'sous_vet', n: 'Sous-vêtements de rechange', cat: 'Vêtements', q: d => min(d, 3), note: 'hypothèse' },
        { g: 'G039' }, { g: 'G041' }, { g: 'G044' }, { g: 'G048' }, { g: 'G051' },
        { g: 'G064' }, { g: 'G065' }, { g: 'G066' }, { g: 'G068' }, { g: 'G070' }, { g: 'G072' },
        { g: 'G074', q: d => ceil(d / 3), note: 'paquets de 60 lingettes, 1 pour 3 jours — hypothèse' }, { g: 'G075' },
        { g: 'G077' }, { g: 'G057' }, { g: 'G061' }, { g: 'G024' },
        { c: 'cash', n: 'Espèces en petites coupures (≈ 70–100 € par personne)', cat: 'Documents/argent', note: 'BCE 2025 ; la Suède conseille une semaine de dépenses', src: SRC.ecb },
        { c: 'docs', n: 'Photocopies des papiers, ordonnances, contacts et plan sur papier', cat: 'Documents/argent' },
        { c: 'cles', n: 'Double des clés (maison, voiture)', cat: 'Documents/argent' },
        { c: 'medic', n: 'Médicaments personnels', cat: 'Santé', q: d => d + 3, unit: 'jours de traitement', note: 'durée du sac + 3 jours de marge — hypothèse' },
        { c: 'chargeur', n: 'Chargeur et câbles du téléphone', cat: 'Énergie' },
      ],
    },
    survie: {
      name: 'Sac de survie', icon: '🏕', durations: [1, 2, 3, 5, 7, 10, 14], def: 3,
      purpose: 'Tenir en autonomie en milieu naturel, loin de toute aide : se protéger du froid et de la pluie, faire du feu, trouver et traiter l\'eau, s\'orienter, réparer. Plus lourd et plus technique que le sac d\'évacuation : il suppose des compétences (feu, abri, navigation). Méthode : privilégier ce qui est difficile à fabriquer dans la nature (les « 10 C » de Dave Canterbury).',
      src: [SRC.aps, SRC.c10, SRC.creek],
      items: [
        { g: 'G001' }, { g: 'G002' }, { g: 'G003', q: () => 2 },
        { g: 'G029' }, { g: 'G028' }, { g: 'G030' }, { g: 'G027' },
        { g: 'G025' }, { g: 'G024' }, { g: 'G026', q: d => ceil(d / 3), note: '3 moyens d\'allumage au moins — Creek Stewart ; quantité : hypothèse' },
        { g: 'G005' }, { g: 'G007', q: d => ceil(d * 4 / 50), note: 'boîtes de 50 (1 cp/L) pour 4 L/jour en activité (repère des praticiens)' },
        { g: 'G008' }, { g: 'G004' },
        { c: 'inox', n: 'Gourde ou gamelle inox simple paroi (va au feu)', cat: 'Eau', note: 'l\'élément le plus négligé selon Dave Canterbury', src: SRC.c10 },
        { g: 'G019' }, { g: 'G022' },
        { g: 'G021', q: d => ceil(d * 1.5 * 20 / 230), note: 'cartouches de 230 g : 1,5 L bouilli par jour × ≈ 13–20 g de gaz par litre (ordre de grandeur non vérifié) — hypothèse' },
        { g: 'G014', q: d => ceil(d * 2 / 10), note: 'packs de 10 repas lyophilisés, 2 repas par jour — hypothèse' },
        { g: 'G016', q: d => 2 * d, note: '2 barres par jour — hypothèse' }, { g: 'G015', q: d => ceil(d / 3), note: 'ration de secours, 1 pour 3 jours — hypothèse' },
        { g: 'G056' }, { g: 'G059' }, { g: 'G060' }, { g: 'G061' }, { g: 'G062' },
        { c: 'aiguille', n: 'Aiguille à voile et fil solide', cat: 'Outils', src: SRC.c10 },
        { c: 'bandana', n: 'Bandana en coton', cat: 'Outils', src: SRC.c10 },
        { g: 'G053' }, { g: 'G054' }, { g: 'G051' }, { g: 'G052' },
        { g: 'G039' }, { g: 'G041', q: d => ceil(d / 5), note: '1 lot de piles par tranche de 5 jours — hypothèse' },
        { g: 'G044' }, { g: 'G045', q: d => d >= 5 ? 1 : 0, note: 'panneau solaire à partir de 5 jours' },
        { g: 'G064' }, { g: 'G065' }, { g: 'G066' },
        { g: 'G071' }, { g: 'G074', q: d => ceil(d / 3), note: 'hypothèse' }, { g: 'G075' },
        { g: 'G032' }, { g: 'G033' }, { g: 'G034' }, { g: 'G035' }, { g: 'G036' }, { g: 'G037' },
        { g: 'G038', q: d => min(d, 4), note: '4 paires au plus (on lave) — hypothèse' },
      ],
    },
  };
  const dLabel = d => d === 1 ? '24 h' : d === 2 ? '48 h' : d === 3 ? '72 h' : d + ' jours';

  function lineFor(rule, d, K, GEAR_BY_ID, uid) {
    const qty = rule.q ? rule.q(d, K) : 1;
    if (rule.g) {
      const g = GEAR_BY_ID[rule.g]; if (!g) return null;
      return { key: uid(), gearId: g.id, rid: rule.g, name: g.name + (g.model ? ' — ' + g.model : ''), category: g.category, qty, weight_g: g.weight_g || 0, price: g.price_eur || 0, have: false, auto: !!rule.q };
    }
    return { key: uid(), rid: rule.c, name: rule.n, category: rule.cat || 'Personnel', qty, unit: rule.unit, weight_g: 0, price: 0, have: false, auto: !!rule.q };
  }
  /* Pré-remplit un sac selon son type et sa durée (sans doublon). */
  function prefill(bag, GEAR_BY_ID, K, uid) {
    const T = TYPES[bag.type || 'evac'], d = bag.days || T.def, have = new Set(bag.items.map(i => i.rid || i.gearId));
    for (const r of T.items) { const id = r.g || r.c; if (have.has(id)) continue; const l = lineFor(r, d, K, GEAR_BY_ID, uid); if (l && l.qty > 0) bag.items.push(l); }
  }
  /* Recalcule les quantités des consommables (lignes « auto ») quand la durée change. */
  function rescale(bag, K, GEAR_BY_ID, uid) {
    const T = TYPES[bag.type || 'evac'], d = bag.days || T.def;
    for (const it of bag.items) {
      if (!it.auto) continue;
      const r = T.items.find(x => (x.g || x.c) === (it.rid || it.gearId)); if (!r || !r.q) continue;
      it.qty = r.q(d, K);
    }
    // Consommables qui deviennent nécessaires avec une durée plus longue (ex. panneau solaire, filtre)
    if (GEAR_BY_ID && bag.items.length) {
      const have = new Set(bag.items.map(i => i.rid || i.gearId));
      for (const r of T.items) if (r.q && !have.has(r.g || r.c) && r.q(d, K) > 0 && r.q(1, K) === 0) { const l = lineFor(r, d, K, GEAR_BY_ID, uid); if (l) bag.items.push(l); }
    }
  }
  const ruleNote = (bag, it) => { const r = TYPES[bag.type || 'evac'].items.find(x => (x.g || x.c) === (it.rid || it.gearId)); return r && r.note; };
  /* Stock maison : consommables proportionnels au foyer et à la durée. */
  const HOME_RULES = {
    G010: { q: (n, d, W) => Math.ceil(n * d * W / 20), note: 'jerricans de 20 L pour l\'eau du foyer (personnes × jours × L/jour)' },
    G012: { q: n => n, note: 'eau en bouteilles pour les 72 premières heures : 6 L par personne (SGDSN)' },
    G007: { q: (n, d) => Math.max(1, Math.ceil(n * d * 3 / 50)), note: 'de quoi traiter 3 L/pers./jour de secours' },
    G073: { q: (n, d) => Math.max(1, Math.ceil(n * d / 14)), note: '1 paquet de 12 rouleaux par personne et par tranche de 14 jours — hypothèse' },
    G075: { q: (n, d) => Math.max(1, Math.ceil(n * d / 10)), note: '1 lot de 10 sacs par personne et par tranche de 10 jours (toilettes de secours) — hypothèse' },
    G021: { q: (n, d) => Math.max(1, Math.ceil(n * d * 1.5 * 20 / 230)), note: 'cartouches de 230 g : 1,5 L bouilli/pers./jour × 13–20 g/L (non vérifié) — hypothèse' },
  };
  window.Bags = { TYPES, SRC, dLabel, prefill, rescale, lineFor, ruleNote, HOME_RULES };
})();
