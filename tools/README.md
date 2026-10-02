# Régénérer les données de la carte

Prérequis : Python 3, `pip install numpy pillow`.

1. **Points énergie et dangers** : exécuter `q_nuc.rq` et `q_dam.rq` sur https://query.wikidata.org/sparql (JSON), ce qui produit `wd_nuc.json` et `wd_dam.json`. Télécharger aussi
   `https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv` (sous le nom `gppd.csv`), puis lancer `python3 build_poi.py`, qui produit `poi_europe.json`.
2. **Relief** : lancer `python3 build_relief.py`. Le script télécharge environ 680 tuiles Terrarium en zoom 7 depuis AWS Open Data et produit `relief_europe_z7.jpg`. Les limites de l'image sont affichées dans la console : les reporter dans `RELIEF_BOUNDS` (`js/map.js`).
3. Emballer les fichiers pour l'application :
   `(echo -n 'window.POI_EUROPE='; cat poi_europe.json; echo ';') > ../data/poi_europe.js`, et copier le JPEG dans `../data/relief_europe.jpg`.

Le fond de la carte topographique (fichiers PMTiles) n'est pas généré ici : voir `docs/TUILES.md`. Pour vérifier un fichier hébergé : `npm run map:check -- <url> osm` (ou `terrain`).

## Vérification de l’interface

Depuis un serveur local à la racine du dépôt, ouvrir `tools/ui-smoke.html?width=1280`, puis `tools/ui-smoke.html?width=390`. Utiliser un profil de navigateur de test : le contrôle ouvre les écrans et utilise les données locales de ce profil. Il vérifie la navigation, les indicateurs, les situations, la carte plein écran, son panneau, le retour, le menu mobile, les thèmes et l’absence de débordement horizontal. Les données d’inventaire ne sont pas modifiées ; les valeurs par défaut des sacs sont initialisées par le rendu existant. Ce fichier de développement est exclu du dossier `www/`.

`node tools/test-map-packs.mjs` vérifie les packs dépassant 25 000 tuiles, les estimations, l'arrêt et la reprise, les erreurs de stockage, la suppression de packs avec des tuiles partagées et l'export/import `.kspack`. Le stockage et les réponses réseau sont simulés : aucune carte n'est téléchargée et aucune donnée utilisateur n'est utilisée.

## Affichage sur téléphone et tablette

`node tools/ui-responsive-audit.mjs .tmp/responsive` ouvre chaque écran dans Edge à 9 tailles (téléphones 360 à 430 px, téléphone en paysage, tablettes 768 à 1180 px, ordinateur) avec des données réalistes. Il signale les débordements horizontaux, les éléments qui sortent de l'écran, les textes de moins de 12 px, les zones tactiles de moins de 40 px et les champs qui déclenchent le zoom d'iOS (police < 16 px), et enregistre une capture par écran et par taille.
