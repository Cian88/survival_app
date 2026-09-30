/* Variantes du sac d'évacuation selon l'environnement (lieu × climat), recherche du 30/09/2026.
   Sources : praticiens (The Prepared, PGHM, Club Alpin Suisse, ANENA, FFRandonnée, formateurs…) et références
   médicales ou de secours (Wilderness Medical Society, UIAA MedCom, OMS, Santé publique France, ARS, Météo-France).
   Chaque point porte l'URL de sa source (src). Rapport complet : docs/ENVIRONNEMENTS.md */
window.ENV_VARIANTS = [
{
"id": "ville",
"axis": "lieu",
"name": "Ville / milieu urbain dense",
"summary": "Densité, immeubles et dépendance totale aux réseaux (électricité, eau, paiement). Le sac urbain privilégie la protection contre fumées/poussières/verre, la mobilité à pied, l'argent liquide et l'accès à l'eau, plutôt que le bivouac.",
"risks": [
{
"t": "Incendie d'immeuble : la fumée tue plus que le feu ; une cage d'escalier enfumée est un piège ; l'ascenseur est proscrit.",
"src": "https://www.croix-rouge.fr/dossiers/incendies"
},
{
"t": "Évacuation par escaliers longue : chaussures inadaptées, congestion, personnes à mobilité réduite ralentissent tout le monde (étude WTC).",
"src": "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5335a3.htm"
},
{
"t": "Verre brisé, gravats, bouches d'égout ouvertes après séisme/explosion/tempête (retours de praticiens).",
"src": "https://theprepared.com/forum/thread/urban-bugging-out/"
},
{
"t": "Mouvements de foule : risque d'écrasement quand la densité dépasse ~4–5 personnes/m² [non vérifié : page source non lisible].",
"src": "https://www.gkstill.com/Support/crowd-density/CrowdDensity-1.html"
},
{
"t": "Îlot de chaleur urbain : jusqu'à +10 °C en centre-ville lors des vagues de chaleur, nuits sans récupération (Paris jusqu'à +6,5 °C).",
"src": "https://www.notre-environnement.gouv.fr/actualites/breves/article/pourquoi-fait-il-plus-chaud-en-ville-qu-a-la-campagne"
},
{
"t": "Panne électrique = paiements électroniques, DAB et applications hors service (blackout ibérique d'avril 2025 : dépenses par carte -41 à -42 %).",
"src": "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html"
},
{
"t": "Dépendance aux réseaux : pompage de l'eau, ascenseurs, chauffage dépendent de l'électricité (retour d'expérience Argentine).",
"src": "https://ferfal.blogspot.com/search/label/blackout"
},
{
"t": "Parkings souterrains et sous-sols pendant une crue : pièges mortels (32 des 214 victimes de la DANA de Valence retrouvées dans des garages au 18/11/2024).",
"src": "https://www.losreplicantes.com/articulos/mas-mitad-muertos-dana-comunidad-valenciana-casas-garajes/"
},
{
"t": "Pillages/violences : redoutés par des praticiens (témoignage relayé du séisme chilien de 2010), mais jugés rares par la sociologie des catastrophes — sources divergentes.",
"src": "https://hazards.colorado.edu/uploads/basicpage/peek-et-al2021sociology-of-disasters.pdf"
}
],
"add": [
{
"item": "Masque FFP2 + lunettes étanches",
"why": "Fumées d'incendie et poussières de décombres ; le FFP2 filtre les particules mais pas le CO ni les gaz.",
"category": "Santé",
"priority": "essentiel",
"src": "https://www.youtube.com/watch?v=UATgy7o9CWM"
},
{
"item": "Gants de travail robustes",
"why": "Déplacer verre et gravats, ouvrir des passages sans se couper.",
"category": "Outils",
"priority": "essentiel",
"src": "https://theprepared.com/forum/thread/urban-bugging-out/"
},
{
"item": "Chaussures fermées de marche (portées ou attachées au sac)",
"why": "Les chaussures inadaptées ont ralenti l'évacuation du WTC ; en ville l'évacuation se fait surtout à pied.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5335a3.htm"
},
{
"item": "Lampe frontale + piles",
"why": "Escaliers et couloirs sans éclairage, coupures de courant ; mains libres.",
"category": "Éclairage",
"priority": "essentiel",
"src": "https://ferfal.blogspot.com/search/label/blackout"
},
{
"item": "Espèces en petites coupures (70–100 €/personne)",
"why": "Terminaux de paiement et DAB inopérants lors d'un blackout.",
"category": "Documents/Argent",
"priority": "essentiel",
"src": "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html"
},
{
"item": "Clé de robinet de façade (clé « silcock » / carré)",
"why": "Ouvrir certains robinets extérieurs d'immeubles pour s'approvisionner en eau.",
"category": "Eau",
"priority": "optionnel",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
},
{
"item": "Pastilles ou filtre + carte des fontaines publiques repérées",
"why": "L'eau du réseau peut s'arrêter ; repérer à l'avance fontaines et points d'eau du quartier.",
"category": "Eau",
"priority": "recommandé",
"src": "https://www.youtube.com/watch?v=2dzly83NJyU"
},
{
"item": "Radio à piles",
"why": "Recevoir les consignes quand téléphone/Internet sont saturés ou coupés.",
"category": "Communication",
"priority": "recommandé",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
}
],
"lighten": [
{
"item": "Matériel de bivouac lourd (tente, hache, scie)",
"why": "Les praticiens urbains visent plutôt un hébergement (proches, hôtel, centre d'accueil) qu'un camp en forêt.",
"src": "https://theprepared.com/forum/thread/urban-bugging-out/"
}
],
"quantities": [
{
"t": "Eau dans le sac : ~1 L (base The Prepared) ; réserve de survie : 2,5–3 L/pers./jour pour boire et manger, variable selon climat.",
"src": "https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf"
},
{
"t": "Argent liquide : 70–100 € par membre du foyer ou de quoi couvrir ~72 h (recommandations NL/AT/FI relayées par la BCE).",
"src": "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html"
}
],
"reflexes": [
{
"t": "Sortir par les escaliers, jamais par l'ascenseur ; fermer les portes derrière soi sans les verrouiller.",
"src": "https://www.croix-rouge.fr/dossiers/incendies"
},
{
"t": "Si la cage d'escalier est enfumée : rester chez soi, porte fermée, calfeutrer avec des linges humides, se signaler à une fenêtre.",
"src": "https://www.croix-rouge.fr/dossiers/incendies"
},
{
"t": "En crue : ne jamais descendre dans un parking souterrain ou un sous-sol, ne pas utiliser ascenseurs et portes automatiques.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Repérer à l'avance les fontaines et points d'eau du quartier.",
"src": "https://www.youtube.com/watch?v=2dzly83NJyU"
},
{
"t": "En canicule, chercher un lieu frais ou climatisé : la ville ne se refroidit pas la nuit.",
"src": "https://www.notre-environnement.gouv.fr/actualites/breves/article/pourquoi-fait-il-plus-chaud-en-ville-qu-a-la-campagne"
},
{
"t": "Garder de l'argent liquide sur soi ; ne pas compter sur la carte.",
"src": "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html"
},
{
"t": "Éviter les zones de forte densité de foule et les goulets [non vérifié : page source non lisible].",
"src": "https://www.gkstill.com/Support/crowd-density/CrowdDensity-1.html"
}
],
"mistakes": [
{
"t": "Prendre l'ascenseur pendant un incendie.",
"src": "https://www.croix-rouge.fr/dossiers/incendies"
},
{
"t": "Évacuer en chaussures de ville ou à talons.",
"src": "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5335a3.htm"
},
{
"t": "Descendre au parking pour « sauver la voiture » pendant une inondation.",
"src": "https://www.losreplicantes.com/articulos/mas-mitad-muertos-dana-comunidad-valenciana-casas-garajes/"
},
{
"t": "Ne compter que sur la carte bancaire ou le paiement mobile.",
"src": "https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html"
},
{
"t": "Se préparer seulement au pillage : la sociologie des catastrophes montre surtout de l'entraide (à confronter aux témoignages de praticiens).",
"src": "https://hazards.colorado.edu/uploads/basicpage/peek-et-al2021sociology-of-disasters.pdf"
}
],
"short": "Ville"
},
{
"id": "campagne",
"axis": "lieu",
"name": "Campagne / plaine / périurbain",
"summary": "Distances, coupures longues du réseau électrique aérien, zones blanches, eau de puits non contrôlée, tiques, chasse et feux de cultures. Le sac vise l'autonomie de plusieurs jours et la mobilité sur de longues distances.",
"risks": [
{
"t": "Coupures électriques longues et routes coupées après tempête (1999 : 3,5 millions de foyers privés d'électricité).",
"src": "https://www.infoclimat.fr/historic-details-evenement-143-tempetes-martin-et-lothar-de-decembre-1999.html"
},
{
"t": "Eau de puits, de forage ou de pluie : non potable a priori car non contrôlée.",
"src": "https://www.occitanie.ars.sante.fr/les-reseaux-prives"
},
{
"t": "Tiques et maladie de Lyme lors des activités en nature.",
"src": "https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme"
},
{
"t": "Zones blanches de réseau mobile : les appels d'urgence peuvent échouer.",
"src": "https://www.ffrandonnee.fr/randonner-en-zone-blanche"
},
{
"t": "Chasse et battues : risque de tir accidentel pour les piétons peu visibles.",
"src": "https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse"
},
{
"t": "Feux de végétation et de cultures en été sec ; 9 feux sur 10 sont d'origine humaine.",
"src": "https://www.pompiers.fr/feux-foret/"
},
{
"t": "Orages sur terrain dégagé : foudre (grandes étendues sans relief, arbres isolés).",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
}
],
"add": [
{
"item": "Tire-tique + vêtements longs",
"why": "Retirer une tique tôt limite la transmission ; couvrir bras et jambes.",
"category": "Santé",
"priority": "essentiel",
"src": "https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme"
},
{
"item": "Filtre ou pastilles de traitement de l'eau",
"why": "Puits et sources sont non potables a priori.",
"category": "Eau",
"priority": "essentiel",
"src": "https://www.occitanie.ars.sante.fr/les-reseaux-prives"
},
{
"item": "Vêtement ou brassard orange fluo",
"why": "Être visible des chasseurs en période de chasse.",
"category": "Vêtements",
"priority": "recommandé",
"src": "https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse"
},
{
"item": "Sifflet + couverture de survie",
"why": "Se signaler et se protéger du froid si l'on est bloqué loin de tout.",
"category": "Signalisation",
"priority": "recommandé",
"src": "https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver"
},
{
"item": "Carte papier + boussole",
"why": "Se repérer quand le réseau et le GPS du téléphone font défaut.",
"category": "Navigation",
"priority": "recommandé",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
},
{
"item": "Radio à piles",
"why": "S'informer en coupure longue.",
"category": "Communication",
"priority": "recommandé",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
}
],
"lighten": [
{
"item": "Clé de robinet d'immeuble (clé silcock)",
"why": "Accessoire utile surtout en milieu urbain.",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
}
],
"quantities": [
{
"t": "Prévoir l'eau de boisson (2,5–3 L/pers./jour) sans compter sur le puits tant qu'il n'est pas traité.",
"src": "https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf"
},
{
"t": "Autonomie : prévoir plusieurs jours de coupure (retour d'expérience des tempêtes de 1999).",
"src": "https://www.infoclimat.fr/historic-details-evenement-143-tempetes-martin-et-lothar-de-decembre-1999.html"
}
],
"reflexes": [
{
"t": "S'inspecter après chaque sortie (plis, aine, arrière des genoux, cuir chevelu) et retirer toute tique rapidement.",
"src": "https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme"
},
{
"t": "Considérer toute eau de puits ou de forage comme non potable tant qu'elle n'est pas analysée ou traitée.",
"src": "https://www.occitanie.ars.sante.fr/les-reseaux-prives"
},
{
"t": "Vérifier la couverture réseau de l'itinéraire ; en zone de faible couverture, alerter par SMS au 114.",
"src": "https://www.ffrandonnee.fr/randonner-en-zone-blanche"
},
{
"t": "Porter des couleurs vives et rester sur les sentiers en période de chasse.",
"src": "https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse"
},
{
"t": "Orage : quitter les étendues dégagées et s'éloigner des arbres isolés.",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
},
{
"t": "Ne pas fumer ni faire de feu près des champs et broussailles secs.",
"src": "https://www.pompiers.fr/feux-foret/"
}
],
"mistakes": [
{
"t": "Boire l'eau d'un puits ou d'une source sans traitement.",
"src": "https://www.occitanie.ars.sante.fr/les-reseaux-prives"
},
{
"t": "Traverser une zone de battue en vêtements sombres.",
"src": "https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse"
},
{
"t": "S'abriter sous un arbre isolé pendant un orage.",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
},
{
"t": "Compter uniquement sur le téléphone pour appeler les secours en zone blanche.",
"src": "https://www.ffrandonnee.fr/randonner-en-zone-blanche"
}
],
"short": "Campagne / plaine"
},
{
"id": "montagne",
"axis": "lieu",
"name": "Montagne (moyenne et haute)",
"summary": "Météo qui change vite, froid qui augmente avec l'altitude, UV intenses, isolement et absence de réseau, avalanches l'hiver, mal aigu des montagnes au-delà de 2 500 m. Le sac ajoute coupe-vent et isolant même en été, protection solaire, moyens d'alerte hors réseau et, sur neige, le trio DVA-pelle-sonde.",
"risks": [
{
"t": "Orages et crues l'après-midi ; changements de météo rapides.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "Température : en moyenne -0,65 °C par 100 m d'altitude ; il peut faire froid en altitude même par temps chaud en vallée.",
"src": "https://www.infoclimat.fr/lexique-definition-165-gradient-thermique-vertical.html"
},
{
"t": "UV : environ +10 % par 1 000 m d'altitude ; la neige réfléchit jusqu'à 80 % des UV.",
"src": "https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-(uv)"
},
{
"t": "Avalanches : 126 accidents et 21 morts en France sur la saison 2024-2025.",
"src": "https://anena.org/accidents/archives-et-donnees-daccidents-davalanche-en-france/"
},
{
"t": "Ensevelissement : 90 % de chances de survie si la victime est dégagée dans les 15 premières minutes, puis chute rapide.",
"src": "https://www.franceinfo.fr/environnement/evenements-meteorologiques-extremes/avalanches/en-cas-d-avalanche-tout-se-joue-dans-le-premier-quart-d-heure_2059762.html"
},
{
"t": "Mal aigu des montagnes au-delà de 2 500 m (symptômes en 4 à 12 h) ; œdèmes pulmonaire et cérébral possibles.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
},
{
"t": "Absence de réseau mobile dans de nombreux secteurs.",
"src": "https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/"
},
{
"t": "Vallées isolées par des crues torrentielles : routes et ponts détruits (tempête Alex, 2020).",
"src": "https://www.varactu.fr/tempete-alex-cinq-ans-apres-les-vallees-de-la-roya-et-de-la-vesubie-toujours-en-attente/"
},
{
"t": "Foudre sur crêtes et sommets.",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
}
],
"add": [
{
"item": "Coupe-vent imperméable + doudoune ou polaire, même en été",
"why": "Le froid et le vent arrivent vite en altitude.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"item": "Lunettes de soleil, casquette, crème solaire",
"why": "Les UV augmentent avec l'altitude et la réverbération de la neige.",
"category": "Santé",
"priority": "essentiel",
"src": "https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-(uv)"
},
{
"item": "Couverture de survie + sifflet + téléphone chargé (112)",
"why": "Kit minimal pour attendre les secours.",
"category": "Signalisation",
"priority": "essentiel",
"src": "https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver"
},
{
"item": "Balise de détresse (PLB) ou communicateur satellite",
"why": "Alerter sans réseau mobile ; avoir deux moyens d'alerte.",
"category": "Communication",
"priority": "recommandé",
"src": "https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/"
},
{
"item": "Batterie externe",
"why": "Garder le téléphone opérationnel pour l'alerte ; le froid vide les batteries.",
"category": "Énergie",
"priority": "recommandé",
"src": "https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/"
},
{
"item": "DVA + pelle + sonde (terrain enneigé hors domaine sécurisé), avec formation",
"why": "Le trio indispensable pour une recherche en moins de 15 minutes.",
"category": "Sécurité",
"priority": "essentiel",
"src": "https://anena.org/bien-choisir-son-materiel-de-secours-en-avalanche/"
},
{
"item": "Lampe frontale",
"why": "Les nuits tombent tôt en hiver ; un retard oblige à marcher de nuit.",
"category": "Éclairage",
"priority": "essentiel",
"src": "https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver"
}
],
"lighten": [
{
"item": "Vêtements en coton (jean, sweat)",
"why": "Remplacer par le système 3 couches (évacuation de la sueur, isolant, coupe-vent).",
"src": "https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver"
}
],
"quantities": [
{
"t": "Énergie : l'effort en altitude peut demander plus du double des calories qu'au niveau de la mer, alors que l'appétit baisse ; prévoir des aliments denses.",
"src": "https://www.theuiaa.org/the-importance-of-nutrition-in-mountaineering/"
},
{
"t": "Pour choisir les vêtements, compter environ -6,5 °C par 1 000 m de dénivelé, sans le vent.",
"src": "https://www.infoclimat.fr/lexique-definition-165-gradient-thermique-vertical.html"
},
{
"t": "Au-dessus de 3 000 m : ne pas monter l'altitude de nuit de plus de 500 m par jour ; une journée de repos tous les 3–4 jours.",
"src": "https://reference.medscape.com/cc2/p10/wms-altitude-illness-high-altitude-pulmonary-edema-guideline-2026a1000m91"
}
],
"reflexes": [
{
"t": "Consulter la météo (et le BERA l'hiver) ; si des orages sont annoncés, partir tôt et être redescendu vers 13–14 h.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "Donner son itinéraire et son heure de retour à une personne de confiance.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "Orage sans abri : quitter crêtes et sommets, s'accroupir pieds joints sur le sac, écarter les bâtons, s'espacer de 3 à 5 m.",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
},
{
"t": "Pas de réseau : gagner un point haut, économiser la batterie, essayer le SMS.",
"src": "https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/"
},
{
"t": "Ne pas surestimer ses capacités ; renoncer en cas de doute.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "Savoir utiliser son DVA et s'entraîner régulièrement.",
"src": "https://anena.org/bien-choisir-son-materiel-de-secours-en-avalanche/"
}
],
"mistakes": [
{
"t": "Partir en tenue d'été sans coupe-vent ni couche chaude.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "Rester sur une crête ou sous un arbre isolé pendant l'orage ; croire qu'une tente protège de la foudre.",
"src": "https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees"
},
{
"t": "Porter un DVA sans savoir s'en servir.",
"src": "https://anena.org/bien-choisir-son-materiel-de-secours-en-avalanche/"
},
{
"t": "Monter trop vite au-delà de 2 500–3 000 m.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
}
],
"short": "Montagne"
},
{
"id": "foret",
"axis": "lieu",
"name": "Forêt (dont risque de feu de forêt)",
"summary": "Le risque majeur est le feu (fumées, rayonnement, routes enfumées), puis les chutes d'arbres après tempête, les tiques et l'orientation. Le sac « feu de forêt » ajoute FFP2, lunettes et vêtements en fibres naturelles, et suppose de savoir se confiner plutôt que fuir au dernier moment.",
"risks": [
{
"t": "Feux de forêt : 9 sur 10 sont d'origine humaine ; les fumées sont toxiques.",
"src": "https://www.pompiers.fr/feux-foret/"
},
{
"t": "Le front de flammes passe en 2 à 10 minutes en un point donné ; la route prise au dernier moment est le pire choix.",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"t": "Fumées : un masque FFP2/N95 filtre les particules mais pas le monoxyde de carbone ni les gaz.",
"src": "https://www.epa.gov/sites/default/files/2018-11/documents/respiratory_protection-no-niosh-5081.pdf"
},
{
"t": "Chutes d'arbres et de branches suspendues plusieurs jours après une tempête.",
"src": "https://www.onf.fr/vivre-la-foret/enjeux-foret/changement-climatique-foret/dangers/tempetes/+/2b10::tempete-goretti-normandie-degats-consignes-de-securite.html"
},
{
"t": "Tiques.",
"src": "https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme"
},
{
"t": "Chasse et battues.",
"src": "https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse"
}
],
"add": [
{
"item": "Masque FFP2 + lunettes étanches",
"why": "Les fumées tuent plus que les flammes ; le FFP2 seul reste limité.",
"category": "Santé",
"priority": "essentiel",
"src": "https://www.youtube.com/watch?v=UATgy7o9CWM"
},
{
"item": "Vêtements couvrants en coton ou en laine, chaussures fermées",
"why": "Les tissus synthétiques fondent sur la peau.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"item": "Foulard ou linge à humidifier",
"why": "Se couvrir le nez et la bouche en cas de fumée.",
"category": "Santé",
"priority": "recommandé",
"src": "https://www.pompiers.fr/feux-foret/"
},
{
"item": "Gants en cuir épais",
"why": "Protéger les mains de la chaleur et des débris.",
"category": "Outils",
"priority": "recommandé",
"src": "https://www.youtube.com/watch?v=UATgy7o9CWM"
},
{
"item": "Radio à piles + lampe",
"why": "Suivre les consignes si le courant est coupé.",
"category": "Communication",
"priority": "recommandé",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"item": "Tire-tique",
"why": "Forêt = milieu à tiques.",
"category": "Santé",
"priority": "recommandé",
"src": "https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme"
}
],
"lighten": [
{
"item": "Matériel d'allumage de feu (usage)",
"why": "Consigne : ne pas allumer de feu en forêt (barbecue compris) ; le kit feu ne sert qu'en dernier recours ou hors saison.",
"src": "https://www.dfci-aquitaine.fr/consignes-de-securite"
}
],
"quantities": [
{
"t": "Eau : en climat chaud, prévoir jusqu'au double de la réserve d'eau habituelle du sac.",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
}
],
"reflexes": [
{
"t": "Si le feu approche sans ordre d'évacuation : se confiner dans une maison solide et débroussaillée (volets et aérations fermés, VMC coupée, linges humides aux portes, gaz coupé).",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"t": "N'évacuer que sur ordre des autorités.",
"src": "https://www.croix-rouge.fr/dossiers/incendies"
},
{
"t": "En voiture : ne jamais traverser un rideau de fumée ; s'arrêter en zone dégagée, phares allumés, tout fermer, rester dans l'habitacle sous le niveau des vitres (voir divergence avec pompiers.fr).",
"src": "https://feuxdeforet.fr/prevention/pendant/en-voiture/"
},
{
"t": "Alerter au 112 ou 18 avec sa position (SMS au 114).",
"src": "https://www.pompiers.fr/feux-foret/"
},
{
"t": "Avant un trajet en zone à risque : consulter la vigilance et la carte des feux, respecter les fermetures de massifs.",
"src": "https://association-psfdf.fr/pages/articles/reflexes-survie-voiture-incendie.html"
},
{
"t": "Après une tempête, ne pas entrer en forêt tant que les parcelles ne sont pas sécurisées.",
"src": "https://www.onf.fr/vivre-la-foret/enjeux-foret/changement-climatique-foret/dangers/tempetes/+/2b10::tempete-goretti-normandie-degats-consignes-de-securite.html"
}
],
"mistakes": [
{
"t": "Partir au dernier moment par une route forestière enfumée.",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"t": "Se réfugier dans une piscine ou regarder le feu depuis une terrasse.",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"t": "Porter des vêtements synthétiques face au feu.",
"src": "https://feuxdeforet.fr/prevention/pendant/se-confiner/"
},
{
"t": "Stationner sur de l'herbe sèche ou sur les pistes DFCI.",
"src": "https://www.dfci-aquitaine.fr/consignes-de-securite"
},
{
"t": "Croire qu'un masque FFP2 protège des gaz.",
"src": "https://www.epa.gov/sites/default/files/2018-11/documents/respiratory_protection-no-niosh-5081.pdf"
}
],
"short": "Forêt"
},
{
"id": "littoral",
"axis": "lieu",
"name": "Littoral / zones inondables / zones humides",
"summary": "Montée des eaux rapide (crue, ruissellement, submersion marine), souvent de nuit ; la voiture et les sous-sols sont les pièges principaux. Le sac est étanche, léger pour pouvoir monter à l'étage, et contient de quoi se signaler et tenir environ 72 h isolé.",
"risks": [
{
"t": "30 cm d'eau peuvent suffire à emporter un véhicule ; une voiture n'est pas un abri.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Environ 15 cm (6 pouces) d'eau en mouvement peuvent faire tomber un adulte.",
"src": "https://weather.gov/tsa/hydro_tadd"
},
{
"t": "Sous-sols, garages et logements de plain-pied (DANA de Valence 2024 : 65 victimes dans des logements et 32 dans des garages sur 214 au 18/11/2024).",
"src": "https://www.losreplicantes.com/articulos/mas-mitad-muertos-dana-comunidad-valenciana-casas-garajes/"
},
{
"t": "Submersion marine nocturne : Xynthia (2010) a tué 29 personnes à La Faute-sur-Mer, piégées de nuit.",
"src": "https://www.europe1.fr/societe/huit-ans-apres-xynthia-seuls-10-des-proprietaires-se-sont-mis-aux-nouvelles-normes-de-securite-3587759"
},
{
"t": "Vagues-submersion : une seule vague peut emporter un passant.",
"src": "https://meteofrance.com/comprendre-la-meteo/oceans/les-vagues-submersion"
},
{
"t": "Électrocution et explosion (installations de gaz et d'électricité noyées).",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Après la crue : eau du robinet peut-être non potable, aliments contaminés, CO des nettoyeurs thermiques.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Choc thermique en eau froide (< 15 °C) : perte du contrôle de la respiration.",
"src": "https://rnli.org/water-safety/float"
},
{
"t": "Leptospirose (urine de rats dans l'eau et la boue) ; moustique tigre implanté dans 81 départements début 2025.",
"src": "https://www.santepubliquefrance.fr/presse/leptospirose-appel-a-la-vigilance"
}
],
"add": [
{
"item": "Sac étanche ou sac-poubelle épais en doublure",
"why": "Garder au sec vêtements, papiers et électronique.",
"category": "Protection",
"priority": "essentiel",
"src": "https://andrewskurka.com/down-insulation-moisture-protection-sleeping-bag-jacket/"
},
{
"item": "Bottes + gants",
"why": "Se protéger de l'eau et de la boue contaminées (leptospirose), notamment en cas de plaies.",
"category": "Santé",
"priority": "recommandé",
"src": "https://www.santepubliquefrance.fr/presse/leptospirose-appel-a-la-vigilance"
},
{
"item": "Pansements étanches",
"why": "Protéger les plaies du contact avec l'eau.",
"category": "Santé",
"priority": "recommandé",
"src": "https://www.santepubliquefrance.fr/presse/leptospirose-appel-a-la-vigilance"
},
{
"item": "Lampe + sifflet",
"why": "Se signaler depuis l'étage aux secours.",
"category": "Signalisation",
"priority": "essentiel",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"item": "Radio à piles, téléphone chargé, copies des ordonnances et papiers",
"why": "Composition du kit recommandée pour environ 72 h d'isolement.",
"category": "Communication",
"priority": "essentiel",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"item": "Pastilles ou filtre à eau",
"why": "L'eau du robinet peut être non potable après l'inondation.",
"category": "Eau",
"priority": "recommandé",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"item": "Répulsif anti-moustiques",
"why": "Zones humides et moustique tigre.",
"category": "Santé",
"priority": "optionnel",
"src": "https://www.santepubliquefrance.fr/maladies-et-traumatismes/maladies-a-transmission-vectorielle/chikungunya/articles/donnees-en-france-metropolitaine/chikungunya-dengue-zika-et-west-nile-donnees-de-la-surveillance-renforcee-en-france-hexagonale-2025"
}
],
"lighten": [
{
"item": "Vêtements en coton",
"why": "Ils sèchent mal ; préférer laine ou synthétique en milieu humide.",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
}
],
"quantities": [
{
"t": "Autonomie : environ 72 h d'eau, de nourriture (et de lait infantile), de vêtements chauds et de couvertures.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Boire de l'eau en bouteille (ou traitée) tant que la mairie n'a pas confirmé la potabilité du réseau.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
}
],
"reflexes": [
{
"t": "Monter à l'étage, dans une pièce avec une ouverture vers l'extérieur ; ne sortir qu'en cas de grand danger.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Dès que l'eau monte, couper gaz, chauffage et électricité.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Ne pas aller chercher les enfants à l'école : ils y sont pris en charge.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Ne pas prendre la voiture ; faire demi-tour devant une route inondée.",
"src": "https://weather.gov/tsa/hydro_tadd"
},
{
"t": "Vigilance vagues-submersion orange ou rouge : s'éloigner du littoral et gagner le point le plus haut possible.",
"src": "https://meteofrance.com/comprendre-la-meteo/oceans/les-vagues-submersion"
},
{
"t": "Si l'on tombe en eau froide : flotter sur le dos 60 à 90 s, le temps que le choc passe, avant de nager ou d'appeler.",
"src": "https://rnli.org/water-safety/float"
},
{
"t": "Suivre la vigilance Météo-France et Vigicrues.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
}
],
"mistakes": [
{
"t": "Retourner chercher quelque chose dans un lieu inondé ou descendre au sous-sol.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Traverser une zone inondée à pied ou en voiture.",
"src": "https://weather.gov/tsa/hydro_tadd"
},
{
"t": "Toucher un appareil électrique en étant mouillé ou debout dans l'eau.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Faire tourner un groupe électrogène ou un nettoyeur thermique à l'intérieur.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Nager tout de suite après une chute en eau froide.",
"src": "https://rnli.org/water-safety/float"
}
],
"short": "Littoral / inondable"
},
{
"id": "chaud",
"axis": "climat",
"name": "Chaud / canicule / sec",
"summary": "Coup de chaleur (urgence vitale), déshydratation mais aussi hyponatrémie si l'on boit beaucoup sans sel, nuits chaudes, feux. Le sac double l'eau, ajoute sels, ombre et protection solaire, et protège les médicaments de la chaleur.",
"risks": [
{
"t": "Coup de chaleur : urgence vitale ; appeler le 15 ou le 112.",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"t": "Mortalité : plus de 5 700 décès attribuables à la chaleur à l'été 2025 en France, dont environ trois quarts chez les 75 ans et plus.",
"src": "https://www.santepubliquefrance.fr/sites/default/files/rdd/document/bullnat_chaleur_bilan_2025.pdf"
},
{
"t": "Canicule (vigilance orange) : au moins 3 jours et 3 nuits de chaleur intense ; les nuits chaudes empêchent la récupération.",
"src": "https://meteofrance.com/comprendre-la-vigilance/vigilance-canicule"
},
{
"t": "Hyponatrémie : boire trop pendant un effort prolongé est la cause principale de l'hyponatrémie d'effort.",
"src": "https://journals.sagepub.com/doi/10.1016/j.wem.2019.11.003"
},
{
"t": "Feux de végétation (voir forêt et campagne).",
"src": "https://www.pompiers.fr/feux-foret/"
},
{
"t": "Médicaments dégradés dans un coffre ou un habitacle au soleil.",
"src": "https://ansm.sante.fr/dossiers-thematiques/produits-de-sante-en-ete/transport-et-conservation-des-medicaments"
},
{
"t": "Écarts jour/nuit en milieu sec : le froid nocturne surprend ceux qui n'ont pas de vêtements chauds.",
"src": "http://www.equipped.org/21-76/ch13.pdf"
}
],
"add": [
{
"item": "Eau supplémentaire (jusqu'au double de la dotation du sac)",
"why": "Les besoins augmentent fortement avec la chaleur et l'effort.",
"category": "Eau",
"priority": "essentiel",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
},
{
"item": "Sels de réhydratation ou aliments salés",
"why": "Compenser le sel perdu et éviter l'hyponatrémie si l'on boit beaucoup.",
"category": "Santé",
"priority": "essentiel",
"src": "https://theprepared.com/emergencies/guides/severe-heat/"
},
{
"item": "Chapeau ou casquette, lunettes, crème solaire",
"why": "Limiter l'exposition et les coups de chaud.",
"category": "Santé",
"priority": "essentiel",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"item": "Vêtements amples, clairs et légers (le coton convient par temps chaud)",
"why": "Faciliter la thermorégulation.",
"category": "Vêtements",
"priority": "recommandé",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"item": "Brumisateur ou linge à mouiller",
"why": "Mouiller visage et avant-bras plusieurs fois par jour.",
"category": "Santé",
"priority": "recommandé",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"item": "Bâche ou couverture de survie (pour faire de l'ombre)",
"why": "Créer de l'ombre là où il n'y en a pas.",
"category": "Abri",
"priority": "recommandé",
"src": "https://theprepared.com/emergencies/guides/severe-heat/"
},
{
"item": "Pochette isotherme pour les médicaments",
"why": "Transport conseillé en emballage isotherme ; réfrigéré pour les produits à conserver entre 2 et 8 °C.",
"category": "Santé",
"priority": "recommandé",
"src": "https://ansm.sante.fr/dossiers-thematiques/produits-de-sante-en-ete/transport-et-conservation-des-medicaments"
}
],
"lighten": [
{
"item": "Couches isolantes épaisses",
"why": "Alléger, mais garder une couche chaude pour la nuit, qui peut être froide en milieu sec.",
"src": "http://www.equipped.org/21-76/ch13.pdf"
}
],
"quantities": [
{
"t": "Recommandation grand public : au moins 1,5 à 2 L d'eau par jour, plus en cas d'effort ou de forte transpiration.",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"t": "Travail en chaleur (soldat acclimaté) : environ 0,5 à 1 L par heure selon l'effort ; ne pas dépasser environ 1,4 L par heure ni environ 11 L par jour.",
"src": "https://home.army.mil/bavaria/4215/3926/1059/Safety_Water_Consumption.pdf"
},
{
"t": "FM 21-76 : un travail dur au soleil à 43 °C demande 19 L par jour (au-dessus du plafond du TB MED 507 : sources divergentes).",
"src": "http://www.equipped.org/21-76/ch13.pdf"
},
{
"t": "Besoin de survie : 2,5 à 3 L par personne et par jour, variable selon le climat.",
"src": "https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf"
}
],
"reflexes": [
{
"t": "Se déplacer et travailler aux heures fraîches ou de nuit ; rester à l'ombre le jour.",
"src": "http://www.equipped.org/21-76/ch13.pdf"
},
{
"t": "Réduire l'effort pendant les heures chaudes (environ 60 % de l'intensité habituelle).",
"src": "https://theprepared.com/emergencies/guides/severe-heat/"
},
{
"t": "Se mouiller la peau, fermer les volets le jour et aérer la nuit.",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"t": "Coup de chaleur : refroidir immédiatement (immersion en eau froide si possible), puis évacuer, et appeler le 15 ou le 112.",
"src": "https://pubmed.ncbi.nlm.nih.gov/38425235/"
},
{
"t": "Personnes âgées : boire régulièrement sans attendre la soif, car la soif diminue avec l'âge.",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"t": "Adultes actifs : boire selon la soif pour éviter l'hyponatrémie (sources divergentes, voir le rapport).",
"src": "https://journals.sagepub.com/doi/10.1016/j.wem.2019.11.003"
}
],
"mistakes": [
{
"t": "Boire de grandes quantités d'eau sans sel pendant un effort prolongé.",
"src": "https://journals.sagepub.com/doi/10.1016/j.wem.2019.11.003"
},
{
"t": "Consommer alcool, boissons très sucrées ou caféinées.",
"src": "https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches"
},
{
"t": "Laisser les médicaments dans une voiture au soleil.",
"src": "https://ansm.sante.fr/dossiers-thematiques/produits-de-sante-en-ete/transport-et-conservation-des-medicaments"
},
{
"t": "Utiliser un ventilateur quand l'air dépasse environ 35 °C (conseil de praticien).",
"src": "https://theprepared.com/emergencies/guides/severe-heat/"
},
{
"t": "Rationner l'eau alors qu'on en a (« rationner la sueur, pas l'eau ») [non vérifié : page source non consultable].",
"src": "https://www.phoenixmag.com/2018/07/01/desert-desertion/"
}
],
"short": "Chaud / canicule"
},
{
"id": "froid",
"axis": "climat",
"name": "Froid / hiver (neige, gel)",
"summary": "Hypothermie (possible dès +10 °C si l'on est mouillé), gelures dès 0 °C, intoxication au CO par les chauffages improvisés, verglas. Le sac ajoute le système 3 couches, les extrémités, l'isolation du sol et les calories, et retire le coton.",
"risks": [
{
"t": "Hypothermie : stade 1 entre 35 et 32 °C de température centrale, puis aggravation par stades.",
"src": "https://journals.sagepub.com/doi/full/10.1016/j.wem.2019.10.002"
},
{
"t": "L'hypothermie est possible jusqu'à environ 10 °C (50 °F) avec sueur, pluie ou immersion.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Gelures : risque dès 0 °C, qui augmente sous -15 °C (seuil abaissé par la WMS en 2024).",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
},
{
"t": "Vent : un vent modéré par -18 °C (0 °F) équivaut à -30 °C (-22 °F) ; gelure en moins de 30 minutes.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Monoxyde de carbone : première cause de mort toxique accidentelle en France ; chauffages d'appoint, braseros et groupes électrogènes.",
"src": "https://www.iledefrance.ars.sante.fr/monoxyde-de-carbone-1"
},
{
"t": "Verglas et chutes ; aggravation des maladies cardiovasculaires et respiratoires.",
"src": "https://meteofrance.com/comprendre-la-meteo/temperatures/grand-froid-quels-risques-comment-se-proteger"
},
{
"t": "Les filtres à eau (type paille ou Sawyer) peuvent geler et casser.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
}
],
"add": [
{
"item": "Système 3 couches : sous-couche en laine mérinos ou synthétique, couche isolante, coque coupe-vent",
"why": "Garder la chaleur et évacuer la sueur ; le coton est à proscrire en sous-couche.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
},
{
"item": "Bonnet, moufles par-dessus des gants fins, chaussettes épaisses en laine de rechange",
"why": "Les extrémités gèlent en premier.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
},
{
"item": "Chaufferettes chimiques ou électriques",
"why": "Prévention des gelures.",
"category": "Santé",
"priority": "recommandé",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
},
{
"item": "Isolation du sol (tapis de sol, couvertures sous soi)",
"why": "Le sol froid vole plus de chaleur que l'air.",
"category": "Abri",
"priority": "essentiel",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"item": "Thermos (boissons chaudes) + aliments caloriques",
"why": "S'hydrater et s'alimenter au chaud.",
"category": "Nourriture",
"priority": "recommandé",
"src": "https://meteofrance.com/comprendre-la-meteo/temperatures/grand-froid-quels-risques-comment-se-proteger"
},
{
"item": "Pastilles ou ébullition plutôt qu'un filtre seul",
"why": "Un filtre gelé devient inutilisable.",
"category": "Eau",
"priority": "recommandé",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"item": "Kit voiture d'hiver (pelle, couvertures, chaînes, chaufferettes)",
"why": "Se dégager ou tenir en cas de blocage sur la route.",
"category": "Véhicule",
"priority": "recommandé",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
}
],
"lighten": [
{
"item": "Jean, sweat en coton, pulls lourds",
"why": "Remplacer par des couches techniques plus légères et plus chaudes une fois mouillées.",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
}
],
"quantities": [
{
"t": "Énergie : 4 500 kcal par jour pour un militaire actif au froid (ration grand froid US) ; ordre de grandeur pour un effort au froid.",
"src": "https://www.ncbi.nlm.nih.gov/books/NBK232872/"
},
{
"t": "Sujet conscient qui frissonne : lui donner des liquides et aliments riches en glucides.",
"src": "https://journals.sagepub.com/doi/full/10.1016/j.wem.2019.10.002"
},
{
"t": "Continuer à boire : le froid déshydrate aussi.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
}
],
"reflexes": [
{
"t": "Enlever une couche avant l'effort (pelleter, monter) pour ne pas transpirer.",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
},
{
"t": "Porter la gourde à l'envers ou contre le corps pour que le bouchon ne gèle pas.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Se coucher le ventre plein, avec une bouillotte (bouteille d'eau chaude) dans le duvet.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Gelure : ne pas réchauffer s'il y a un risque de regel ; réchauffement dans l'eau à 37–39 °C pendant environ 30 minutes.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
},
{
"t": "Groupe électrogène toujours dehors ; chauffage d'appoint jamais en continu ; aérer.",
"src": "https://www.bretagne.ars.sante.fr/groupes-electrogenes-et-chauffages-dappoint-risques-dintoxications-au-monoxyde-de-carbone"
},
{
"t": "Faire fondre la neige hors du corps, ne pas la manger.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Rester là où l'on sera trouvé ; ne se déplacer que si c'est nécessaire.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
}
],
"mistakes": [
{
"t": "Porter du coton en sous-couche.",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
},
{
"t": "Boire de l'alcool pour « se réchauffer ».",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Porter des vêtements ou chaussures trop serrés.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/"
},
{
"t": "Utiliser un brasero ou un barbecue en intérieur.",
"src": "https://meteofrance.com/comprendre-la-meteo/temperatures/grand-froid-quels-risques-comment-se-proteger"
},
{
"t": "Manger de la neige.",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
}
],
"short": "Froid / hiver"
},
{
"id": "humide",
"axis": "climat",
"name": "Humide / pluvieux",
"summary": "Être mouillé longtemps : hypothermie par temps doux, pied d'immersion, isolants qui ne chauffent plus, crues soudaines. Le sac mise sur l'étanchéité interne, une tenue de nuit toujours sèche, des chaussettes de rechange et un allume-feu fiable.",
"risks": [
{
"t": "Sous la pluie prolongée, on finit mouillé : les vestes imperméables-respirantes laissent passer la sueur et finissent par prendre l'eau.",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"t": "Hypothermie par temps frais et humide (jusqu'à environ 10 °C).",
"src": "https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/"
},
{
"t": "Pied d'immersion (lésion par froid sans gel) : pieds mouillés et froids pendant des heures ou des jours, surtout immobile, épuisé et mal nourri.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/"
},
{
"t": "Aucun isolant n'est chaud une fois mouillé ; le synthétique perd moins que le duvet en humidité prolongée.",
"src": "https://andrewskurka.com/down-insulation-moisture-protection-sleeping-bag-jacket/"
},
{
"t": "Crues et traversées de cours d'eau après de fortes pluies.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
},
{
"t": "En hiver, les vêtements mouillés ne sèchent pas.",
"src": "https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver"
}
],
"add": [
{
"item": "Veste et pantalon de pluie",
"why": "Limiter l'eau et le vent, même si l'étanchéité n'est jamais totale.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"item": "Doublure étanche du sac (sac-poubelle épais)",
"why": "Garder le duvet et la doudoune au sec.",
"category": "Protection",
"priority": "essentiel",
"src": "https://andrewskurka.com/down-insulation-moisture-protection-sleeping-bag-jacket/"
},
{
"item": "Tenue de nuit dédiée, toujours sèche",
"why": "Dormir au sec et ne pas mouiller le duvet (≈ 225 g, « une demi-livre »).",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"item": "Chaussettes de rechange en laine ou synthétique",
"why": "En changer au moins une fois par jour pour prévenir le pied d'immersion.",
"category": "Vêtements",
"priority": "essentiel",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/"
},
{
"item": "Allume-feu fiable par temps humide (coton vaseliné, allumettes-tempête)",
"why": "Le feu remonte le moral et peut sauver quand tout est mouillé.",
"category": "Feu",
"priority": "recommandé",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
},
{
"item": "Bâche",
"why": "Abri rapide et zone sèche.",
"category": "Abri",
"priority": "recommandé",
"src": "https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/"
}
],
"lighten": [
{
"item": "Vêtements en coton",
"why": "Absorbent l'eau et sèchent lentement.",
"src": "https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/"
}
],
"quantities": [
{
"t": "Chaussettes : au moins une paire sèche par jour (en 1914-1918, des chaussettes sèches distribuées chaque soir ont fait disparaître le pied de tranchée).",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/"
}
],
"reflexes": [
{
"t": "Faire un « séchage » dès qu'une occasion se présente (soleil, abri, laverie).",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"t": "Rester actif, bien manger, retirer ses chaussures et sécher ses pieds au repos.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/"
},
{
"t": "Mettre la tenue sèche uniquement pour dormir et remettre les habits mouillés le matin.",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"t": "Suivre la vigilance pluie-inondation et Vigicrues.",
"src": "https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement"
},
{
"t": "Ne pas traverser un cours d'eau en crue ; se méfier des crues d'orage.",
"src": "https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html"
}
],
"mistakes": [
{
"t": "Croire qu'un isolant synthétique reste chaud une fois trempé.",
"src": "https://andrewskurka.com/down-insulation-moisture-protection-sleeping-bag-jacket/"
},
{
"t": "Dormir dans des vêtements mouillés, ce qui mouille aussi le duvet.",
"src": "https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/"
},
{
"t": "Rester immobile des heures dans des chaussures mouillées.",
"src": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/"
},
{
"t": "S'installer dans un lit de rivière ou un fond de vallon étroit.",
"src": "http://www.equipped.org/21-76/ch13.pdf"
}
],
"short": "Humide / pluvieux"
}
];
