# Kit Survie Europe

Application **locale, personnelle et hors ligne**, construite autour de la survie **à l'instant T** de son utilisateur :
- un **profil** (foyer, santé, logement, domicile, environnement) qui personnalise tout le reste ;
- un **état des lieux matériel** : besoins calculés pour vous, comparés à ce que vous possédez, manques vitaux en premier ;
- un écran **Instant T** : position GPS sans Internet, autonomie réelle, actions par situation, ressources et dangers les plus proches, cap vers le domicile ou le point de rendez-vous ;
- des **cartes topographiques hors ligne**, dont la carte **IGN officielle** (Plan IGN et estompage, Licence Ouverte Etalab 2.0) téléchargeable par zone, exportable et importable.

**Version gratuite et Premium** : l'essentiel pour réagir (Instant T, carte intégrée, 1 pack de carte, 1 sac…) est gratuit. Premium (3,90 €/mois, 29,90 €/an ou 59,90 € à vie) débloque la personnalisation complète. Les licences sont signées et vérifiées hors ligne. Voir [`docs/MONETISATION.md`](docs/MONETISATION.md).

Elle permet aussi de préparer :
- un **écosystème de survie domestique** : stock d'eau et de nourriture, énergie, santé, hygiène, communication, documents, sécurité, plan familial ;
- un **sac d'évacuation 72 h** par personne ;
- une **liste de matériel** avec liens, prix indicatifs et **récapitulatif budgétaire** ;
- une **carte topographique de l'Europe utilisable sans Internet**, avec les points importants : énergie, eau, santé, secours, dangers (nucléaire, barrages, industrie).

Tout fonctionne dans le navigateur (HTML/JS, sans serveur ni compte). Les données restent sur l'appareil.

## Application iOS
Le dépôt contient un projet **iOS natif** (Capacitor 8, dossier `ios/`) : GPS natif, achats intégrés StoreKit (exigés par l'App Store), export via la feuille de partage, barre d'onglets en bas de l'écran, données embarquées pour fonctionner hors ligne. Compilation sur Mac avec Xcode : `npm install && npm run ios:sync && npm run ios:open`. Guide complet : [`docs/IOS.md`](docs/IOS.md).

## Webapp
Version web installable (PWA) et utilisable hors ligne.
- **Assembler** : `npm run build:webapp` produit `www/`, à héberger sur n'importe quel hébergement statique en HTTPS.
- **Publier** : le workflow `.github/workflows/webapp.yml` publie sur GitHub Pages à chaque push sur `main`. Il faut choisir Settings › Pages › Source : GitHub Actions ; un dépôt privé demande GitHub Pro, Team ou Enterprise. Alternative : `netlify.toml`.
- **Tester en local** : `npm run serve`.

## Démarrer (web)

```sh
./lancer.sh            # Linux / macOS  → http://localhost:8765
lancer.bat             # Windows
```
Vous pouvez aussi ouvrir `index.html` directement. Pour un usage hors ligne complet, ouvrez l'application une fois via le serveur local (ou depuis GitHub Pages), puis installez-la (« Installer l'application » / « Ajouter à l'écran d'accueil »).

## Documentation
- [`docs/NOTICE.md`](docs/NOTICE.md) : notice d'utilisation et informations importantes
- [`docs/MATERIEL.md`](docs/MATERIEL.md) : liste du matériel, liens et récapitulatif budgétaire
- [`docs/TERRAIN.md`](docs/TERRAIN.md) : praticiens, forums, crises réelles, sujets techniques
- [`docs/ENVIRONNEMENTS.md`](docs/ENVIRONNEMENTS.md) : variantes du sac (ville, campagne, montagne, forêt, littoral × chaud, froid, humide)
- [`docs/APS.md`](docs/APS.md) : analyse de la chaîne *Apprendre Préparer (Sur)vivre*
- [`docs/SOURCES.md`](docs/SOURCES.md) : sources, licences et méthode
- [`docs/MONETISATION.md`](docs/MONETISATION.md) : offres, gratuit / Premium, licences, mise en vente
- [`docs/IOS.md`](docs/IOS.md) : application iOS (compilation, achats intégrés, App Store)

## Structure
```
index.html          application (11 onglets)
js/app.js           logique (navigation, maison, sacs, budget, plan, notice)
js/profile.js       profil personnel
js/needs.js         état des lieux matériel (besoins calculés selon le profil)
js/now.js           écran Instant T
js/premium.js       offres, licence vérifiée hors ligne, verrous Premium
js/config.js        prix, liens de paiement, clé publique des licences
js/map.js           carte hors ligne (IGN, relief, OSM, PMTiles, packs .kspack, proximité)
js/knowledge.js     contenus sourcés (piliers, scénarios, infos clés)
js/gear.js          catalogue du matériel
js/aps.js           synthèse de la chaîne APS
js/field.js         savoir de terrain (praticiens, forums, crises)
js/env.js           variantes du sac par environnement
js/calc.js          calculateurs
js/bags.js          types de sac (évacuation / survie) et consommables selon la durée
data/               relief Europe, fond vectoriel, points nucléaire/barrages/centrales
lib/                Leaflet 1.9.4, pmtiles, protomaps-leaflet (copies locales)
tools/              données, licences (license.mjs), service de délivrance (licence-worker.js)
sw.js               service worker (cache hors ligne, version web)
js/native.js        pont iOS (GPS, fichiers, préférences, achats StoreKit)
ios/                projet Xcode généré par Capacitor
capacitor.config.json, package.json   configuration iOS et dépendances
```

## Licences des données
Natural Earth (domaine public), Terrain Tiles AWS/Mapzen (attribution : EU-DEM Copernicus, SRTM/GMTED USGS, ETOPO1 NOAA…), Wikidata (CC0), WRI Global Power Plant Database (CC BY 4.0), OpenStreetMap (ODbL), OpenTopoMap (CC-BY-SA), IGN – Géoplateforme (Licence Ouverte Etalab 2.0). Détails dans `docs/SOURCES.md`.
