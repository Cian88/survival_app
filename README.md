# Holdout

*To hold out : tenir bon, jusqu'au bout. Préparation, survie et autonomie, hors ligne.*

Application **locale, personnelle et hors ligne**, construite autour de la survie **à l'instant T** de son utilisateur :
- un **profil** (foyer, santé, logement, domicile, environnement) qui personnalise tout le reste ;
- un **état des lieux matériel** : besoins calculés pour vous, comparés à ce que vous possédez, manques vitaux en premier ;
- un écran **Instant T** : position GPS sans Internet, autonomie réelle, actions par situation, ressources et dangers les plus proches, cap vers le domicile ou le point de rendez-vous ;
- une **carte topographique vectorielle** (sentiers, courbes de niveau, ombrage du relief), dessinée sur l'appareil, téléchargeable par zone pour un usage hors ligne, exportable et importable.

**Version gratuite et Premium** : l'essentiel pour réagir (Instant T, carte intégrée, 1 pack de carte, 1 sac…) est gratuit. Premium (29,90 €/an ou 59,90 € à vie) débloque la personnalisation complète. Les licences sont signées et vérifiées hors ligne. Voir [`docs/MONETISATION.md`](docs/MONETISATION.md).

Elle permet aussi de préparer :
- un **écosystème de survie domestique** : stock d'eau et de nourriture, énergie, santé, hygiène, communication, documents, sécurité, plan familial ;
- un **sac d'évacuation 72 h** par personne ;
- une **liste de matériel** avec liens, prix indicatifs et **récapitulatif budgétaire** ;
- une **carte topographique de l'Europe utilisable sans Internet**, avec les points importants : énergie, eau, santé, secours, dangers (nucléaire, barrages, industrie).

Tout fonctionne dans le navigateur (HTML/JS), **hors ligne**. Un **compte** est demandé au premier lancement : il peut se créer et s'ouvrir sans réseau. Il sauvegarde et synchronise les données **chiffrées de bout en bout** (le serveur ne peut pas les lire) et retrouve Premium sur tous les appareils. Connexion par e-mail, Google ou Apple. Voir [`docs/COMPTES.md`](docs/COMPTES.md).

L’interface utilise une navigation latérale sur ordinateur et une barre inférieure sur mobile. Le thème clair **Expédition** associe papier chaud, olive et titres à empattements ; le thème sombre **Signal** utilise des surfaces encre, des accents ambre et des indicateurs en caractères monospace. Le réglage « Suivre le système » bascule automatiquement entre les deux, y compris lorsque l’apparence de l’appareil change. Les cartes, formulaires et listes s’adaptent à la largeur disponible ; les neuf piliers du stock maison sont dépliables. La carte occupe tout l’écran : le bouton de retour retrouve l’écran précédent, et « Options » ouvre les téléchargements, points et outils dans un panneau escamotable. La touche Échap ferme ce panneau, puis permet de quitter la carte.

## Application iOS
Le dépôt contient un projet **iOS natif** (Capacitor 8, dossier `ios/`) : GPS natif, achats intégrés StoreKit (exigés par l'App Store), export via la feuille de partage, barre d'onglets en bas de l'écran, données embarquées pour fonctionner hors ligne. Compilation sur Mac avec Xcode : `npm install && npm run ios:sync && npm run ios:open`. Guide complet : [`docs/IOS.md`](docs/IOS.md).

## Webapp
Version web installable (PWA) et utilisable hors ligne.
- **Assembler** : `npm run build:webapp` produit `www/`, à héberger sur n'importe quel hébergement statique en HTTPS.
- **Publier** : le workflow `.github/workflows/deploy.yml` publie sur Cloudflare à chaque push sur `main` : le site et l'application sur https://hold-out.app (application sous `/app/`), et le serveur de comptes sur https://api.hold-out.app quand `server/` change. Tests rapides d'abord ; secrets du dépôt : `CLOUDFLARE_API_TOKEN` (secret) et `CLOUDFLARE_ACCOUNT_ID` (variable). À la main : `npm run deploy:site`.
- **Tester en local** : `npm run serve`.

## Démarrer (web)

```sh
./lancer.sh            # Linux / macOS  → http://localhost:8765
lancer.bat             # Windows
```
Vous pouvez aussi ouvrir `index.html` directement. Pour un usage hors ligne complet, ouvrez l'application une fois via le serveur local (ou depuis GitHub Pages), puis installez-la (« Installer l'application » / « Ajouter à l'écran d'accueil »).

## Documentation
- [`docs/NOTICE.md`](docs/NOTICE.md) : notice d'utilisation et informations importantes
- [`docs/MATERIEL.md`](docs/MATERIEL.md) : matériel conseillé en 3 gammes de budget, liens Amazon.fr et récapitulatif budgétaire (généré par `node tools/build-materiel.mjs`)
- [`docs/AMAZON.md`](docs/AMAZON.md) : liens Amazon, programme Partenaires et prix officiels (mise en service)
- [`docs/TERRAIN.md`](docs/TERRAIN.md) : praticiens, forums, crises réelles, sujets techniques
- [`docs/ENVIRONNEMENTS.md`](docs/ENVIRONNEMENTS.md) : variantes du sac (ville, campagne, montagne, forêt, littoral × chaud, froid, humide)
- [`docs/APS.md`](docs/APS.md) : analyse de la chaîne *Apprendre Préparer (Sur)vivre*
- [`docs/SOURCES.md`](docs/SOURCES.md) : sources, licences et méthode
- [`docs/MONETISATION.md`](docs/MONETISATION.md) : offres, gratuit / Premium, licences, mise en vente
- [`docs/IOS.md`](docs/IOS.md) : application iOS (compilation, achats intégrés, App Store)
- [`docs/TUILES.md`](docs/TUILES.md) : carte topographique (données, hébergement sur `cartes.hold-out.app`, licences)
- [`docs/COMPTES.md`](docs/COMPTES.md) : comptes, chiffrement de bout en bout, serveur `api.hold-out.app`, configuration restante

## Logique des quantités
Seuls les **consommables** (eau, nourriture, pastilles, combustible, piles, hygiène, médicaments) varient avec la durée d'autonomie. Les **équipements durables** (filtre, réchaud, panneaux solaires, station électrique, outils, vêtements lavables) gardent la même quantité : un filtre sert 1 jour comme 3 mois. L'eau **stockée** à la maison est plafonnée à 14 jours ; au-delà, l'app demande une source renouvelable et un traitement.

## Structure
```
index.html          application (11 onglets)
js/app.js           logique (navigation, maison, sacs, budget, plan, notice)
js/profile.js       profil personnel
js/needs.js         état des lieux matériel (besoins calculés selon le profil)
js/now.js           écran Instant T
js/premium.js       offres, licence vérifiée hors ligne, verrous Premium
js/account.js       compte (connexion hors ligne, synchronisation chiffrée, licences du compte)
js/vault-crypto.js  chiffrement de bout en bout (clés, code de secours, fusion)
server/             serveur de comptes holdout-api (Cloudflare Worker + D1)
js/config.js        prix, liens de paiement, clé publique des licences
js/map.js           carte hors ligne (packs .kspack, points OSM, outils, proximité)
js/topo.js          fond topographique vectoriel (MapLibre, PMTiles, courbes de niveau)
js/knowledge.js     contenus sourcés (piliers, scénarios, infos clés)
js/gear.js          catalogue du matériel
js/aps.js           synthèse de la chaîne APS
js/field.js         savoir de terrain (praticiens, forums, crises)
js/env.js           variantes du sac par environnement
js/calc.js          calculateurs
js/bags.js          types de sac (évacuation / survie) et consommables selon la durée
data/               relief Europe, points nucléaire/barrages/centrales
lib/                Leaflet 1.9.4, MapLibre et bibliothèques de la carte (copies locales)
assets/map/         polices et icônes de la carte
tools/              données, licences (license.mjs), service de délivrance (licence-worker.js)
sw.js               service worker (cache hors ligne, version web)
js/native.js        pont iOS (GPS, fichiers, préférences, achats StoreKit)
ios/                projet Xcode généré par Capacitor
capacitor.config.json, package.json   configuration iOS et dépendances
```

## Licences des données
OpenStreetMap via Protomaps (ODbL), Mapterhorn (IGN, CNIG, Copernicus…), Terrain Tiles AWS/Mapzen (attribution : EU-DEM Copernicus, SRTM/GMTED USGS, ETOPO1 NOAA…), Wikidata (CC0), WRI Global Power Plant Database (CC BY 4.0), OpenStreetMap (ODbL). Détails dans `docs/SOURCES.md`.
