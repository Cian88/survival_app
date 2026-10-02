/* Catalogue des points utiles OpenStreetMap (téléchargés par zone depuis Overpass, js/map.js).
   Chaque type est décrit une seule fois, dans une syntaxe proche d'Overpass : la requête et le classement des points
   reçus en dérivent tous deux, ils ne peuvent donc pas diverger.
   Filtres : [clé] existe, [clé=valeur], [clé!=valeur], [clé~expression], [clé!~expression]. */
(function (root) {
  const CATS = {
    eau: { label: 'Eau potable et points d\'eau', short: 'Eau', color: '#1f78d1', on: true, note: 'Une fontaine ou une source cartographiée n\'est pas forcément potable : vérifiez sur place, et traitez l\'eau en cas de doute.' },
    eaubrute: { label: 'Eau à traiter (plans d\'eau, réserves incendie)', short: 'Eau à traiter', color: '#5fa8d3', on: false, note: 'Eau non potable : filtrer puis désinfecter. Les bouches et poteaux incendie sont réservés aux secours.' },
    sante: { label: 'Santé (hôpitaux, pharmacies, médecins, défibrillateurs)', short: 'Santé', color: '#d62728', on: true },
    secours: { label: 'Secours (pompiers, police, mairies, points de rassemblement)', short: 'Secours', color: '#9467bd', on: true },
    abri: { label: 'Abris et hébergement (refuges, cabanes, salles, gymnases)', short: 'Abris', color: '#c47b28', on: true, note: 'Salles communales et gymnases servent souvent de centres d\'accueil en cas de crise : suivez les consignes de la mairie.' },
    comm: { label: 'Communication (cabines, bornes d\'appel, postes, antennes)', short: 'Communication', color: '#17becf', on: true },
    transport: { label: 'Évacuation et transports (gares, hélistations, embarcadères)', short: 'Transports', color: '#3f51b5', on: true },
    energie: { label: 'Énergie (stations-service, gaz, recharge, postes électriques)', short: 'Énergie', color: '#e6a100', on: true },
    argent: { label: 'Argent liquide (distributeurs, banques)', short: 'Argent liquide', color: '#8a7a1c', on: false },
    ravito: { label: 'Ravitaillement (alimentation, bricolage, plein air)', short: 'Ravitaillement', color: '#2ca02c', on: false },
    dangers: { label: 'Dangers (industrie à risque, dépôts, zones militaires, barrages)', short: 'Dangers', color: '#111111', on: true },
  };
  // [catégorie, sélecteur, libellé]. Ordre : du plus précis au plus général (le premier type qui correspond donne le libellé).
  const TYPES = [
    ['eau', 'nwr[amenity=drinking_water]', 'Point d\'eau potable'],
    ['eau', 'nwr[amenity=fountain][drinking_water=yes]', 'Fontaine d\'eau potable'],
    ['eau', 'nwr[man_made=water_tap]', 'Robinet'],
    ['eau', 'nwr[amenity=water_point]', 'Point de remplissage d\'eau'],
    ['eau', 'node[natural=spring]', 'Source'],
    ['eau', 'nwr[man_made=spring_box]', 'Captage de source'],
    ['eau', 'nwr[man_made=water_well]', 'Puits'],
    ['eau', 'nwr[amenity=watering_place]', 'Abreuvoir (eau à traiter)'],
    ['eau', 'nwr[man_made=water_tower]', 'Château d\'eau'],
    ['eaubrute', 'nwr[emergency=fire_water_pond]', 'Réserve d\'eau incendie'],
    ['eaubrute', 'nwr[emergency=water_tank]', 'Citerne incendie'],
    ['eaubrute', 'nwr[emergency=suction_point]', 'Point d\'aspiration (pompiers)'],
    ['eaubrute', 'node[emergency=fire_hydrant]', 'Bouche ou poteau incendie'],
    ['eaubrute', 'way[natural=water][water!~^(river|canal|stream|ditch|drain|wastewater|lock|moat)$]', 'Plan d\'eau'],
    ['eaubrute', 'relation[natural=water][water!~^(river|canal|stream|ditch|drain|wastewater|lock|moat)$]', 'Plan d\'eau'],
    ['sante', 'nwr[amenity=hospital][emergency=yes]', 'Hôpital avec urgences'],
    ['sante', 'nwr[amenity=hospital]', 'Hôpital'],
    ['sante', 'nwr[amenity=clinic]', 'Clinique, centre de santé'],
    ['sante', 'nwr[healthcare=centre]', 'Centre de santé'],
    ['sante', 'nwr[amenity=doctors]', 'Médecin'],
    ['sante', 'nwr[healthcare=doctor]', 'Médecin'],
    ['sante', 'nwr[amenity=pharmacy]', 'Pharmacie'],
    ['sante', 'nwr[healthcare=pharmacy]', 'Pharmacie'],
    ['sante', 'nwr[amenity=dentist]', 'Dentiste'],
    ['sante', 'nwr[healthcare=nurse]', 'Infirmier'],
    ['sante', 'nwr[amenity=veterinary]', 'Vétérinaire'],
    ['sante', 'node[emergency=defibrillator]', 'Défibrillateur'],
    ['secours', 'nwr[amenity=fire_station]', 'Pompiers'],
    ['secours', 'nwr[amenity=police]', 'Police, gendarmerie'],
    ['secours', 'nwr[emergency=ambulance_station]', 'Ambulances, SMUR'],
    ['secours', 'nwr[emergency=mountain_rescue]', 'Secours en montagne'],
    ['secours', 'nwr[emergency=coast_guard]', 'Garde-côtes'],
    ['secours', 'nwr[emergency~^(lifeguard|lifeguard_base)$]', 'Poste de secours (baignade)'],
    ['secours', 'nwr[amenity=townhall]', 'Mairie'],
    ['secours', 'nwr[emergency=assembly_point]', 'Point de rassemblement'],
    ['secours', 'node[highway=emergency_access_point]', 'Point de rencontre des secours'],
    ['secours', 'node[emergency=siren]', 'Sirène d\'alerte'],
    ['secours', 'nwr[amenity=ranger_station]', 'Poste de gardes, maison forestière'],
    ['abri', 'nwr[amenity=shelter][shelter_type!~^(public_transport|picnic_shelter|sun_shelter|changing_rooms)$]', 'Abri'],
    ['abri', 'nwr[tourism=alpine_hut]', 'Refuge gardé'],
    ['abri', 'nwr[tourism=wilderness_hut]', 'Cabane, refuge non gardé'],
    ['abri', 'nwr[social_facility=shelter]', 'Centre d\'hébergement'],
    ['abri', 'nwr[amenity=community_centre]', 'Salle communale'],
    ['abri', 'nwr[leisure=sports_hall]', 'Gymnase'],
    ['abri', 'nwr[tourism=camp_site]', 'Camping'],
    ['abri', 'node[natural=cave_entrance]', 'Entrée de grotte'],
    ['comm', 'node[emergency=phone]', 'Borne d\'appel d\'urgence'],
    ['comm', 'node[amenity=telephone]', 'Cabine téléphonique'],
    ['comm', 'nwr[amenity=post_office]', 'Bureau de poste'],
    ['comm', 'nwr[man_made~^(mast|tower)$][communication:mobile_phone=yes]', 'Antenne de téléphonie mobile'],
    ['comm', 'nwr[man_made~^(mast|tower)$][tower:type=communication]', 'Antenne relais (radio, télécoms)'],
    ['transport', 'nwr[railway~^(station|halt)$]', 'Gare'],
    ['transport', 'nwr[amenity=bus_station]', 'Gare routière'],
    ['transport', 'nwr[aeroway=helipad]', 'Hélistation'],
    ['transport', 'nwr[aeroway=aerodrome]', 'Aérodrome'],
    ['transport', 'nwr[amenity=ferry_terminal]', 'Embarcadère'],
    ['energie', 'nwr[amenity=fuel]', 'Station-service'],
    ['energie', 'nwr[shop=gas]', 'Vente de bouteilles de gaz'],
    ['energie', 'nwr[shop=fuel]', 'Vente de combustible (fioul, bois)'],
    ['energie', 'nwr[amenity=charging_station]', 'Borne de recharge électrique'],
    ['energie', 'nwr[power=plant]', 'Centrale électrique'],
    ['energie', 'nwr[power=substation][substation!~^(minor_distribution|distribution)$]', 'Poste électrique haute tension'],
    ['argent', 'nwr[amenity=atm]', 'Distributeur de billets'],
    ['argent', 'nwr[amenity=bank]', 'Banque'],
    ['argent', 'nwr[amenity=bureau_de_change]', 'Bureau de change'],
    ['ravito', 'nwr[shop=supermarket]', 'Supermarché'],
    ['ravito', 'nwr[shop=convenience]', 'Épicerie'],
    ['ravito', 'nwr[shop=general]', 'Commerce général'],
    ['ravito', 'nwr[shop=bakery]', 'Boulangerie'],
    ['ravito', 'nwr[shop=butcher]', 'Boucherie'],
    ['ravito', 'nwr[shop=greengrocer]', 'Primeur'],
    ['ravito', 'nwr[shop=farm]', 'Vente à la ferme'],
    ['ravito', 'nwr[amenity=marketplace]', 'Marché'],
    ['ravito', 'nwr[shop=department_store]', 'Grand magasin'],
    ['ravito', 'nwr[shop~^(hardware|doityourself)$]', 'Quincaillerie, bricolage'],
    ['ravito', 'nwr[shop=outdoor]', 'Magasin de plein air'],
    ['ravito', 'nwr[shop~^(hunting|fishing)$]', 'Chasse et pêche'],
    ['ravito', 'nwr[shop=chemist]', 'Droguerie, hygiène'],
    ['ravito', 'nwr[shop=agrarian]', 'Fournitures agricoles'],
    ['ravito', 'node[amenity=vending_machine][vending~(water|drinks|food)]', 'Distributeur (eau, boissons, nourriture)'],
    ['dangers', 'nwr[industrial=refinery]', 'Raffinerie'],
    ['dangers', 'nwr[industrial=chemical]', 'Industrie chimique'],
    ['dangers', 'nwr[industrial~^(oil|gas|fuel|petroleum_terminal)$]', 'Site hydrocarbures ou gaz'],
    ['dangers', 'nwr[man_made=storage_tank][content~(oil|gas|fuel|chemical|petroleum)]', 'Réservoir d\'hydrocarbures ou de produits chimiques'],
    ['dangers', 'nwr[man_made=gasometer]', 'Gazomètre'],
    ['dangers', 'nwr[man_made=petroleum_well]', 'Puits de pétrole'],
    ['dangers', 'nwr[military~^(danger_area|range)$]', 'Zone de tirs militaires'],
    ['dangers', 'nwr[landuse=military]', 'Terrain militaire'],
    ['dangers', 'nwr[waterway=dam]', 'Barrage'],
    ['dangers', 'nwr[hazard]', 'Danger signalé'],
    // Le plus général en dernier : un camping ou un abri avec de l'eau potable reste un camping ou un abri.
    ['eau', 'node[drinking_water=yes]', 'Eau potable disponible'],
  ];

  /* ---------- Sélecteurs : vers Overpass et vers un test sur les étiquettes ---------- */
  function parse(sel) {
    const m = /^(node|way|relation|nwr)((?:\[[^\]]+\])+)$/.exec(sel);
    if (!m) throw new Error('sélecteur invalide : ' + sel);
    const filters = [...m[2].matchAll(/\[([^\]]+)\]/g)].map(([, f]) => {
      const x = /^([^=!~]+?)(?:(=|!=|~|!~)(.*))?$/.exec(f);
      return { k: x[1], op: x[2] || 'has', v: x[3] };
    });
    return { kind: m[1], filters };
  }
  const q = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  function overpass({ kind, filters }) {
    return kind + filters.map(f => f.op === 'has' ? `[${q(f.k)}]` : `[${q(f.k)}${f.op}${q(f.v)}]`).join('');
  }
  function test({ kind, filters }, el) {
    if (kind !== 'nwr' && el.type && el.type !== kind) return false;
    const t = el.tags || {};
    return filters.every(({ k, op, v }) => {
      const x = t[k];
      if (op === 'has') return x != null;
      if (op === '=') return x === v;
      if (op === '!=') return x !== v;
      if (op === '~') return x != null && new RegExp(v).test(x);
      return x == null || !new RegExp(v).test(x); // !~ : absent ou différent, comme Overpass
    });
  }
  const PARSED = TYPES.map(([cat, sel, label]) => ({ cat, sel, label, p: parse(sel) }));

  /* Requête Overpass pour les catégories choisies, dans une emprise [sud, ouest, nord, est]. */
  function query(cats, bbox, timeout = 120) {
    const bb = bbox.join(','), parts = PARSED.filter(t => cats.includes(t.cat)).map(t => overpass(t.p) + `(${bb});`);
    return `[out:json][timeout:${timeout}];(${parts.join('')});out center tags qt;`;
  }
  /* Type d'un élément reçu, parmi les catégories demandées (dans l'ordre du catalogue) ; null s'il n'en relève d'aucune. */
  function classify(el, cats) {
    for (const t of PARSED) if ((!cats || cats.includes(t.cat)) && test(t.p, el)) return t;
    return null;
  }
  /* Libellé lisible d'un point déjà enregistré (y compris ceux classés par une version précédente). */
  const typeLabel = el => { const t = classify(el, null); return t ? t.label : ''; };

  /* Détails utiles d'un point, en français. */
  const yes = v => ({ yes: 'oui', no: 'non', limited: 'limité', customers: 'clients', private: 'privé', permissive: 'toléré', designated: 'oui' }[v] || v);
  const DETAILS = [
    ['opening_hours', 'Horaires'], ['phone', 'Téléphone'], ['contact:phone', 'Téléphone'], ['emergency', 'Urgences', v => v === 'yes' ? 'oui' : null],
    ['drinking_water', 'Eau potable', yes], ['drinking_water:legal', 'Potabilité contrôlée', yes], ['seasonal', 'Saisonnier', yes], ['access', 'Accès', yes],
    ['fee', 'Payant', yes], ['capacity', 'Capacité'], ['beds', 'Places'], ['fireplace', 'Cheminée, poêle', yes], ['water_source', 'Origine de l\'eau'],
    ['fuel:diesel', 'Gazole', yes], ['fuel:octane_95', 'SP95', yes], ['fuel:lpg', 'GPL', yes], ['self_service', 'Libre-service', yes], ['automated', 'Automate', yes],
    ['operator', 'Exploitant'], ['wheelchair', 'Accès fauteuil', yes], ['ele', 'Altitude', v => v + ' m'], ['description', 'Description'], ['note', 'Note'],
  ];
  function details(el) {
    const t = el.tags || {}, out = [];
    for (const [k, label, f] of DETAILS) if (t[k] != null) { const v = f ? f(t[k]) : t[k]; if (v != null && !(k === 'contact:phone' && t.phone)) out.push([label, v]); }
    return out;
  }

  const api = { CATS, TYPES, query, classify, typeLabel, details, parse, overpass, test, defaults: () => Object.keys(CATS).filter(k => CATS[k].on) };
  root.OsmPoints = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
