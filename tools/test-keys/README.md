# Clés de DÉMONSTRATION — ne jamais utiliser en production

Cette paire de clés sert uniquement à tester l'activation Premium (`js/config.js` → `testMode: true`).
La clé privée étant publique dans ce dépôt, **n'importe qui peut fabriquer des licences valides avec elle**.

Avant de vendre : `node tools/license.mjs keygen` (crée `license-keys/private.jwk`, ignoré par git, et remplace la clé publique dans `js/config.js`).

Licence de test (1 an) :
```
node tools/license.mjs issue --plan annual --email test@exemple.fr --key tools/test-keys/private.jwk
```
