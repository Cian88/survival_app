# Version Premium : fonctionnement et mise en vente

## Offres

| Formule | Prix TTC | Remarque |
|---|---:|---|
| Annuel | **29,90 €** par an | abonnement renouvelable, résiliable |
| À vie | **59,90 €** une seule fois | plus avantageux dès la 3e année |

Pas d'offre mensuelle.

Les prix se modifient dans `js/config.js` → `prices`.

## Gratuit ou Premium

Principe retenu : **tout ce qui sert à réagir en urgence reste gratuit**. Premium rend l'application personnelle et complète.

| Fonction | Gratuit | Premium |
|---|---|---|
| Instant T : actions par situation, numéros, position GPS | ✓ | ✓ |
| Carte Europe intégrée (relief, fond, nucléaire, barrages, centrales) | ✓ | ✓ |
| Cartes hors ligne IGN / relief | 1 pack, 1 000 km, détail 14 | illimitées, 1 000 km, détail 16, export/import `.kspack` |
| Points utiles hors ligne (OSM) | 1 zone | illimités |
| Profil : foyer, domicile, objectifs | ✓ | ✓ |
| Profil complet : santé, logement, environnement, compétences | — | ✓ |
| État des lieux : score et manques vitaux | ✓ | ✓ |
| État des lieux détaillé (≈ 50 besoins personnalisés) + liste de courses CSV | — | ✓ |
| Instant T personnalisé : votre matériel, ressources et dangers proches, cap vers le domicile et les RDV | — | ✓ |
| Sacs | 1 sac | un par personne + variantes lieu × climat |
| Stock maison | 15 articles | illimité |
| Calculateurs | eau, poids du sac, marche | les 9 |
| Terrain, matériel & budget, plan, notice, sauvegarde des données | ✓ | ✓ |

Les limites se règlent dans `js/premium.js` (`LIMITS`, `FREE_CALCS`).

## iOS : achats intégrés Apple obligatoires
Sur l'App Store, la règle 3.1.1 impose les achats intégrés d'Apple et **interdit les clés de licence**. L'application iOS utilise donc StoreKit (abonnement annuel, achat à vie, restauration des achats). Le système de licences décrit ci-dessous ne sert que pour la **version web**. Voir [`IOS.md`](IOS.md).

## Comment fonctionne la licence (version web, sans serveur, hors ligne)

1. L'acheteur paie par un **lien de paiement**.
2. Il reçoit une **clé de licence** `KS1.…` : un petit jeton JSON (formule, date d'expiration, e-mail masqué) **signé** avec votre clé privée (ECDSA P-256).
3. Il colle la clé dans l'onglet **★ Premium**. L'application vérifie la signature **sur l'appareil, sans Internet**, avec la clé publique incluse dans `js/config.js`.
4. Abonnements : la licence expire à la fin de la période payée, avec **7 jours de grâce** (`graceDays`). Le bouton « Renouveler en ligne » récupère une nouvelle clé si l'abonnement est toujours actif.

### Limites à connaître
- L'application étant **entièrement locale et en JavaScript lisible**, une personne techniquement motivée peut contourner les verrous en modifiant le code. Aucune application hors ligne n'y échappe complètement. La signature empêche la **fabrication** de fausses licences, pas la modification du code. Si le dépôt est **public**, tout le monde peut aussi récupérer le code.
- L'expiration dépend de l'horloge de l'appareil.
- Une licence n'est pas liée à un appareil : l'acheteur peut l'utiliser sur ses propres appareils.

## Clé administrateur
`node tools/license.mjs issue --plan admin --email vous@exemple.fr` crée une licence « admin », sans expiration, qui débloque tout. Elle est signée avec votre clé privée ; en mode test, ajoutez `--key tools/test-keys/private.jwk`. Ne la diffusez pas.

## Mise en vente : étapes

### 1. Votre clé de signature (obligatoire)
```sh
node tools/license.mjs keygen
```
- Cette commande crée `license-keys/private.jwk`. **Gardez cette clé secrète** : elle est exclue de git par `.gitignore`. Sauvegardez-la hors ligne, car si vous la perdez, vous ne pourrez plus émettre de licences.
- Elle remplace aussi la clé publique de démonstration dans `js/config.js` et passe `testMode` à `false`.
- La paire de clés de `tools/test-keys/` sert **uniquement aux tests**. Sa clé privée est publique, donc n'importe qui peut fabriquer des licences acceptées par cette clé.

### 2. Le prestataire de paiement (à choisir)
| Option | Abonnements | TVA européenne | Remarque |
|---|---|---|---|
| **Stripe** (Payment Links) | oui | à votre charge (Stripe Tax en option) | Modèle de service fourni : `tools/licence-worker.js` |
| **Lemon Squeezy** / **Paddle** | oui | gérée par eux (*Merchant of Record*) | Ils vendent pour votre compte et gèrent TVA et factures. Commission plus élevée. Adaptateur à écrire |
| Liens de paiement de votre banque (ex. Qonto) | à vérifier | à votre charge | Possible pour l'offre « à vie » (paiement unique) ; licence à émettre à la main avec `tools/license.mjs issue` |

Frais, fonctionnalités et conditions de ces prestataires **n'ont pas été vérifiés ici** : comparez-les sur leurs sites.

### 3. Avec Stripe (modèle fourni)
1. Créez 2 prix : 29,90 €/an (récurrent) et 59,90 € (paiement unique). Créez ensuite 2 **Payment Links**.
2. Pour chaque lien, dans l'onglet *After payment*, choisissez la redirection vers `https://<votre-worker>/licence?session_id={CHECKOUT_SESSION_ID}`. Stripe remplace ce champ par l'identifiant de la session ([doc Stripe](https://docs.stripe.com/payment-links/post-payment)).
3. Déployez `tools/licence-worker.js`, par exemple sur Cloudflare Workers, avec les secrets `STRIPE_SECRET_KEY`, `LICENCE_PRIVATE_JWK`, `PRICE_ANNUAL` et `PRICE_LIFETIME`.
4. Dans `js/config.js`, renseignez `checkout.annual`, `checkout.lifetime` (les URL des Payment Links), `renewUrl` (`https://<votre-worker>/renew`) et `supportEmail`.
5. Testez de bout en bout en **mode test Stripe** avant de passer en production.

Le modèle de service a été contrôlé ici pour la signature : ses licences sont acceptées par l'application. L'appel à Stripe, lui, **n'a pas pu être testé** sans compte. À vérifier : sur les versions récentes de l'API Stripe, `current_period_end` se trouve dans les éléments de l'abonnement ; le modèle lit les deux emplacements.

### 4. Obligations légales (à faire valider par un professionnel)
- **Droit de rétractation** : pour un contenu numérique, il peut ne pas s'appliquer si l'exécution commence avec l'**accord préalable exprès** du consommateur, qui **reconnaît perdre** ce droit ([art. L221-28 du Code de la consommation](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170)). L'onglet Premium demande de cocher cet accord avant d'ouvrir le paiement. Conservez aussi une preuve côté prestataire, par exemple via les conditions acceptées au paiement.
- **CGV, mentions légales, politique de confidentialité**, facturation, et régime de **TVA** : franchise en base, ou TVA du pays de l'acheteur pour les ventes en ligne dans l'UE au-delà des seuils. **Je ne peux pas confirmer** les règles applicables à votre situation : voyez un expert-comptable.
- La confidentialité est un argument de vente réel : aucune donnée ne quitte l'appareil. La licence ne contient qu'un e-mail masqué et une empreinte partielle.
