# Kit Survie Europe

Application **locale et hors ligne** pour préparer :
- un **écosystème de survie domestique** : stock d'eau et de nourriture, énergie, santé, hygiène, communication, documents, sécurité, plan familial ;
- un **sac d'évacuation 72 h** par personne ;
- une **liste de matériel** avec liens, prix indicatifs et **récapitulatif budgétaire** ;
- une **carte topographique de l'Europe utilisable sans Internet**, avec les points importants : énergie, eau, santé, secours, dangers (nucléaire, barrages, industrie).

Tout fonctionne dans le navigateur (HTML/JS, sans serveur ni compte). Les données restent sur l'appareil.

## Démarrer

```sh
./lancer.sh            # Linux / macOS  → http://localhost:8765
lancer.bat             # Windows
```
Vous pouvez aussi ouvrir `index.html` directement. Pour un usage hors ligne complet, ouvrez l'application une fois via le serveur local (ou depuis GitHub Pages), puis installez-la (« Installer l'application » / « Ajouter à l'écran d'accueil »).

## Documentation
- [`docs/NOTICE.md`](docs/NOTICE.md) : notice d'utilisation et informations importantes
- [`docs/MATERIEL.md`](docs/MATERIEL.md) : liste du matériel, liens et récapitulatif budgétaire
- [`docs/APS.md`](docs/APS.md) : analyse de la chaîne *Apprendre Préparer (Sur)vivre*
- [`docs/SOURCES.md`](docs/SOURCES.md) : sources, licences et méthode

## Structure
```
index.html          application (7 onglets)
js/app.js           logique (tableau de bord, maison, sacs, budget, plan, notice)
js/map.js           carte hors ligne (Leaflet + relief + OSM + PMTiles)
js/knowledge.js     contenus sourcés (piliers, scénarios, infos clés)
js/gear.js          catalogue du matériel
js/aps.js           synthèse de la chaîne APS
data/               relief Europe, fond vectoriel, points nucléaire/barrages/centrales
lib/                Leaflet 1.9.4, pmtiles, protomaps-leaflet (copies locales)
tools/              scripts de régénération des données
sw.js               service worker (cache hors ligne)
```

## Licences des données
Natural Earth (domaine public), Terrain Tiles AWS/Mapzen (attribution : EU-DEM Copernicus, SRTM/GMTED USGS, ETOPO1 NOAA…), Wikidata (CC0), WRI Global Power Plant Database (CC BY 4.0), OpenStreetMap (ODbL), OpenTopoMap (CC-BY-SA). Détails dans `docs/SOURCES.md`.
