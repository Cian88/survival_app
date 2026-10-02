# Expédition et Signal — références et règles

Expédition est le mode clair ; Signal est le mode sombre. Le choix Clair / Sombre / Auto reste dans Paramètres → Apparence et est enregistré avec les données de l'application. Sur mobile, les paramètres sont accessibles par Plus.

## Références retenues

- [Bevel sur Refero Styles](https://styles.refero.design/style/c0717d1a-b446-4166-a445-6497fe287fea) : référence dominante du mode clair, fiche complète consultée sur le site public.
- [Linear sur Refero Styles](https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1) : référence dominante du mode sombre. La recherche avec le connecteur Refero a également fourni sa fiche complète (style `554b801c-3b31-4086-a7e5-ae613cdd618b`).
- [Préférences Linear](https://refero.design/pages/e0c336fa-04bf-4893-9018-a04b7bcdfbae) : écran réel consulté avec Refero pour le regroupement des réglages et la hiérarchie des surfaces.

Ces références sont adaptées à l'application existante. Le brief utilisateur demande des arrondis plus généreux que ceux de Linear : les deux modes partagent des cartes de 24 px, des contrôles de 14 px et des boutons en capsules. Les fonctionnalités et données restent celles de Holdout.

## Décisions de design

| Décision | Source et rôle | Adaptation à Holdout |
| --- | --- | --- |
| Blanc et bleu brume en clair | Bevel : canvas `#ffffff`, surfaces `#ebf0f8` | Cartes lisibles, sans ombre ni accumulation de bordures |
| Noir et graphite en sombre | Linear : `#08090a`, `#0f1011`, `#161718` | Surfaces différenciées par leur luminosité, contours fins |
| Sans empattements dans les deux modes | Typographie système de Bevel et hiérarchie de Linear | Titres et indicateurs dans une même famille, chiffres tabulaires |
| Bleu `#415eee` réservé aux métriques claires | Bevel : couleur de visualisation des données | Icônes et barres des réserves ; aucune action bleue universelle |
| Citron `#e4f222` réservé aux actions principales sombres | Linear : action principale | Classe explicite `.btn.primary` ; liens, cases et navigation restent neutres |
| Texte secondaire renforcé | Contraste sur les surfaces réellement utilisées | `#5d626b` en clair et `#a4a8b0` en sombre |
| Avertissements et dangers conservés | Sémantique métier existante | Les alertes restent distinguables des actions et sélections |
| Coins de 24 px et boutons capsules | Bevel + préférence explicite de l'utilisateur | Même géométrie dans les deux thèmes, sans diluer les palettes |
| Navigation latérale et barre mobile | Architecture Holdout | Quatre métriques sur ordinateur, deux colonnes sur mobile |
| Carte vectorielle locale | Illustration existante, rôle explicatif | Aperçu explicitement illustré, sans ajout de photos décoratives |

`--accent` sert aux liens, icônes et sélections neutres ; `--action` sert uniquement aux actions principales. Les préférences système utilisent les mêmes tokens que le mode sombre explicite. Les actifs restent locaux et disponibles hors ligne. Le cache applicatif passe à `holdout-v31`.

## Vérification

Contrôles navigateur avec un foyer de démonstration isolé : accueil, état des lieux, profil, sacs, stock maison, plan et paramètres, dans les deux thèmes, à 320, 390, 768, 820, 1024 et 1440 px. Soit 84 combinaisons sans débordement horizontal ni carte hors écran. Contrôle visuel sur ordinateur et téléphone, sélection de situation et case à cocher, choix du thème sombre conservé après rechargement. Aucun message d'erreur de console sur ce parcours.

Tests rapides du workflow de publication : cartes hors ligne, points OSM, catalogue, chiffrement du compte et synchronisation Premium. Cette vérification locale des interfaces ne remplace pas un essai sur matériel iOS natif.
