# Carte topographique : données et hébergement

> État au 02/10/2026 : la carte vectorielle est intégrée à l'application et vérifiée.
> **Reste à faire avant publication : héberger le fichier du fond OpenStreetMap** et le renseigner dans `js/config.js` (voir « Mettre en ligne »).

## Principe
La carte n'est plus faite d'images : elle est **dessinée sur l'appareil** (MapLibre GL, inséré dans la carte Leaflet existante) à partir de deux fichiers [PMTiles](https://github.com/protomaps/PMTiles) :

| Source (`js/topo.js`) | Contenu | Où | Détail |
|---|---|---|---|
| `osm` | Fond OpenStreetMap vectoriel au schéma [Protomaps](https://docs.protomaps.com/basemaps/downloads) : routes, chemins, forêts, eau, lieux, sommets | **Notre stockage** (`KS_CONFIG.map.osm`) | 0 à 15 |
| `mdem` | Altitudes [Mapterhorn](https://mapterhorn.com) (Terrarium, WebP 512 px, ≈ 15 m) : ombrage, courbes de niveau, altitude au clic | `https://download.mapterhorn.com/planet.pmtiles` (`KS_CONFIG.map.terrain`) | 0 à 12 |

- L'application lit ces fichiers par **lectures partielles HTTP** (une requête par tuile), sans serveur de tuiles.
- Chaque tuile lue est gardée dans IndexedDB (`tiles`, clés `osm/z/x/y` et `mdem/z/x/y`). Les tuiles du fond OSM sont gardées **compressées** (gzip, comme dans l'archive) et décompressées à l'affichage, ce qui divise la place par deux.
- **Packs hors ligne** : toutes les tuiles d'une zone, du détail 0 au maximum de chaque source. Il n'y a plus de choix de détail : une tuile vectorielle ne s'agrandit pas comme une image, et un pack incomplet laisserait la carte vide en zoomant.
- Ombrage et courbes de niveau (équidistance de 200 m en vue large jusqu'à 10 m au plus près) sont calculés sur l'appareil (`maplibre-contour`).
- Le style reprend les repères d'OpenTopoMap : forêts vertes, routes orange, sentiers en tirets bruns, ruisseaux bleus, frontières violettes, sommets avec altitude.
- Sans pack ni connexion, l'image du relief Europe intégrée reste visible sous la carte.

### Tailles mesurées (Pyrénées, 02/10/2026)
- Pack de ≈ 12 km de rayon : 462 tuiles, ≈ 5 Mo.
- Zone de 65 × 60 km : fond OSM 26 Mo + altitudes 20 Mo.
- Estimation pour 1 000 km de rayon : ≈ 7,8 millions de tuiles, ≈ 45 Go. L'application affiche l'estimation avant de télécharger.

## Mettre en ligne le fond OSM (obligatoire)
Les fichiers publiés par Protomaps (`build.protomaps.com`) **ne sont pas lisibles depuis un navigateur** (pas d'en-tête CORS), et Protomaps demande de ne pas les utiliser directement. Il faut en héberger une copie.

| Zone | Taille du fichier |
|---|---|
| France métropolitaine | ≈ 9,5 Go |
| Europe (-25° à 45° E, 34° à 72° N) | ≈ 49 Go |

1. Extraire avec le CLI [`pmtiles`](https://github.com/protomaps/go-pmtiles/releases) depuis un build récent (liste : `https://build-metadata.protomaps.dev/builds.json`) :
   ```sh
   pmtiles extract https://build.protomaps.com/AAAAMMJJ.pmtiles europe.pmtiles --bbox=-25,34,45,72
   ```
2. Le déposer sur un stockage objet sans frais de sortie. Par exemple, Cloudflare R2 coûte environ 0,015 $ par Go et par mois, soit moins d'1 $/mois pour l'Europe (tarif à vérifier).
3. Règle CORS du stockage : méthodes `GET`, `HEAD` ; en-têtes autorisés `Range`, `If-Match` ; en-têtes exposés `ETag`, `Content-Range`, `Content-Length` ; origines `capacitor://localhost` (app iOS) et l'adresse de la webapp.
4. Renseigner `map.osm` dans `js/config.js`, puis vérifier :
   ```sh
   npm run map:check -- https://…/europe.pmtiles osm
   ```
5. Mettre à jour une à quatre fois par an (nouvel extrait). Les packs déjà téléchargés restent valables.

**Mapterhorn** : lisible directement (CORS ouvert). Pour ne plus en dépendre, on peut en héberger aussi une copie Europe (≈ 26 Go, détail 0 à 12) et la renseigner dans `map.terrain`.

**Tester avant l'hébergement** : servir un extrait local, puis dans la console du navigateur :
`localStorage.setItem('holdout.dev.osm', '<url du fichier>')`. Le serveur doit gérer les en-têtes `Range`. Un extrait de zone se fabrique avec `pmtiles extract … --bbox=…` (voir « Mettre en ligne le fond OSM »).

## Points à surveiller
- **iPhone (Safari / WKWebView)** : Chrome et Edge lisent Mapterhorn sans requête préalable CORS. Si Safari en envoyait une, Mapterhorn la refuserait (HTTP 403). C'est à vérifier sur un appareil ; sinon, il faut héberger notre copie des altitudes avec une règle CORS complète.
- **maplibre-contour 0.1.1** n'a pas d'option publique pour lire les altitudes hors réseau : `js/topo.js` remplace sa fonction interne `manager.getTile`. Vérifier ce point à chaque mise à jour de la bibliothèque.
- **Polices** : latin, grec, cyrillique, arabe et tifinagh sont embarqués (`assets/map/fonts`). Les autres écritures s'affichent avec la police du système.
- **Anciens packs** (IGN, relief, OpenTopoMap) : ils ne s'affichent plus. Ils restent supprimables depuis la liste des packs.

## Licences
- Données : OpenStreetMap (ODbL, attribution « © contributeurs OpenStreetMap ») ; altitudes Mapterhorn, une licence par source, toutes compatibles avec un usage commercial avec attribution (IGN LiDAR HD et RGE ALTI : Licence Ouverte 2.0 ; CNIG Espagne : CC BY 4.0 ; Copernicus GLO-30 : licence libre et ouverte ; liste : `https://download.mapterhorn.com/attribution.json`).
- Bibliothèques (`lib/maplibre/`) : MapLibre GL JS 5.24, pmtiles 4.5, @protomaps/basemaps 5.7, maplibre-contour 0.1.1 (BSD-3-Clause) ; @maplibre/maplibre-gl-leaflet 0.1.4 (ISC). Détail dans `lib/maplibre/LICENSES.md`. Polices Noto Sans : SIL Open Font License (`assets/map/fonts/OFL.txt`).
