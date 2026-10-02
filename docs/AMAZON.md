# Liens Amazon, programme Partenaires et prix officiels

Chaque objet conseillé par l'application (catalogue, objets des sacs, ajouts selon l'environnement) existe en **3 gammes de budget** : petit budget, budget moyen, gros budget. Chaque gamme a un modèle, un prix indicatif et un lien **Amazon.fr**.

| Élément | Fichier |
|---|---|
| Modèles, requêtes de recherche, prix indicatifs, poids (142 objets × 3 gammes) | `js/gear-tiers.js` |
| Construction des liens, mention Partenaire, prix officiels côté application | `js/shop.js` |
| Réglages : identifiant Partenaires, prix officiels | `js/config.js` → `amazon` |
| Prix officiels côté serveur (API Amazon, tâche horaire, route `/shop/prices`) | `server/src/amazon.js`, `server/migrations/0002_boutique.sql` |
| Contrôles (données, liens, sacs, signature AWS, tâche simulée) | `tools/test-shop.mjs` |
| Liste lisible pour relecture | `docs/MATERIEL.md` (`node tools/build-materiel.mjs`) |

## État actuel (02/10/2026)

- **Liens** : recherches Amazon.fr ciblées (`https://www.amazon.fr/s?k=marque+modèle`). Elles fonctionnent tant que le produit existe et restent valides si une fiche disparaît.
- **Affiliation** : aucune. `amazon.tag` est vide, donc aucun tag dans les liens et aucune mention « Partenaire ».
- **Prix** : estimations du marché, affichées « ≈ … € indicatif ». Elles ont été établies par recherche web : Amazon bloque la consultation automatique, donc ni la disponibilité ni le prix exact n'y ont été vérifiés produit par produit. **À relire avant l'ouverture des liens affiliés.**
- **Objets sans lien** : comprimés d'iode (médicament, en pharmacie) et espèces.

## Étape 1 : activer l'affiliation (dès l'inscription au programme)

1. S'inscrire sur [partenaires.amazon.fr](https://partenaires.amazon.fr) et déclarer le site `hold-out.app` et l'application. Amazon attribue un identifiant du type `holdout-21`.
2. Dans `js/config.js`, renseigner `amazon: { tag: 'holdout-21', prices: false }`. Le tag est ajouté à tous les liens (paramètre `tag`), et la mention obligatoire s'affiche sous chaque liste : « En tant que Partenaire Amazon, Holdout réalise un bénéfice sur les achats remplissant les conditions requises. »
3. Sur le site, page **Mentions légales** (`site/pages/mentions-legales.html`, section « Liens vers Amazon ») : remplacer « À ce jour, ces liens ne sont pas des liens affiliés » par la même mention.
4. Pousser sur `main` : la CI teste et publie.

Points à respecter (conditions du programme, à relire au moment de l'inscription) :
- Ne pas afficher de prix Amazon « en dur » présentés comme des prix Amazon : l'application affiche des **prix indicatifs** clairement signalés, ou les prix de l'API datés (étape 2).
- Les liens sont marqués `rel="sponsored"`.
- Amazon valide le compte après **3 ventes en 180 jours** ; sans ventes, le compte est fermé.
- iPhone : Apple accepte les liens d'affiliation vers des produits physiques (ce ne sont pas des achats intégrés).

## Étape 2 : prix officiels (quand Amazon ouvre l'accès à son API)

L'accès à l'API (Product Advertising API 5.0) est accordé après les premières ventes validées. Ensuite :

1. Dans Partenaires Amazon → Outils → Product Advertising API, créer des identifiants (clé d'accès et clé secrète).
2. Les ajouter comme **secrets** du Worker, sans les écrire dans le dépôt :
   ```
   cd server
   npx wrangler secret put AMAZON_ACCESS_KEY
   npx wrangler secret put AMAZON_SECRET_KEY
   npx wrangler secret put AMAZON_PARTNER_TAG   (le même identifiant, ex. holdout-21)
   ```
3. Attendre une heure (tâche planifiée à la 17ᵉ minute) puis vérifier : `curl https://api.hold-out.app/shop/prices` doit renvoyer des prix ; le journal du Worker (`npx wrangler tail`) affiche « prix Amazon {"done":40,"of":40} ».
4. Dans `js/config.js`, passer `prices: true` et publier. L'application récupère les prix au plus une fois par heure quand elle est en ligne, les affiche avec leur date (« Amazon, 2 oct. 14:17 ») et revient à l'estimation au-delà de 24 h, comme l'exige Amazon. Le lien pointe alors vers la fiche produit trouvée (avec le tag) plutôt que vers la recherche.

Fonctionnement côté serveur : chaque heure, les 40 offres les plus anciennes sont mises à jour (1 requête par seconde, quota de départ d'Amazon). Les 426 offres sont donc toutes rafraîchies environ deux fois par jour. Une offre sans ASIN est d'abord cherchée par sa requête (première réponse retenue), puis suivie par ASIN. Pour imposer un produit précis, ajouter `"asin": "B0…"` à la gamme dans `js/gear-tiers.js`.

**À vérifier à la mise en service** : le code n'a pas pu être testé contre l'API réelle, faute de clés. La signature AWS est validée par le vecteur de test officiel d'AWS, et la tâche par une API simulée (`tools/test-shop.mjs`). Amazon fait évoluer cette API (passage des ressources `Offers` à `OffersV2`, annonces de remplacement de l'API) : relire sa documentation et ajuster `server/src/amazon.js` si besoin.

## Modifier les produits conseillés

Éditer `js/gear-tiers.js` (une ligne par objet) : `model` (nom affiché), `q` (recherche Amazon, en minuscules, sans ponctuation), `price` (prix indicatif), `weight_g` et `note` facultatifs. Puis :

```
node tools/test-shop.mjs        # contrôle : 3 gammes, prix croissants, marques vendues sur Amazon, cohérence des sacs
node tools/build-materiel.mjs   # met à jour docs/MATERIEL.md
```

Les clés des ajouts par environnement (« ville:0 ») suivent l'ordre de la liste `add` de `js/env.js` : si vous insérez ou retirez un ajout, renumérotez ces clés (le test le signale).
