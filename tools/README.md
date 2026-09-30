# Régénérer les données de la carte

Prérequis : Python 3, `pip install shapely pyshp numpy pillow`.

1. **Fond vectoriel** : télécharger dans un dossier de travail les couches Natural Earth
   (`https://naciscdn.org/naturalearth/<échelle>/<thème>/<nom>.zip`) :
   `50m/cultural/ne_50m_admin_0_countries`, `10m/cultural/ne_10m_admin_0_boundary_lines_land`,
   `10m/physical/ne_10m_rivers_lake_centerlines`, `10m/physical/ne_10m_rivers_europe`,
   `10m/physical/ne_10m_lakes`, `10m/physical/ne_10m_lakes_europe`,
   `10m/cultural/ne_10m_populated_places_simple`, `10m/cultural/ne_10m_roads`. Les dézipper, puis lancer `python3 build_base.py`, qui produit `base_europe.json`.
2. **Points énergie et dangers** : exécuter `q_nuc.rq` et `q_dam.rq` sur https://query.wikidata.org/sparql (JSON), ce qui produit `wd_nuc.json` et `wd_dam.json`. Télécharger aussi
   `https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv` (sous le nom `gppd.csv`), puis lancer `python3 build_poi.py`, qui produit `poi_europe.json`.
3. **Relief** : lancer `python3 build_relief.py`. Le script télécharge environ 680 tuiles Terrarium en zoom 7 depuis AWS Open Data et produit `relief_europe_z7.jpg`. Les limites de l'image sont affichées dans la console : les reporter dans `RELIEF_BOUNDS` (`js/map.js`).
4. Emballer les fichiers pour l'application :
   `(echo -n 'window.BASE_EUROPE='; cat base_europe.json; echo ';') > ../data/base_europe.js`, puis faire de même pour `POI_EUROPE`, et copier le JPEG dans `../data/relief_europe.jpg`.
