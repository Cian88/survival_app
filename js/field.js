/* Savoir de terrain : synthèse de praticiens (FR/EN), de forums spécialisés et de retours d'expérience
   de crises réelles. Recherche du 30/09/2026 — rapports détaillés dans docs/TERRAIN.md.
   Les votes Reddit viennent d'instantanés Wayback Machine (popularité ≠ justesse). */
(function () {
  const R = id => `https://www.reddit.com/r/preppers/comments/${id}/`;
  const OL = t => `https://www.le-projet-olduvai.com/${t}`;
  const W = p => `https://old.reddit.com/r/preppers/wiki/${p}`;
  const U = {
    tp_basics: 'https://theprepared.com/prepping-basics/guides/emergency-preparedness-checklist-prepping-beginners/',
    tp_mantra: 'https://theprepared.com/prepping-basics/guides/sane-prepper-mantra-common-sense-rules/',
    tp_bob: 'https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/',
    tp_water: 'https://theprepared.com/homestead/reviews/best-two-week-emergency-water-storage-containers/',
    tp_filters: 'https://theprepared.com/gear/reviews/portable-water-filters/',
    tp_cold: 'https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/',
    ceets_bag: 'https://ceets.org/go-bag-discret-24-48h-une-checklist-simple-testee-adaptable/',
    ceets_alert: 'https://ceets.org/alerter-les-secours-partout/',
    ceets_water: 'https://ceets.org/potabiliser-leau-sur-le-terrain-ce-qui-marche-sur-quoi-et-comment/',
    volwest_bag: 'https://youtu.be/VJJnlb5AGoU', volwest_water: 'https://youtu.be/XUyKbclfh_I', volwest_wc: 'https://youtu.be/tHat9l_h8wg',
    citoyen_water: 'https://youtu.be/2LSkLW60Phk', citoyen_trauma: 'https://youtu.be/65am-JbMUYE',
    vik_bag: 'https://youtu.be/J-L853T1jfw', vik_co: 'https://youtu.be/omvfv8-Nql4', vik_trauma: 'https://youtu.be/ttzyCTTxGvI',
    vilaine_bag: 'https://youtu.be/V-JmleZvu3U', vilaine_stock: 'https://youtu.be/wd-Y4GNJh_I', vilaine_plan: 'https://youtu.be/tDz_qLqSgcI',
    jcb_bag: 'https://youtu.be/UMSLdGE7oXU', jcb_evac: 'https://youtu.be/df9jHHVh0Ik',
    mouton_water: 'https://youtu.be/ditnKF4tHKU', mouton_city: 'https://youtu.be/npbVU1CIEJE',
    debrouille_stock: 'https://youtu.be/zwm9FkTnv2I', debrouille_evac: 'https://youtu.be/kFpRl2Zt08Y',
    piero: 'https://youtu.be/LzRQdEeOlt0',
    selco: 'https://survivalistprepper.net/surviving-one-year-in-hell-interview-with-selco-of-shtfschool/',
    ferfal_cur: 'http://ferfal.blogspot.com/2016/09/valuable-alternative-currency-in.html',
    ferfal_food: 'http://ferfal.blogspot.com/2016/12/serious-survival-how-much-food-should.html',
    ferfal_arg: 'http://ferfal.blogspot.com/2013/06/what-really-happened-during-argentine.html',
    rawles: 'https://survivalblog.com/precepts/',
    creek: 'https://www.artofmanliness.com/skills/survival/how-to-make-a-bug-out-bag-your-72-hour-emergency-evacuation-survival-kit/',
    stb: 'https://www.stopthebleed.org/',
    cotccc_fake: 'https://www.crisis-medicine.com/counterfeit-tourniquets-are-a-serious-problem/',
    patts: 'https://clinicaltrials.gov/study/NCT03479112',
    ol_power: 'https://www.outdoorlife.com/gear/best-portable-power-stations/',
    nist_co: 'https://www.nist.gov/news-events/news/2013/04/prototype-generators-emit-much-less-carbon-monoxide-nist-finds',
    co_alarm: 'https://www.co-gassafety.co.uk/about-co/alarms-2/',
    wremo: 'https://www.wremo.nz/get-ready/home-ready/emergency-toilets',
    pace: 'https://www.cisa.gov/sites/default/files/2024-10/2024_NCSWICPTE_Leveraging_PACE_Plan_Emergency_Comms_Ecosystems.pdf',
    berkey: 'https://www.purecitydata.org/learn/berkey-water-filter-review',
    ajtmh: 'https://www.ajtmh.org/view/journals/tpmd/103/1/article-p465.xml',
    treeline: 'https://www.treelinereview.com/gearreviews/sawyer-squeeze-water-filter-review',
    byu: 'https://brightspotcdn.byu.edu/b1/4d/75fc449e4ce9843daa701f69faa4/an-approach-to-longer-term-food-storage.SEPT2019.pdf',
    meshtastic: 'https://meshtastic.org/docs/overview/radio-settings/',
  };
  const s = (t, u) => ({ t, u });

  window.FIELD = {
    principles: [
      { theme: 'Philosophie', text: 'Se préparer d\'abord aux crises probables (coupure, tempête, perte d\'emploi, santé), pas au scénario spectaculaire : « Prep for Tuesday, not for doomsday ». Compétences, réseau et épargne passent avant le matériel ; 80 % de planification, 20 % d\'achats.', src: [s('wiki r/preppers', W('doingitright')), s('The Prepared', U.tp_mantra), s('Reddit (112 votes)', R('1fywyp7'))] },
      { theme: 'Paliers', text: '72 h pour le sac, puis 2 semaines à domicile, puis 1 à 3 mois. Les secours organisés arrivent souvent au bout de 3 jours ou plus (Valence, Helene, Ahr).', src: [s('The Prepared', U.tp_basics), s('wiki r/preppers', W('startingout'))] },
      { theme: 'Rester ou partir', text: 'Rester chez soi par défaut ; partir tôt, pour une raison précise, vers une destination connue (proches). La plupart des évacuations sont courtes, locales et en voiture. Le « sac des bois » est largement rejeté.', src: [s('The Prepared', U.tp_basics), s('Vol West', U.volwest_bag), s('Le Projet Olduvai', OL('t11963')), s('Reddit (334 votes)', R('1ervsgc'))] },
      { theme: 'Eau', text: 'Priorité n° 1. ≈ 4 L/pers/j pour boire et l\'hygiène minimale, 11 à 19 L avec l\'hygiène complète. Connaître les réserves cachées (chauffe-eau, chasse d\'eau, baignoire remplie à l\'annonce). Deux moyens de traitement ; filtrer puis désinfecter. Prévoir des seaux pour l\'eau non potable des toilettes.', src: [s('The Prepared', U.tp_water), s('Citoyen Prévoyant', U.citoyen_water), s('Mouton-Résilient', U.mouton_water), s('wiki r/preppers', W('water')), s('Reddit (129 votes)', R('1gua185'))] },
      { theme: 'Nourriture', text: '« Stocker ce qu\'on mange, manger ce qu\'on stocke », rotation premier entré, premier sorti, en ajoutant un peu à chaque course. Au moins 3 jours sans cuisson. Aliments plaisir pour le moral (café, chocolat, épices). Stock profond (riz, blé, légumineuses) : ≈ 30 ans sans oxygène.', src: [s('The Prepared', U.tp_basics), s('La Vilaine Mémère', U.vilaine_stock), s('La Débrouille', U.debrouille_stock), s('Selco', U.selco), s('BYU', U.byu)] },
      { theme: 'Énergie & chaleur', text: 'Frontale par personne et piles standard ; radio à piles ou manivelle ; batterie externe. Petits appareils en USB/12 V plutôt que sur l\'onduleur. Groupe électrogène testé tous les 3 mois, toujours dehors. Au froid : une seule pièce, isolée, avec tente intérieure et bouillottes. Aucune combustion sans détecteur de CO.', src: [s('FerFAL', U.ferfal_food), s('test Outdoor Life', U.ol_power), s('Vik GN', U.vik_co), s('The Prepared', U.tp_cold), s('Reddit', R('1hz1tcl'))] },
      { theme: 'Santé & trauma', text: 'Garrot de marque acheté chez un distributeur agréé (les contrefaçons cassent), pansement compressif, gants, marqueur pour l\'heure de pose. Formation (PSC1, Gestes qui sauvent, Stop the Bleed) et rappel tous les 6 mois : 54,5 % seulement réussissent encore la pose 3 à 9 mois après. Traitements chroniques d\'avance.', src: [s('Vik GN', U.vik_trauma), s('Citoyen Prévoyant', U.citoyen_trauma), s('Crisis Medicine', U.cotccc_fake), s('essai PATTS', U.patts), s('Stop the Bleed', U.stb)] },
      { theme: 'Hygiène', text: 'Les maladies liées à l\'hygiène ont tué autant que les balles pendant le siège décrit par Selco. Toilette à deux seaux (urine / selles + matière sèche), sacs épais, savon, protections périodiques, dès le début de la coupure.', src: [s('Selco', U.selco), s('WREMO (NZ)', U.wremo), s('Vol West', U.volwest_wc)] },
      { theme: 'Communication', text: 'Information et nouvelles des proches manquent avant la nourriture. Radio à piles, numéros sur papier, SMS plutôt qu\'appels, plan de communication PACE (principal / alternatif / contingence / urgence), point de rendez-vous et contact hors zone.', src: [s('CEETS', U.ceets_alert), s('La Vilaine Mémère', U.vilaine_plan), s('CISA (PACE)', U.pace)] },
      { theme: 'Argent', text: 'Épargne de précaution avant le matériel. Espèces en petites coupures (distributeurs et cartes en panne pendant le black-out ibérique). En crise économique, ce sont les liquidités, les revenus et les compétences qui protègent ; le troc n\'a pas remplacé la monnaie en Argentine.', src: [s('wiki r/preppers', W('financial')), s('FerFAL', U.ferfal_arg), s('The Prepared', U.tp_basics)] },
      { theme: 'Discrétion & défense passive', text: '« Homme gris » : sac et tenue civils, pas de look tactique ni camouflage. Stock discret. Maison visiblement occupée. Pas d\'arme ni de couteau visible dans un sac destiné à un centre d\'hébergement.', src: [s('Vik GN', U.vik_bag), s('CEETS', U.ceets_bag), s('FerFAL', U.ferfal_cur), s('wiki r/preppers', W('bags'))] },
      { theme: 'Collectif & moral', text: 'Pas de « loup solitaire » : voisins, entraide, prévoir d\'accueillir des proches. L\'ennui et la déprime arrivent au bout de 2–3 jours : jeux, livres, routines, surtout pour les enfants.', src: [s('The Prepared', U.tp_basics), s('Selco', U.selco), s('FerFAL', U.ferfal_food), s('Reddit (420 votes)', R('123qszo'))] },
      { theme: 'Tester', text: 'Un matériel jamais testé ne sert pas. Marcher avec le sac chargé, faire un week-end de coupure volontaire, chronométrer un départ en 10 minutes, faire le bilan après chaque incident.', src: [s('The Prepared', U.tp_basics), s('CEETS', U.ceets_bag), s('Survivaliste JCB', U.jcb_evac), s('Le Projet Olduvai', OL('t10221'))] },
    ],
    mistakes: [
      s('Sac trop lourd (> 20 % du poids du corps) et jamais porté en marche — sur Olduvai, deux sacs de plus de 30 kg ont fini sur une entorse au 3e km.', OL('t10810')),
      s('Eau calculée pour la boisson seulement ; aucun récipient pour l\'eau non potable des toilettes.', R('1gua185')),
      s('Pas d\'espèces en petites coupures.', R('1fypanz')),
      s('Groupe électrogène sans détecteur de CO, trop près des ouvertures (même à 4,5 m, le CO entre), ou jamais démarré depuis des mois.', U.nist_co),
      s('Se fier à un détecteur de CO pour une exposition faible et longue : la norme EN 50291 ne fait pas sonner à 30 ppm.', U.co_alarm),
      s('Chauffer au four, au barbecue ou avec la voiture dans le garage (Texas 2021 : plus de 500 intoxications au CO dans un seul comté).', 'https://www.houstonchronicle.com/news/houston-weather/article/Long-lines-limited-supply-greet-customers-15957659.php'),
      s('Descendre au garage chercher la voiture pendant une crue (majorité des victimes à Valence, avant l\'alerte).', 'https://www.telemadrid.es/programas/telenoticias-fin-de-semana/Los-garajes-la-trampa-mortal-de-la-DANA-en-Valencia-2-2721347846--20241102025829.html'),
      s('Nourriture impossible à manger sans cuisson, ou jamais goûtée ; stock exposé aux rongeurs.', R('1eus4d4')),
      s('Matériel resté en cartons, radio jamais allumée, toilettes d\'urgence installées trop tard (témoignage après Helene).', 'https://singlegirlsdiy.com/prepping-mistakes-hurricane-helene/'),
      s('Garrot contrefait acheté sur une place de marché : force plus faible, 4 % de casse.', U.cotccc_fake),
      s('Filtre à fibres creuses qui a gelé : il peut être rompu sans signe visible.', U.treeline),
      s('Recontaminer l\'eau filtrée en la stockant dans un récipient ouvert.', U.ajtmh),
      s('Budget matériel élevé sans épargne de précaution ; kits « survival » chers qui déçoivent.', W('doingitright')),
      s('Plan d\'évacuation qui demande plus de 5 minutes de préparation.', R('1dl55x9')),
      s('Relâcher l\'effort : un an après le black-out ibérique, la plupart des bonnes résolutions avaient disparu.', 'https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/'),
    ],
    disagreements: [
      s('Poids du sac : d\'une pochette (Vol West) à 12–14 kg (Piero San Giorgio) ; 10–15 % du poids du corps (JCB, Vilaine Mémère) ou 20 % (The Prepared). L\'écart vient du scénario visé.', U.jcb_bag),
      s('Eau dans le sac : 1 L + filtre (The Prepared) contre 3 L (Creek Stewart, Vik GN).', U.tp_bob),
      s('Dose de Javel : CEETS et Vik GN donnent des doses qui diffèrent du simple au double. L\'onglet Calculateurs part de la concentration de votre flacon.', U.ceets_water),
      s('Rotation de l\'eau : 6 mois (CDC, praticiens francophones) contre 2–3 ans (The Prepared).', U.tp_water),
      s('Troc : a fonctionné pendant le siège décrit par Selco, pas du tout dans la crise argentine (FerFAL). Le type de crise est décisif.', U.ferfal_cur),
      s('Métaux précieux : défendus par J. W. Rawles, jugés peu utiles en crise aiguë par Selco et FerFAL.', U.rawles),
      s('Rural ou urbain : la campagne pour Rawles, l\'isolement vu comme un piège par FerFAL.', U.ferfal_food),
      s('Réchaud butane ou chauffage propane « d\'intérieur » : admis par certains (FerFAL, préparateurs US), risqué pour d\'autres (CO mesuré en espace clos). Aération et détecteur CO dans tous les cas.', U.tp_cold),
      s('112 sans carte SIM : « ça marche » (Vik GN) ou « plus en France » (CEETS). Non tranché : gardez une SIM active.', U.ceets_alert),
      s('Mode avion : pour économiser la batterie, mais à éviter quand on attend le rappel des secours (CEETS).', U.ceets_alert),
      s('Filtres Berkey : populaires chez des praticiens, mais jamais certifiés NSF/ANSI ; ordre d\'arrêt de vente de l\'EPA (12/2022). Préférez un filtre certifié par un tiers.', U.berkey),
      s('Kit de suture, QuikClot, antibiotiques : exclus par The Prepared, retenus par d\'autres. À n\'intégrer qu\'avec formation et avis médical.', U.tp_bob),
      s('Médicaments périmés : acceptables en crise longue pour certains praticiens (hors insuline, adrénaline…), déconseillés par les autorités sanitaires.', 'https://www.doomandbloom.net/straight-talk-about-expiration-dates/'),
    ],
    events: [
      { name: 'Black-out ibérique', when: '28/04/2025 · 12–16 h', lack: 'Information, contact avec les proches, paiement par carte (distributeurs à l\'arrêt, mobile tombé à ≈ 17 % du trafic).', ok: 'Radio à piles (« día de los transistores »), espèces, mise en commun dans l\'immeuble.', err: 'Groupes électrogènes mal utilisés (3 morts), bougie (1 mort), appareils médicaux sans autonomie.', src: [s('ENTSO-E', 'https://www.entsoe.eu/news/2026/03/20/entso-e-publishes-expert-panel-final-report-on-28-april-2025-blackout-in-spain-and-portugal/'), s('Público', 'https://www.publico.es/sociedad/esperabamos-apagon-teniamos-kit-emergencias-dimos-cuenta-era-necesario.html'), s('Nuevaradio', 'https://www.nuevaradio.org/2026/04/27/lecciones-del-apagon-la-relevancia-del-efectivo-el-regreso-de-la-radio-y-el-valor-de-la-desconexion-forzada/')] },
      { name: 'Tempête Uri, Texas', when: 'Février 2021 · heures à jours', lack: 'Chauffage, puis eau (49 % sans eau courante, 52 h en moyenne), magasins et essence.', ok: 'Cuisiner dehors, une seule pièce, partir chez un proche (44 % des départs).', err: 'Chauffage au four, au grill ou à la voiture : 246 morts dont 158 hypothermies ; plus de 500 intoxications au CO dans le comté de Harris.', src: [s('UH Hobby School', 'https://www.uh.edu/hobby/winter2021/index.php'), s('CBS19 / DSHS', 'https://www.cbs19.tv/article/news/local/texas-winter-storm-report-246-people-died-statewide-18-of-those-were-from-east-texas/501-8a1a0907-5293-40f0-a176-4aa6f50b27db')] },
      { name: 'Crues Ahr & Wallonie', when: 'Juillet 2021 · jours à mois', lack: 'Courant, réseau et eau le soir même ; aucune sirène entendue ; pharmacies et ponts détruits.', ok: 'Être à l\'étage ; centres d\'accueil improvisés par les habitants.', err: 'Rester en rez-de-chaussée ou en cave ; personnes dépendantes sans plan d\'évacuation verticale.', src: [s('bpb', 'https://www.bpb.de/kurz-knapp/hintergrund-aktuell/522893/nach-der-flut-an-der-ahr-2021/'), s('MemoriAhr', 'https://ausstellungen.kreuz-rad-loewe.de/memoriahr/feature/erlebnisbericht-a-furth?locale=de')] },
      { name: 'DANA de Valence', when: '29/10/2024 · 233 morts', lack: 'Eau potable, nouvelles des proches ; l\'armée arrive « trois jours après ».', ok: 'Auto-organisation par messageries ; milliers de bénévoles à pied.', err: 'Descendre au garage, rester en rez-de-chaussée, prendre l\'ascenseur, attendre l\'alerte (envoyée à 20 h 11, après la plupart des décès).', src: [s('Público', 'https://www.publico.es/politica/tribunales/mayoria-fallecidos-dana-valencia-murieron-enviase-alerta-generalitat.amp.html'), s('Ara', 'https://es.ara.cat/valencia/autogestion-gobierna-catastrofe-paiporta-no-no-quedarme-casa_1_5189061.html')] },
      { name: 'Ouragan Helene', when: 'Septembre 2024 · eau non potable 53 jours à Asheville', lack: 'Communications (même les lignes fixes), eau potable.', ok: 'Eau stockée et filtre de camping, seaux étiquetés « chasse / filtrée / potable », piles remplaçables, thermomètre alimentaire, voisins.', err: 'Pas de plan de communication, radio jamais allumée, matériel en cartons, toilettes d\'urgence trop tardives.', src: [s('Asheville Watchdog', 'https://avlwatchdog.org/2024-in-review-water-outage-and-restoration-took-center-stage-this-fall-after-helene/'), s('témoignage', 'https://singlegirlsdiy.com/prepping-mistakes-hurricane-helene/'), s('NPR', 'https://www.pbs.org/newshour/nation/north-carolina-residents-support-each-other-in-old-fashioned-ways-after-helene-cuts-power-phones')] },
      { name: 'Ukraine', when: 'Depuis 2022 · coupures répétées, frappes', lack: 'Électricité et chauffage (−14 °C à Kyiv en janvier 2026).', ok: 'Vie calée sur les horaires de courant ; tente intérieure + bouillottes ; bouteilles plastique congelées ; station portable ; « points d\'invincibilité ». Après une frappe : sifflet, masque filtrant, chaussures près du lit, documents près de la sortie, numéros sur papier.', err: 'Briques chauffées sur la gazinière (« efficace mais dangereux ») ; sacs d\'abri trop chargés : « la vitesse compte plus que la quantité ».', src: [s('NPR', 'https://www.wvpe.org/npr-news/2026-01-26/ukrainians-are-sharing-hacks-online-on-how-to-survive-winter-power-cuts'), s('Al Jazeera', 'https://www.aljazeera.com/amp/news/2022/11/26/hold-amid-attacks-kyivans-offer-tips-on-survival-optimism'), s('Euromaidan Press', 'https://euromaidanpress.com/2026/02/26/how-kyiv-residents-engineer-their-own-survival-systems/')] },
      { name: 'Siège de Sarajevo', when: '1992–1996 · 1 425 jours', lack: 'Eau d\'abord, puis combustible, puis nourriture.', ok: 'Chariots à eau, récupération de pluie, poêles et lampes improvisés, partage des inventions.', err: '—', src: [s('Works That Work', 'https://worksthatwork.com/4/improvised-design-in-the-siege-of-sarajevo'), s('Sarajevo 1425', 'https://sarajevo1425.ba/en/the-siege-and-the-numbers/')] },
      { name: 'Crise argentine', when: '2001–2002', lack: 'Accès à l\'épargne (corralito), pouvoir d\'achat.', ok: 'Liquidités en devise forte, revenus, compétences. Les rayons n\'étaient pas vides : la faim venait de la pauvreté.', err: 'Compter sur le troc ou un stock de biens pour remplacer l\'argent.', src: [s('FerFAL', U.ferfal_arg), s('Corralito', 'https://en.wikipedia.org/wiki/Corralito')] },
      { name: 'COVID-19', when: 'Mars 2020 · ≈ 3 semaines de ruée', lack: 'Papier, pâtes, riz, farine ; médicaments courants rationnés.', ok: 'Un stock constitué avant la ruée.', err: 'Acheter pendant la panique.', src: [s('J. of Econometrics', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7447232/'), s('ANSM', 'https://ansm.sante.fr/actualites/covid-19-lansm-prend-des-mesures-pour-favoriser-le-bon-usage-du-paracetamol')] },
      { name: 'Tempêtes 1999 & Ciarán', when: '1999 : jusqu\'à 3 semaines · 2023 : 1,2 M foyers', lack: 'Chauffage, eau des puits (pompes électriques), communications.', ok: 'Gazinière, radio de service public, poêle à bois, accueil chez des voisins.', err: 'Batterie de 720 Wh vidée par la bouilloire ; groupe électrogène coûteux (≈ 30 €/jour de carburant).', src: [s('Infoclimat', 'https://www.infoclimat.fr/historic-details-evenement-143-tempetes-martin-et-lothar-de-decembre-1999.html'), s('France 3', 'https://france3-regions.franceinfo.fr/bretagne/morbihan/tempete-ciaran-la-longue-et-difficile-remise-en-etat-du-reseau-electrique-face-a-l-impatience-des-foyers-sans-courant-2867558.html')] },
      { name: 'Séisme en Turquie', when: '06/02/2023 · 4 h 17', lack: 'Abri chauffé : nuits à −5 °C dans les voitures ou sous des tentes de fortune.', ok: 'Sous les décombres : poche d\'air, eau, protection contre le froid, se signaler par le bruit.', err: '—', src: [s('AFP', 'https://www.gmanetwork.com/news/topstories/world/860240/turkish-quake-survivors-face-big-freeze-in-cars-tents/story/'), s('ABC News', 'https://abcnews.com/Health/people-survive-days-earthquake-rubble-survivors-found-turkey/story?id=97035249')] },
    ],
    drills: [
      { name: 'Week-end black-out', text: 'Couper le disjoncteur général du vendredi soir au dimanche (ou 24 h avec frigo allumé, puis 48 h), noter tout ce qui manque.', src: [s('The Prepared', U.tp_basics), s('Survivaliste JCB', 'https://youtu.be/Y5w7ay6NwWk')] },
      { name: 'Départ en 10 minutes', text: 'La nuit, chronomètre en main : sacs, papiers, animaux, médicaments, couper eau/gaz/électricité.', src: [s('Survivaliste JCB', U.jcb_evac), s('Reddit', R('1dl55x9'))] },
      { name: 'Marche chargée', text: 'Marcher 2 km puis 2 h avec le sac complet ; alléger ce qui n\'a pas servi.', src: [s('CEETS', U.ceets_bag), s('Le Projet Olduvai', OL('t10221'))] },
      { name: 'Coupure d\'eau', text: 'Une journée sans eau du robinet : mesurer la consommation réelle (boisson, cuisine, toilettes).', src: [s('La Vilaine Mémère', 'https://youtu.be/Tk3V6Yuh3Qw')] },
      { name: 'Test de communication', text: 'Appliquer le plan PACE : SMS, radio PMR446, point de rendez-vous, message laissé sur place.', src: [s('CISA', U.pace)] },
    ],
    people: [
      { n: 'The Prepared', u: 'https://theprepared.com', d: 'Guides et tests de matériel très détaillés (EN).' },
      { n: 'David Manise — CEETS', u: 'https://ceets.org/blog/', d: 'Formateur survie et secours (FR/CH/BE).' },
      { n: 'Vol West', u: 'https://www.youtube.com/@lesurvivaliste', d: 'Survivaliste français installé au Montana.' },
      { n: 'Citoyen Prévoyant', u: 'https://www.youtube.com/channel/UCm8-Ft8PdYGiSrB9cY2inDg', d: 'Préparation familiale (FR). Une polémique sur une de ses vidéos de sac est évoquée par une vidéo-réponse (non lue).' },
      { n: 'Vik GN — survik.fr', u: 'https://www.youtube.com/channel/UC4Q2EebrNVAbB6w4PnFGmyw', d: 'Sac civil, trauma, radio (FR).' },
      { n: 'La Vilaine Mémère', u: 'https://www.youtube.com/channel/UCTOcrMtM1piJtSUNXw3tOVg', d: 'Stock familial, plan, exercices (FR).' },
      { n: 'La Débrouille', u: 'https://www.youtube.com/channel/UC3IB9-oymXr2LsMYrkbFLVg', d: 'Survie au quotidien, évacuation urbaine (FR).' },
      { n: 'Mouton-Résilient', u: 'https://mouton-resilient.com/', d: 'Eau, autonomie (FR). Présente des codes promo sur des filtres.' },
      { n: 'Survivaliste JCB', u: 'https://www.youtube.com/channel/UCG8pLFL97ZRFwMPYqOH3jFw', d: 'Exercices chronométrés (Québec).' },
      { n: 'Piero San Giorgio', u: 'https://fr.wikipedia.org/wiki/Piero_San_Giorgio', d: 'Concept de BAD (7 piliers). Controverse documentée sur Wikipédia (proximité avec l\'extrême droite, qu\'il dément).' },
      { n: 'Apprendre Préparer (Sur)vivre', u: 'https://www.youtube.com/@apprendrepreparersurvivre6007', d: 'Voir l\'onglet Notice & infos.' },
      { n: 'Selco (SHTFSchool)', u: 'https://www.shtfschool.com/about/', d: 'Témoignage de guerre en Bosnie ; identité non vérifiable. Conseils sur les armes écartés.' },
      { n: 'FerFAL — Fernando Aguirre', u: 'http://ferfal.blogspot.com/', d: 'Crise argentine de 2001 (EN).' },
      { n: 'Creek Stewart', u: U.creek, d: 'Instructeur, auteur de Build the Perfect Bug Out Bag (EN).' },
      { n: 'J. W. Rawles — SurvivalBlog', u: U.rawles, d: 'Préparation rurale de long terme (EN).' },
      { n: 'Stop the Bleed', u: U.stb, d: 'Formation hémorragies (American College of Surgeons).' },
      { n: 'Forums', u: 'https://old.reddit.com/r/preppers/wiki/index', d: 'r/preppers (wiki, fils les plus votés, via archives), Le Projet Olduvai, Instinct de Survie, Survivalist Boards.' },
    ],
  };

  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const links = arr => arr.map(x => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a>`).join(' · ');
  window.Field = {
    render(el) {
      const F = window.FIELD;
      el.innerHTML = `
      <div class="card"><h2>Savoir de terrain</h2>
        <p class="small">Synthèse de ceux qui pratiquent : une trentaine de praticiens francophones et anglophones (chaînes, blogs, écoles de survie), des forums spécialisés (r/preppers, Le Projet Olduvai, Instinct de Survie, Survivalist Boards) et les témoignages de 11 crises réelles. Chaque point renvoie à ses sources. Les votes de forums mesurent la popularité, pas la justesse. Rapport complet : <code>docs/TERRAIN.md</code>.</p></div>
      <h2>Ce sur quoi les praticiens s'accordent</h2>
      <div class="grid">${F.principles.map(p => `<div class="card"><h3>${esc(p.theme)}</h3><p class="small">${esc(p.text)}</p><p class="src">${links(p.src)}</p></div>`).join('')}</div>
      <div class="card"><h2>Erreurs fréquentes</h2><ul>${F.mistakes.map(m => `<li>${esc(m.t)} <a class="src" href="${esc(m.u)}" target="_blank" rel="noopener">[source]</a></li>`).join('')}</ul></div>
      <div class="card"><h2>Points de désaccord</h2><p class="small muted">Présentés tels quels : à vous de choisir selon votre situation.</p><ul>${F.disagreements.map(m => `<li>${esc(m.t)} <a class="src" href="${esc(m.u)}" target="_blank" rel="noopener">[source]</a></li>`).join('')}</ul></div>
      <h2>Retours d'expérience de crises réelles</h2>
      <div class="grid">${F.events.map(e => `<div class="card"><h3>${esc(e.name)}</h3><div class="small muted">${esc(e.when)}</div>
        <p class="small"><b>A manqué :</b> ${esc(e.lack)}</p><p class="small"><b>A servi :</b> ${esc(e.ok)}</p>${e.err !== '—' ? `<p class="small"><b>Erreurs :</b> ${esc(e.err)}</p>` : ''}<p class="src">${links(e.src)}</p></div>`).join('')}</div>
      <div class="card"><h2>Exercices recommandés</h2><div class="grid">${F.drills.map(d => `<div><h3>${esc(d.name)}</h3><p class="small">${esc(d.text)}</p><p class="src">${links(d.src)}</p></div>`).join('')}</div></div>
      <div class="card"><h2>Sources de praticiens</h2><ul>${F.people.map(p => `<li><a href="${esc(p.u)}" target="_blank" rel="noopener">${esc(p.n)}</a> — <span class="small">${esc(p.d)}</span></li>`).join('')}</ul></div>`;
    },
  };
})();
