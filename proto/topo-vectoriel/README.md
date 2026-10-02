# Prototype : carte topo vectorielle hors ligne (Pyrénées, Andorre)

Prototype qui a précédé l'intégration dans l'application (`js/topo.js`, voir [`docs/TUILES.md`](../../docs/TUILES.md)) : la carte est **dessinée sur l'appareil** à partir de données ouvertes déjà prêtes. Ce dossier n'est pas copié dans `www/`. Son extrait `data/osm.pmtiles` sert aussi à tester l'application avant l'hébergement du fond OSM.

## Lancer
```sh
node proto/topo-vectoriel/serve.mjs     # puis http://localhost:8790
```
Au premier lancement, les trois fichiers de `data/` (91 Mo) sont copiés dans le stockage du navigateur (IndexedDB). Ensuite, la carte ne fait **aucune requête réseau** : c'est le fonctionnement visé pour les packs hors ligne. Le bouton « Comparer avec OpenTopoMap » superpose la carte de référence (en ligne) sur la même vue.

## Données de la zone (lon 1,30–2,10, lat 42,40–42,95)
| Fichier | Contenu | Taille |
|---|---|---|
| `osm.pmtiles` | Fond OpenStreetMap vectoriel, détail 0–15 ([Protomaps](https://docs.protomaps.com/basemaps/downloads), build du 02/10/2026) | 26 Mo |
| `terrain-z12.pmtiles` | Altitudes Terrarium, détail 0–12 (≈ 14 m par pixel ici), [Mapterhorn](https://mapterhorn.com) `planet.pmtiles` | 20 Mo |
| `terrain-z13.pmtiles` | Altitudes, détail 13 (≈ 7 m par pixel), Mapterhorn `6-32-23.pmtiles` | 45 Mo |
| **Total** | | **91 Mo**, contre ≈ 235 Mo pour la même zone en images OpenTopoMap (détail 6–15) |

Le détail 14 des altitudes ajouterait 229 Mo : le détail 13 suffit pour des courbes tous les 10 à 20 m.

Recréer les fichiers (CLI [`pmtiles`](https://github.com/protomaps/go-pmtiles/releases)) :
```sh
pmtiles extract https://build.protomaps.com/AAAAMMJJ.pmtiles data/osm.pmtiles --bbox=1.30,42.40,2.10,42.95
pmtiles extract https://download.mapterhorn.com/planet.pmtiles data/terrain-z12.pmtiles --bbox=1.30,42.40,2.10,42.95
pmtiles extract https://download.mapterhorn.com/6-32-23.pmtiles data/terrain-z13.pmtiles --bbox=1.30,42.40,2.10,42.95 --maxzoom=13
```

## Comment c'est fait
- **Rendu** : [MapLibre GL JS](https://maplibre.org) 6.11, style [Protomaps](https://github.com/protomaps/basemaps) recoloré façon OpenTopoMap : forêts vertes, routes orange, sentiers en tirets brun foncé, ruisseaux bleus dès le détail 12, frontière violette, sommets avec altitude.
- **Ombrage** : couche `hillshade` de MapLibre sur les altitudes Mapterhorn.
- **Courbes de niveau** : calculées sur l'appareil par [maplibre-contour](https://github.com/onthegomap/maplibre-contour). Équidistance de 200 m au détail 9, puis 100, 50 et 20 m, jusqu'à 10 m au détail 15 ; cotes sur les courbes maîtresses.
- **Lecture hors ligne** : les fichiers PMTiles sont lus dans des `Blob` gardés dans IndexedDB (`BlobSource` dans `app.mjs`). maplibre-contour ne propose pas d'option publique pour lire des tuiles hors réseau : le prototype remplace sa fonction interne `manager.getTile`, à figer avec la version de la bibliothèque.
- Tout est local : bibliothèques dans `lib/`, polices (3 plages de caractères latins) et icônes dans `assets/`.

## Vérifié (Edge sans interface, 02/10/2026)
- Vues contrôlées : ensemble au détail 11,5, Pic d'Estats au 13,5, Ax-les-Thermes au 15, Andorre-la-Vieille au 13, téléphone 390 px.
- Aucune erreur JavaScript, aucune requête externe pendant la navigation sur la carte. Au rechargement, les fichiers viennent du stockage local.
- Seul avertissement : l'icône « townhall » manque au jeu d'icônes Protomaps (sans effet visible).

## Écarts restants avec OpenTopoMap
- Le rendu est proche, sans être identique : moins de toponymes de lieux-dits et de cols au détail 13, cotes des courbes surtout visibles à partir du détail 14.
- Les sentiers dépendent des données OSM (`kind=path`) ; OpenTopoMap affiche aussi les itinéraires balisés (GR), absents de Protomaps.
- Polices limitées au latin : les noms en alphabets non latins ne s'afficheraient pas.

## Licences
- Bibliothèques : MapLibre GL JS, pmtiles, @protomaps/basemaps, maplibre-contour sous BSD-3-Clause. Polices Noto Sans sous SIL Open Font License (`assets/fonts/OFL.txt`).
- Données : OpenStreetMap (ODbL, attribution « © contributeurs OpenStreetMap ») ; altitudes Mapterhorn, sources de cette zone : IGN LiDAR HD et RGE ALTI (Licence Ouverte 2.0), CNIG Espagne MDT (CC BY 4.0), Copernicus GLO-30 (licence libre et ouverte Copernicus). Toutes permettent l'usage commercial avec attribution ; liste complète : `https://download.mapterhorn.com/attribution.json`.

## Pour l'intégrer à l'application
1. Remplacer le fond Leaflet par MapLibre, ou l'insérer dans Leaflet avec `@maplibre/maplibre-gl-leaflet`, ce qui garde les points, mesures et GPS existants.
2. Packs : extraire les fichiers PMTiles par zone. Soit des fichiers régionaux prêts sur notre stockage, soit une extraction dans le navigateur par lectures partielles d'un PMTiles hébergé, ce qui reste à développer.
3. Mettre les bibliothèques et les polices dans le cache du service worker.
