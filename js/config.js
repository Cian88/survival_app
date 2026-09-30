/* Configuration de la version Premium.
   - checkout : liens de paiement du prestataire choisi (Stripe, Lemon Squeezy, Paddle…), un par formule.
   - licensePublicKeyJwk : clé PUBLIQUE qui vérifie les licences hors ligne (générée par `node tools/license.mjs keygen`).
   - testMode : true tant que la clé de démonstration (tools/test-keys) est utilisée — à passer à false en production. */
window.KS_CONFIG = {
  prices: {
    monthly: { amount: 3.90, label: '3,90 €', per: 'par mois', note: 'Sans engagement, résiliable à tout moment' },
    annual: { amount: 29.90, label: '29,90 €', per: 'par an', note: 'Soit ≈ 2,49 € par mois' },
    lifetime: { amount: 59.90, label: '59,90 €', per: 'une seule fois', note: 'Accès à vie, mises à jour comprises' },
  },
  checkout: { monthly: '', annual: '', lifetime: '' },
  /* iOS (App Store) : identifiants des produits d'achat intégré créés dans App Store Connect.
     monthly et annual = abonnements auto-renouvelables (même groupe) ; lifetime = achat non consommable. */
  iap: { monthly: 'fr.kitsurvie.premium.mensuel', annual: 'fr.kitsurvie.premium.annuel', lifetime: 'fr.kitsurvie.premium.avie' },
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: '',
  renewUrl: '',
  supportEmail: '',
  licensePublicKeyJwk: {"kty":"EC","x":"5D2m2QBFvxmtR1TBmgCl2AznViS4Nwf0ceTGe3gaVA8","y":"L_Xj9xXf566lcNvwO56oHS40gopxIB9x8yUvPZNC_z0","crv":"P-256"},
  testMode: true,
  graceDays: 7,
};
