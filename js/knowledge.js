/* Contenu documentaire sourcé. Chaque recommandation renvoie à une source (clé de SOURCES).
   Recherche effectuée le 30/09/2026. Vérifiez les mises à jour des sources officielles. */
window.SOURCES = {
  sgdsn: { t: 'SGDSN — Guide « Tous responsables » (publié le 20/11/2025)', u: 'https://www.sgdsn.gouv.fr/files/files/Publications/Guide_Tous%20responsables.pdf' },
  georisques: { t: 'Géorisques — risques de mon adresse / kit d\'urgence 72 h', u: 'https://www.georisques.gouv.fr/me-preparer-me-proteger/mon-kit-durgence-72h' },
  crf: { t: 'Croix-Rouge française — sac d\'urgence (Catakit) et gestes de premiers secours', u: 'https://www.croix-rouge.fr/sac-durgence-et-trousse-de-secours-croix-rouge-francaise' },
  crf_ac: { t: 'Croix-Rouge française — Arrêt cardiaque', u: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/arret-cardiaque' },
  asnr: { t: 'ASNR — La distribution d\'iode (maj 24/01/2025)', u: 'https://reglementation-controle.asnr.fr/autres-activites/situations-d-urgence/la-distribution-d-iode' },
  ue: { t: 'UE — Stratégie pour une Union de la préparation, JOIN(2025) 130 (26/03/2025)', u: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:52025JC0130' },
  bbk: { t: 'BBK (Allemagne) — « Vorsorgen für Krisen und Katastrophen », 2e éd. 11/2025', u: 'https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/ratgeber-notfallvorsorge.pdf?__blob=publicationFile' },
  bwl: { t: 'OFAE/BWL (Suisse) — Provisions de secours (13/10/2025)', u: 'https://www.bwl.admin.ch/en/we-advise-emergency-supplies' },
  msb: { t: 'MSB (Suède) — « In case of crisis or war », éd. 11/2024', u: 'https://rib.msb.se/filer/pdf/30874.pdf' },
  fi: { t: 'Pelastustoimi (Finlande) — Emergency supplies (72 h)', u: 'https://pelastustoimi.fi/en/home-everyday-life/accident-prevention/emergency-supplies' },
  be: { t: 'Centre de crise (Belgique) — Kit d\'urgence à la maison', u: 'https://centredecrise.be/fr/que-pouvez-vous-faire/preparez-un-kit-durgence/un-kit-durgence-la-maison' },
  ready: { t: 'Ready.gov (FEMA, USA) — Build a Kit', u: 'https://www.ready.gov/kit' },
  oms: { t: 'OMS — Technical Note 9 « How much water is needed in emergencies » (2013)', u: 'https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf' },
  cdc_eau: { t: 'CDC — How to Make Water Safe in an Emergency (19/09/2024)', u: 'https://www.cdc.gov/water-emergency/about/index.html' },
  cdc_filtre: { t: 'CDC — Water treatment options when hiking, camping or traveling (30/01/2025)', u: 'https://www.cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html' },
  brc_hypo: { t: 'British Red Cross — Hypothermia', u: 'https://www.redcross.org.uk/first-aid/learn-first-aid/hypothermia' },
  radiofrance: { t: 'Radio France — convention avec le ministère de l\'Intérieur (16/10/2025)', u: 'https://www.radiofrance.com/presse/radio-france-et-le-ministere-de-linterieur-reaffirment-le-role-vital-de-la-radio-de-service' },
};

/* Piliers de l'écosystème domestique : items recommandés (cases à cocher) */
window.PILLARS = [
  { id: 'eau', name: 'Eau', icon: '💧', why: 'Priorité n°1 du guide SGDSN (« Boire et manger »). Stock minimal de boisson : 2 L/pers/j (BBK, Finlande) à 3 L/pers/j (Suède, Suisse). L\'OMS estime 7,5 à 15 L/pers/j pour boire, cuisiner et l\'hygiène de base.', src: ['sgdsn', 'bbk', 'msb', 'bwl', 'oms'], items: [
    'Eau en bouteilles : 6 L/personne minimum pour 72 h (SGDSN)',
    'Réserve étendue selon l\'objectif (calculateur ci-dessous)',
    'Pastilles de désinfection de l\'eau (« en dernier recours », SGDSN)',
    'Filtre à eau (pores ≤ 0,3 µm : bactéries + parasites, CDC) + désinfection chimique ensuite',
    'Moyen de faire bouillir (1 min, 3 min au-dessus de ~2 000 m, CDC)',
    'Jerricans / bidons alimentaires à couvercle pour eau non potable (hygiène, WC)',
    'Rotation : renouveler l\'eau stockée 1 à 2 fois par an (MSB)'] },
  { id: 'nourriture', name: 'Nourriture', icon: '🥫', why: 'Aliments de longue conservation, sans cuisson ou à cuisson rapide. Référence énergétique : ~2 200 kcal/pers/j (BBK/BLE), ~2 300 kcal/j (Finlande).', src: ['sgdsn', 'bbk', 'fi', 'bwl'], items: [
    'Conserves (légumes, poisson, viande, plats cuisinés)',
    'Féculents secs : riz, pâtes, flocons, biscottes',
    'Huile, sucre/miel, sel, café, thé',
    'Fruits secs, noix, chocolat, barres',
    'Lait UHT / fromage à pâte dure / lait infantile si bébé',
    'Nourriture pour animaux',
    'Ouvre-boîte manuel',
    'Rotation « premier entré, premier sorti » (vérification 2×/an, SGDSN)'] },
  { id: 'energie', name: 'Énergie, chaleur, lumière', icon: '🔥', why: 'Principe n°2 du guide SGDSN : « Avoir chaud ». Prévoir lumière et énergie indépendantes du réseau, et la sécurité CO en cas de chauffage d\'appoint.', src: ['sgdsn', 'bbk', 'msb'], items: [
    'Lampe(s) + piles de rechange, frontale',
    'Bougies, allumettes, briquets',
    'Batterie externe (powerbank) chargée',
    'Source de recharge autonome (panneau solaire / dynamo / station électrique)',
    'Réchaud (camping ou gaz) + combustible',
    'Vêtements chauds (laine), couvertures, sacs de couchage, couvertures de survie',
    'Chauffage d\'appoint non électrique + combustible (usage aéré)',
    'Détecteur de monoxyde de carbone (CO) (BBK)'] },
  { id: 'sante', name: 'Santé & premiers secours', icon: '⛑', why: 'Principe n°3 du guide SGDSN : « Se soigner ». Suède : garder un mois de traitement chronique à la maison.', src: ['sgdsn', 'bbk', 'msb', 'crf'], items: [
    'Traitements habituels (idéalement 1 mois, MSB) + ordonnances en copie',
    'Trousse : pansements, compresses, désinfectant, bandes, gants jetables, ciseaux, pince',
    'Garrot tourniquet + formation (SGDSN recommande de se former au garrot)',
    'Antalgiques / antipyrétiques, antidiarrhéiques, solutés de réhydratation, thermomètre',
    'Lunettes de rechange, appareils (auditifs…) et piles',
    'Masques (Suisse : 50 par personne)',
    'Comprimés d\'iode si vous habitez près d\'une centrale (sur ordre du préfet uniquement)',
    'Formation premiers secours (PSC1 ou équivalent)'] },
  { id: 'hygiene', name: 'Hygiène & assainissement', icon: '🧼', why: 'Sans eau courante, les toilettes deviennent un enjeu sanitaire. BBK et MSB recommandent sacs solides dans la cuvette + sciure/litière.', src: ['bbk', 'msb', 'sgdsn'], items: [
    'Savon, gel hydroalcoolique, dentifrice',
    'Papier toilette, lingettes',
    'Sacs poubelle solides + liens (WC de secours)',
    'Sciure ou litière, seau à couvercle / toilette de camping',
    'Désinfectant (eau de Javel non parfumée)',
    'Protections hygiéniques, couches si besoin'] },
  { id: 'comm', name: 'Information & communication', icon: '📻', why: 'La radio reste le canal de crise : Radio France (Ici, France Info, France Inter) a une convention d\'alerte avec le ministère de l\'Intérieur.', src: ['radiofrance', 'sgdsn', 'msb'], items: [
    'Radio à piles / manivelle / solaire + piles',
    'Liste papier des numéros importants',
    'Fréquences locales de « Ici » (ex-France Bleu) notées',
    'Téléphone + chargeur + batterie externe',
    'Talkies-walkies PMR446 (portée locale, sans licence) — optionnel',
    'Sifflet (signalisation, Ready.gov)'] },
  { id: 'docs', name: 'Documents & argent', icon: '📄', why: 'SGDSN : photocopies des papiers et ordonnances en pochette étanche, double des clés, argent liquide en cas de panne des distributeurs. Suède : liquide pour au moins une semaine.', src: ['sgdsn', 'msb', 'bwl'], items: [
    'Photocopies des pièces d\'identité, ordonnances, assurances (pochette étanche)',
    'Double des clés maison + voiture',
    'Argent liquide en petites coupures (objectif : 1 semaine, MSB)',
    'Carte bancaire / cartes vitale / carnet de santé (copies)',
    'Copie chiffrée des documents sur clé USB (optionnel)'] },
  { id: 'securite', name: 'Sécurité & outillage', icon: '🧯', why: 'Prévention incendie (BBK, MSB) et outils de base pour se confiner ou réparer (Ready.gov).', src: ['bbk', 'msb', 'ready', 'sgdsn'], items: [
    'Détecteur de fumée (obligatoire en France dans les logements)',
    'Extincteur + couverture anti-feu',
    'Couteau multifonction, outils de base, adhésif (duct tape)',
    'Bâche plastique + adhésif (se calfeutrer, Ready.gov)',
    'Clé/pince pour couper eau et gaz (Ready.gov)',
    'Gants de travail, masque anti-poussière'] },
  { id: 'plan', name: 'Plan, savoirs & entraide', icon: '🧭', why: 'Le guide SGDSN insiste sur le réseau d\'entraide (voisins, personnes isolées), la formation et le Plan individuel de mise en sûreté (PIMS).', src: ['sgdsn', 'georisques'], items: [
    'Connaître les risques de son adresse (georisques.gouv.fr)',
    'Plan familial : points de rendez-vous, contacts, qui récupère qui',
    'PIMS (plan individuel de mise en sûreté) rédigé',
    'Carte papier de la région + boussole (MSB pour l\'évacuation)',
    'Réseau d\'entraide : voisins, personnes isolées identifiées',
    'Formation premiers secours + exercices réguliers',
    'Livres, jeux (moral, SGDSN)'] },
];

/* Réflexes par scénario (guide SGDSN sauf mention) */
window.SCENARIOS = [
  { id: 'alerte', name: 'Alerte générale (sirène, FR-Alert)', src: ['sgdsn'], steps: [
    'Se mettre à l\'abri dans le bâtiment le plus proche ; ne pas rester dans un véhicule.',
    'S\'éloigner des fenêtres, ne pas allumer de flamme.',
    'Écouter la radio (Ici, France Info, France Inter) et suivre les consignes.',
    'Éviter de téléphoner (laisser les réseaux aux secours), privilégier les SMS.',
    'Ne pas aller chercher les enfants à l\'école : ils sont pris en charge.',
    'Ne sortir qu\'à la fin d\'alerte (son continu de 30 s) ou sur consigne.'] },
  { id: 'nucleaire', name: 'Accident nucléaire', src: ['sgdsn', 'asnr'], steps: [
    'Se mettre à l\'abri dans un bâtiment en dur, fermer portes et fenêtres, calfeutrer.',
    'Couper ventilation et climatisation.',
    'Ne pas toucher d\'objets ni consommer d\'aliments exposés à l\'extérieur.',
    'Prendre l\'iode UNIQUEMENT sur ordre du préfet (idéalement quelques heures avant les rejets, au plus tard 8 h après).',
    'Posologie iodure de potassium 65 mg (ASNR) : dès 12 ans 2 cp ; 3–12 ans 1 cp ; 1 mois–3 ans ½ cp ; < 1 mois ¼ cp.',
    'Rayon PPI des centrales françaises : 20 km depuis la campagne 2019-2020 (ASNR).'] },
  { id: 'inondation', name: 'Inondation', src: ['sgdsn'], steps: [
    'Ne pas prendre la voiture ; ne pas s\'engager sur une route inondée.',
    'Ne pas descendre dans les sous-sols ou parkings.',
    'Monter à pied dans les étages, emporter le kit 72 h.',
    'Couper électricité et gaz si possible sans danger.',
    'Suivre vigicrues.gouv.fr et la radio.'] },
  { id: 'feu', name: 'Feu de forêt', src: ['sgdsn'], steps: [
    'Se confiner dans un bâtiment en dur, boucher les aérations.',
    'Se couvrir le visage d\'un linge humide.',
    'Ne pas sortir sauf ordre d\'évacuation ; ne pas bloquer l\'accès des secours.'] },
  { id: 'attentat', name: 'Attaque terroriste', src: ['sgdsn'], steps: ['S\'échapper si possible.', 'Sinon se cacher, silence total, téléphone en silencieux.', 'Alerter (17 / 112 / SMS 114) quand on est en sécurité.', 'Résister en dernier recours.'] },
  { id: 'coupure', name: 'Coupure électrique prolongée', src: ['bbk', 'msb'], steps: [
    'Radio à piles/manivelle pour l\'information.',
    'Se regrouper dans une pièce, se couvrir (laine, couvertures).',
    'Chauffage d\'appoint uniquement aéré, éteindre avant de dormir ; détecteur de CO.',
    'Limiter l\'ouverture du réfrigérateur/congélateur, consommer d\'abord le frais.',
    'Économiser les batteries : mode avion, luminosité minimale.'] },
  { id: 'evacuation', name: 'Évacuation', src: ['sgdsn', 'msb', 'bbk'], steps: [
    'Attendre l\'ordre des autorités pour évacuer (SGDSN).',
    'Prendre le sac d\'évacuation, papiers, médicaments, argent liquide, chargeur.',
    'Couper eau, gaz, électricité ; fermer à clé.',
    'Suivre les itinéraires indiqués ; carte papier et boussole (MSB).',
    'Informer vos proches du lieu de destination (plan familial).'] },
  { id: 'hypothermie', name: 'Hypothermie (personne en froid)', src: ['brc_hypo'], steps: [
    'Signes : frissons, pâleur, confusion, respiration lente ; < 35 °C.',
    'Mettre à l\'abri, isoler du sol, remplacer les vêtements mouillés, couvrir la tête.',
    'Appeler les secours (15 / 112).',
    'Boissons chaudes et aliments énergétiques si la personne est consciente. Pas d\'alcool.'] },
  { id: 'arret', name: 'Arrêt cardiaque (adulte)', src: ['crf_ac'], steps: [
    'Appeler le 15 ou 18 (112), demander un défibrillateur (DAE).',
    'Compressions au centre de la poitrine : 5 à 6 cm, ~100/min.',
    'Alterner 30 compressions / 2 insufflations si formé ; sinon compressions seules.',
    'Utiliser le DAE dès qu\'il arrive, suivre ses instructions.'] },
];

window.KEYINFO = {
  numbers: [['112', 'Numéro d\'urgence européen (gratuit, dans toute l\'UE)'], ['15', 'SAMU — urgence médicale'], ['18', 'Pompiers'], ['17', 'Police / gendarmerie'], ['114', 'Urgence par SMS / appli (sourds, malentendants, ou alerter en silence)'], ['196', 'Urgence en mer']],
  alert: 'Signal national d\'alerte (France) : 3 séquences de 1 min 41 s séparées par 5 s de silence. Fin d\'alerte : son continu de 30 s. Test le 1er mercredi de chaque mois. Barrages : signal « corne de brume » (cycles de 2 min, 2 s d\'émission / 3 s de pause). FR-Alert : notification sonore sur les téléphones de la zone, sans application. (SGDSN)',
  radio: 'Radios de service en crise (convention Radio France – ministère de l\'Intérieur, 15/10/2025) : Ici (ex-France Bleu, 44 locales), France Info, France Inter. Notez votre fréquence locale à l\'avance.',
  water: [
    'Ébullition : 1 minute à gros bouillons (3 minutes au-dessus d\'environ 2 000 m). (CDC)',
    'Eau de Javel non parfumée 5–9 % : 8 gouttes par gallon (3,785 L), soit ~2 gouttes/L ; doubler si l\'eau est trouble ; attendre 30 min. (CDC) ⚠ La Javel grand public française est souvent à 2,6 % : ne pas appliquer ce dosage sans l\'ajuster ; préférez des pastilles dosées et suivez la notice du fabricant.',
    'Filtres : pores ≤ 1 µm arrêtent les parasites ; ≤ 0,3 µm bactéries + parasites ; seuls l\'osmose inverse ou une désinfection chimique/UV traitent les virus. Recommandation : filtrer PUIS désinfecter. (CDC)',
    'Iode de traitement d\'eau : déconseillé aux femmes enceintes et en cas de maladie thyroïdienne. (CDC)',
    'Besoins (OMS) : 2,5–3 L/j pour survivre ; 7,5–15 L/j avec hygiène et cuisine de base.'],
  websites: [['georisques.gouv.fr', 'https://www.georisques.gouv.fr'], ['vigicrues.gouv.fr', 'https://www.vigicrues.gouv.fr'], ['vigilance.meteofrance.fr', 'https://vigilance.meteofrance.fr'], ['info.gouv.fr/risques', 'https://www.info.gouv.fr/risques'], ['Radio France (fréquences)', 'https://www.radiofrance.fr']],
  rule3: 'La « règle des 3 » (3 min sans air, 3 h sans abri par conditions hostiles, 3 jours sans eau, 3 semaines sans nourriture) est un repère empirique très répandu dans la communauté survivaliste. Aucune source institutionnelle ne la formalise : utilisez-la pour hiérarchiser, pas comme une donnée médicale.',
};

/* Chaîne « Apprendre Préparer (Sur)vivre » : synthèse ajoutée après analyse (voir docs/SOURCES.md) */
window.APS = window.APS || null;
