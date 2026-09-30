/* Calculateurs pratiques. Formules et hypothèses issues de sources de praticiens et de tests
   indépendants (voir liens). Les hypothèses non sourcées sont signalées comme telles. */
(function () {
  const L = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
  const fr = (n, d = 1) => (isFinite(n) ? n : 0).toLocaleString('fr-FR', { maximumFractionDigits: d });
  const SRC = {
    prepared_water: L('https://theprepared.com/homestead/reviews/best-two-week-emergency-water-storage-containers/', 'The Prepared (2025)'),
    sphere: L('https://ksrpmi.uns.ac.id/wp-content/uploads/2019/09/Sphere-Handbook-2018-WATER-SUPPLY.pdf', 'Sphere 2018'),
    msf: L('https://medicalguidelines.msf.org/en/viewport/CHOL/english/3-3-supply-of-safe-water-23448821.html', 'MSF'),
    cdc: L('https://www.cdc.gov/water-emergency/about/index.html', 'CDC'),
    ol: L('https://www.outdoorlife.com/gear/best-portable-power-stations/', 'test Outdoor Life (2025)'),
    ogl: L('https://www.outdoorgearlab.com/topics/camping-and-hiking/best-portable-solar-panel', 'test OutdoorGearLab (2026)'),
    pvgis: L('https://re.jrc.ec.europa.eu/pvg_tools/fr/', 'PVGIS (Commission européenne)'),
    bu: L('https://www.batteryuniversity.com/article/bu-410-charging-at-high-and-low-temperatures/', 'Battery University BU-410'),
    twdb: L('https://www.twdb.texas.gov/publications/brochures/conservation/doc/RainwaterHarvestingManual_3rdedition.pdf', 'TWDB (Texas)'),
    mdpi: L('https://www.mdpi.com/2073-4441/16/10/1421', 'Water, MDPI 2024'),
    appro: L('https://www.appropedia.org/Basic_rainwater_collection_calculations', 'Appropedia'),
    naismith: L('https://www.ukhillwalking.com/articles/skills/how_to_calculate_route_times_using_naismiths_rule-7777', 'règle de Naismith-Langmuir'),
    byu: L('https://brightspotcdn.byu.edu/b1/4d/75fc449e4ce9843daa701f69faa4/an-approach-to-longer-term-food-storage.SEPT2019.pdf', 'BYU (2019)'),
    sphere_food: L('https://emergency.unhcr.org/sites/default/files/2024-05/SphereFS+N.pdf', 'Sphere/UNHCR'),
    prepared_basics: L('https://theprepared.com/prepping-basics/guides/emergency-preparedness-checklist-prepping-beginners/', 'The Prepared'),
    bob: L('https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/', 'The Prepared (bug out bag)'),
    jcb: L('https://youtu.be/UMSLdGE7oXU', 'Survivaliste JCB'),
    vilaine: L('https://youtu.be/V-JmleZvu3U', 'La Vilaine Mémère'),
    amc: L('https://www.outdoors.org/resources/amc-outdoors/outdoor-resources/why-does-my-canister-stove-fail-in-cold-weather/', 'AMC'),
  };
  // Stock « 1 adulte, 1 an » d'après le tableau BYU (converti en kg par la recherche)
  const BYU = [['Blé', 60], ['Riz blanc', 29.5], ['Légumineuses', 28], ['Sucre', 32], ['Avoine', 13], ['Flocons de pomme de terre', 10], ['Pâtes', 9.5], ['Lait écrémé en poudre', 22], ['Sel iodé', 3.6], ['Levure chimique', 1.8], ['Bicarbonate', 0.45]];

  const CALCS = [
    { id: 'eau', title: 'Réserve d\'eau', html: `
      <label>Personnes <input id="c_e_p" type="number" min="1" value="2"></label>
      <label>Jours <input id="c_e_d" type="number" min="1" value="14"></label>
      <label>Contenants déclarés (L) <input id="c_e_c" type="number" min="0" value="0"></label>`,
      calc: v => {
        const a = v.c_e_p * v.c_e_d * 3.8, b = v.c_e_p * v.c_e_d * 15;
        return `<b>${fr(a, 0)} L</b> en base « préparateur » (≈ 3,8 L/pers/j, boisson + hygiène minimale) · <b>${fr(b, 0)} L</b> en base humanitaire (15 L/pers/j, qui limite aussi les épidémies).
        ${v.c_e_c ? `<br>Vos contenants couvrent ${fr(v.c_e_c / a * 100, 0)} % de la base préparateur.` : ''}`;
      }, src: () => `Deux écoles : ${SRC.prepared_water} (1 gallon/pers/j) et ${SRC.sphere} / ${SRC.msf} (15–20 L/j). Contenants : PEHD alimentaire opaque, à l'écart du béton et des produits chimiques (The Prepared). Rotation : 6 mois selon CDC/FEMA, 2–3 ans selon The Prepared ; valeur prudente 6–12 mois.` },

    { id: 'chlore', title: 'Désinfection au chlore (eau de Javel)', html: `
      <label>Concentration indiquée sur l'étiquette (% chlore actif) <input id="c_c_pct" type="number" min="0.1" step="0.1" value="2.6"></label>
      <label>Volume d'eau (L) <input id="c_c_v" type="number" min="0.1" step="0.1" value="10"></label>
      <label><input id="c_c_t" type="checkbox"> Eau trouble</label>`,
      calc: v => {
        const drop = 0.05; // mL par goutte, approximation
        const perL = mgL => mgL / (v.c_c_pct * 10 * drop);
        const k = v.c_c_t ? 2 : 1, lo = perL(3.5) * v.c_c_v * k, hi = perL(6.3) * v.c_c_v * k;
        return `Environ <b>${fr(lo, 0)} à ${fr(hi, 0)} gouttes</b> pour ${fr(v.c_c_v)} L (≈ ${fr(lo / v.c_c_v * drop, 2)}–${fr(hi / v.c_c_v * drop, 2)} mL/L). Mélanger, attendre <b>30 min</b> (60 min si l'eau est basique). Une légère odeur de chlore doit persister.`;
      }, src: () => `Calcul, pas une consigne officielle : la fourchette reproduit les doses de ${SRC.prepared_water} (5 gouttes de Javel à 5,25 % par gallon ≈ 3,5 mg/L) et du ${SRC.cdc} (8 gouttes à 5–9 % par gallon ≈ 6 mg/L), rapportées à la concentration de votre flacon. Hypothèse : 1 goutte ≈ 0,05 mL (une seringue graduée est plus précise). Javel <b>non parfumée</b> uniquement. Temps de contact : ${SRC.msf}. Les praticiens divergent (CEETS et Vik GN donnent des doses qui diffèrent du simple au double) : en cas de doute, préférez des pastilles dosées et leur notice.` },

    { id: 'batt', title: 'Autonomie d\'une batterie / station électrique', html: `
      <label>Capacité nominale (Wh) <input id="c_b_wh" type="number" min="1" value="1024"></label>
      <label>Consommation de l'appareil (W) <input id="c_b_w" type="number" min="0.1" step="0.1" value="40"></label>
      <label>Sortie <select id="c_b_o"><option value="dc">USB / 12 V</option><option value="acs">Prise 230 V, petite charge (&lt; 100 W)</option><option value="acm">Prise 230 V, charge moyenne (≥ 300 W)</option></select></label>
      <label>Autoconsommation de l'onduleur (W, sortie 230 V) <input id="c_b_i" type="number" min="0" value="10"></label>`,
      calc: v => {
        const eta = { dc: 0.9, acs: 0.65, acm: 0.85 }[v.c_b_o], load = v.c_b_w + (v.c_b_o === 'dc' ? 0 : v.c_b_i);
        const hrs = v.c_b_wh * eta / load;
        return `≈ <b>${fr(hrs)} h</b> (${fr(hrs / 24)} j) — rendement retenu ${Math.round(eta * 100)} %.${v.c_b_o !== 'dc' ? ' Astuce : pour les petits appareils, passez par l\'USB ou le 12 V et coupez l\'onduleur.' : ''}`;
      }, src: () => `Rendements mesurés sur la sortie 230 V : 62–70 % sur petite charge, 83–90 % sur charge moyenne ; onduleur ≈ 10 W à vide (EcoFlow Delta 2) — ${SRC.ol}. Rendement USB/12 V de 90 % : hypothèse. Ne pas recharger une batterie lithium sous 0 °C (${SRC.bu}).` },

    { id: 'solaire', title: 'Recharge solaire nomade', html: `
      <label>Puissance du panneau (W) <input id="c_s_w" type="number" min="1" value="100"></label>
      <label>Heures de soleil équivalent plein (h/j) <input id="c_s_h" type="number" min="0" step="0.1" value="2.5"></label>`,
      calc: v => {
        const wh = v.c_s_w * v.c_s_h * 0.75;
        return `≈ <b>${fr(wh, 0)} Wh/jour</b> par beau temps (facteur 0,75). Par temps couvert, beaucoup moins.`;
      }, src: () => `En test, les panneaux ont fourni 70–91 % de leur puissance annoncée (${SRC.ogl}) ; 0,75 est une hypothèse prudente. Trouvez les heures de soleil de votre commune, mois par mois (l'hiver compte), sur ${SRC.pvgis}.` },

    { id: 'pluie', title: 'Récupération d\'eau de pluie', html: `
      <label>Surface de toit projetée (m²) <input id="c_p_s" type="number" min="1" value="80"></label>
      <label>Pluie (mm) <input id="c_p_mm" type="number" min="0" step="0.1" value="10"></label>`,
      calc: v => `≈ <b>${fr(v.c_p_s * v.c_p_mm * 0.8, 0)} L</b> collectés. Écarter d'abord le « premier flot » : au moins <b>${fr(v.c_p_s * 0.41, 0)} L</b>, davantage après une longue période sèche ou sous des arbres. <b>Toujours traiter</b> avant de boire.`,
      src: () => `Formule ${SRC.appro} ; coefficient de ruissellement 0,8 (toit dur) : hypothèse non vérifiée. Premier flot : ${SRC.twdb} (≈ 0,41 L/m²), jugé parfois insuffisant par ${SRC.mdpi}.` },

    { id: 'poids', title: 'Poids maximal du sac', html: `
      <label>Poids du porteur (kg) <input id="c_w_kg" type="number" min="10" value="75"></label>
      <label>Poids actuel du sac (kg) <input id="c_w_bag" type="number" min="0" step="0.1" value="0"></label>`,
      calc: v => {
        const a = v.c_w_kg * 0.10, b = v.c_w_kg * 0.15, c = Math.min(v.c_w_kg * 0.20, 20.4), d = Math.min(v.c_w_kg * 0.30, 27.2);
        const st = !v.c_w_bag ? '' : v.c_w_bag <= b ? ' — ✅ dans la zone prudente' : v.c_w_bag <= c ? ' — ⚠ au-delà de 15 % : testez-le sur une longue marche' : ' — ❌ au-delà de 20 % : allégez';
        return `Prudent : <b>${fr(a)}–${fr(b)} kg</b> (10–15 %) · plafond courant : <b>${fr(c)} kg</b> (20 %, max 20,4 kg) · personne très entraînée : ${fr(d)} kg (30 %)${st}`;
      }, src: () => `10–15 % : ${SRC.jcb}, ${SRC.vilaine} ; 20 % du poids du corps ou 45 lb (le plus bas des deux), 30 % si très actif : ${SRC.bob}. Les praticiens divergent selon le scénario (quelques heures vers un proche, ou plusieurs jours de marche). Dans tous les cas : tester le sac en marchant.` },

    { id: 'marche', title: 'Temps de marche (évacuation, retour à pied)', html: `
      <label>Distance (km) <input id="c_m_d" type="number" min="0" step="0.1" value="25"></label>
      <label>Dénivelé positif (m) <input id="c_m_up" type="number" min="0" value="300"></label>
      <label>Allure sur le plat (km/h) <input id="c_m_v" type="number" min="1" step="0.1" value="4.5"></label>`,
      calc: v => {
        const t = v.c_m_d / v.c_m_v + v.c_m_up / 600;
        return `≈ <b>${Math.floor(t)} h ${String(Math.round((t % 1) * 60)).padStart(2, '0')}</b> de marche effective, hors pauses et hors descente raide. Avec un sac chargé et de la fatigue, comptez large.`;
      }, src: () => `${SRC.naismith} : 5 km/h (ajustable ici) + 1 h par 600 m de montée. Les guides de préparateurs comptent ≈ 4,8 km/h pour un retour à pied.` },

    { id: 'stock', title: 'Stock alimentaire profond (base BYU)', html: `
      <label>Adultes <input id="c_f_a" type="number" min="1" value="2"></label>
      <label>Durée (mois) <input id="c_f_m" type="number" min="1" value="3"></label>`,
      calc: v => {
        const f = v.c_f_a * v.c_f_m / 12;
        return `<table>${BYU.map(([n, kg]) => `<tr><td>${n}</td><td class="num">${fr(kg * f)} kg</td></tr>`).join('')}<tr><td>Huile</td><td class="num">${fr(7.6 * f)} L</td></tr></table>
        <p class="small">Énergie à prévoir : ${fr(v.c_f_a * v.c_f_m * 30.4 * 2100, 0)} kcal (2 100 kcal/j, Sphere) — minimum ${fr(v.c_f_a * v.c_f_m * 30.4 * 1640, 0)} kcal (≈ 1 640 kcal/j, The Prepared).</p>`;
      }, src: () => `Tableau « 1 adulte, 1 an » de ${SRC.byu}, au prorata. Riz, blé, pâtes, légumineuses : ≈ 30 ans en boîtes ou sachets sans oxygène au frais ; huiles : environ 1 an. Calories : ${SRC.sphere_food} et ${SRC.prepared_basics}. Humidité ≤ 10 % avant tout conditionnement sans oxygène (botulisme) ; pas d'absorbeur d'O₂ avec le sucre ou le sel ; Mylar dans un seau (les rongeurs le percent). Les légumineuses anciennes demandent plus de cuisson, donc plus de combustible.` },

    { id: 'gaz', title: 'Réchaud à cartouche par temps froid', html: `
      <label>Température extérieure (°C) <input id="c_g_t" type="number" value="2"></label>`,
      calc: v => {
        const t = v.c_g_t;
        const ok = g => t > g ? '✅' : '❌';
        return `${ok(-0.5)} Butane (≥ −0,5 °C) · ${ok(-12)} Isobutane (≥ −12 °C) · ${ok(-42)} Propane (≥ −42 °C). ${t <= 0 ? 'Gardez la cartouche au chaud (contre vous) avant usage.' : ''}`;
      }, src: () => `Températures de vaporisation d'après ${SRC.amc}. Jamais de casserole plus large que le réchaud sur un réchaud « valise » : la cartouche surchauffe (rappels Santé Canada).` },
  ];

  function read(card) {
    const v = {};
    card.querySelectorAll('input, select').forEach(i => { v[i.id] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? (parseFloat(i.value) || 0) : i.value; });
    return v;
  }
  window.Calc = {
    render(el) {
      el.innerHTML = `<div class="card"><h2>Calculateurs</h2><p class="small">Outils de dimensionnement à partir de sources de praticiens et de tests indépendants. Les hypothèses sont indiquées sous chaque calcul. Les résultats sont des ordres de grandeur, pas des garanties.</p></div>
      <div class="grid">${CALCS.map(c => `<div class="card calc" data-calc="${c.id}"><h3>${c.title}</h3><div class="row">${c.html}</div><div class="calcout alert"></div><p class="src">${c.src()}</p></div>`).join('')}</div>`;
      el.querySelectorAll('.calc').forEach(card => {
        const c = CALCS.find(x => x.id === card.dataset.calc), out = card.querySelector('.calcout');
        const run = () => { out.innerHTML = c.calc(read(card)); };
        card.addEventListener('input', run); card.addEventListener('change', run); run();
      });
    },
  };
})();
