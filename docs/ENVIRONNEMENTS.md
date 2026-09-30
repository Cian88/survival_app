# Variantes du sac d'évacuation selon l'environnement : risques, matériel, réflexes

*Recherche réalisée le 30/09/2026 pour une application de préparation aux crises en Europe. Données structurées intégrées à l'application dans `js/env.js` (8 variantes).*

## Méthode et conventions

- **Sources.** J'ai d'abord cherché des praticiens : The Prepared (guides et forum), Andrew Skurka, un formateur ex-sapeur-pompier (chaîne *Apprendre Préparer (Sur)vivre*), le PGHM, le Club Alpin Suisse, l'ANENA, la FFRandonnée et FerFAL. Je les ai complétés par des sources médicales et de secours pour la physiologie : Wilderness Medical Society (WMS), UIAA MedCom, OMS, Santé publique France, ARS, Météo-France et ANSM. J'ai aussi utilisé des manuels militaires pour les chiffres d'eau et de calories.
- **Références.** `[clé]` renvoie au tableau des sources en fin de document, qui donne l'URL et la date. **[non vérifié]** signale une page que je n'ai pas pu lire en entier : j'ai alors travaillé à partir d'un extrait de recherche ou d'une citation relayée.
- **Écarts entre sources.** Ils sont signalés par **⚠ Divergence** et regroupés en section 9.
- **Limites des sites officiels.** Je n'ai pas pu consulter directement les pages de securite-civile.interieur.gouv.fr (Cloudflare), ameli.fr et georisques.gouv.fr (erreurs 403/503). Leurs consignes sont couvertes par les pages ARS et Météo-France équivalentes.

## 0. Combiner les deux axes (lieu × climat)

1. **Sac final = sac de base + ajouts « lieu » + ajouts « climat ».** Exemple : « ville × chaud » = FFP2, gants et espèces, plus eau doublée, sels et chapeau.
2. **Conflits à arbitrer :**
   - **Coton.** À proscrire dans le froid et l'humidité [tp_wint][skurka_rain], mais recommandé face au feu, car le synthétique fond [fdf_conf]. **La laine répond aux deux cas.** Pour « forêt × froid/humide », choisir une sous-couche mérinos et une veste en laine ou en coton épais.
   - **Eau.** « Chaud » double la dotation [tp_bob]. « Froid » impose des pastilles plutôt qu'un filtre, qui peut geler [tp_cold].
   - **Masque FFP2.** Utile partout (fumées, poussières, nettoyage après sinistre), mais il ne filtre pas les gaz [epa].
3. **Rotation saisonnière** des vêtements du sac deux fois par an, au début de l'été et de l'hiver (pratique de The Prepared) [tp_bob].

---

## 1. Ville / milieu urbain dense

**Risques**
- **Incendie d'immeuble.** « La fumée est souvent plus mortelle que le feu. » Ne jamais prendre l'ascenseur ; ne pas sortir dans une cage d'escalier enfumée [crf].
- **Évacuation par escaliers.** À l'évacuation du WTC, des chaussures inadaptées, la congestion et les personnes à mobilité réduite ont ralenti l'évacuation [wtc].
- **Verre et gravats.** Des praticiens urbains emportent « des gants de travail pour déplacer la maçonnerie cassée et le verre » (forum, 2021) [tp_urban].
- **Foules.** Risque d'écrasement au-delà d'environ 4–5 personnes/m² [gkstill] **[non vérifié]**.
- **Îlot de chaleur urbain.** Jusqu'à +10 °C en centre-ville pendant les vagues de chaleur ; Paris jusqu'à +6,5 °C [icu].
- **Paiement et réseaux.** Pendant le blackout ibérique d'avril 2025, les paiements par carte ont chuté de 41–42 % ; terminaux, DAB et Bizum sont restés hors service des heures [ecb]. L'électricité fait aussi fonctionner le pompage de l'eau et les ascenseurs [ferfal].
- **Sous-sols et parkings en crue.** À Valence (DANA 2024), 32 des 214 victimes recensées au 18/11/2024 ont été retrouvées dans des garages [dana].
- **Pillage.** Un fil de forum de praticiens relaie un témoignage du séisme chilien de 2010 : « les bons quartiers peuvent se dégrader très vite », « ayez des espèces » [tp_urban]. La sociologie des catastrophes juge les pillages « très rares » et l'entraide majoritaire [peek]. **⚠ Divergence.**
- **Pénurie rapide en magasin** (souvent citée) : **[non vérifié]**, aucune source chiffrée fiable trouvée.

**Ajouter ou renforcer**
- FFP2 + **lunettes étanches**. L'ex-pompier formateur juge le FFP2 « la base » mais « pas dingue » et insiste sur les lunettes [aps_feu].
- Gants de travail [tp_urban] et chaussures de marche fermées [wtc].
- Lampe frontale : « votre meilleure amie » pendant les coupures [ferfal].
- Espèces : 70–100 €/personne, ou de quoi couvrir 72 h [ecb].
- Clé de robinet de façade (*silcock key*) pour certains points d'eau d'immeubles [tp_bob].
- Pastilles ou filtre, et **repérage préalable des fontaines publiques**, parfois cachées dans des cours ou des ruelles [aps_ville].
- Radio à piles [ars_inond].

**Alléger :** tente, hache et scie. En ville, l'évacuation mène le plus souvent chez des proches, à l'hôtel ou en centre d'accueil [tp_urban].

**Quantités :** eau dans le sac ≈ 1 L [tp_bob] ; survie 2,5–3 L/pers./jour [who_tn9] ; espèces 70–100 €/pers. [ecb].

**Réflexes**
1. Escaliers, jamais l'ascenseur ; fermer les portes sans les verrouiller [crf].
2. Cage d'escalier enfumée : rester chez soi, calfeutrer avec des linges humides, se signaler à la fenêtre [crf].
3. En crue, ne jamais descendre au sous-sol ou au parking [ars_inond].
4. Repérer à l'avance fontaines et points d'eau [aps_ville].
5. En canicule, rejoindre un lieu frais : la ville ne refroidit pas la nuit [icu].
6. Toujours garder des espèces sur soi [ecb].

**Erreurs fréquentes :** prendre l'ascenseur [crf] ; évacuer en chaussures de ville [wtc] ; descendre « sauver la voiture » [dana] ; dépendre de la carte bancaire [ecb].

---

## 2. Campagne / plaine / périurbain

**Risques**
- **Coupures longues.** Après les tempêtes de 1999, 3,5 millions de foyers ont été privés d'électricité [tempete99].
- **Eau privée.** Puits, forages et eaux de pluie sont « considérées a priori comme non potables car non contrôlées » [ars_puits].
- **Tiques** [ars_tique].
- **Zones blanches.** Le 114 par SMS reste possible quand la couverture est très faible [ffr_zb].
- **Chasse et battues** [ffr_chasse].
- **Feux de végétation** : 9 sur 10 d'origine humaine [pompiers].
- **Foudre** en terrain dégagé [orage].

**Ajouter :** tire-tique et vêtements longs [ars_tique] ; traitement de l'eau [ars_puits] ; vêtement orange fluo [ffr_chasse] ; sifflet et couverture de survie [ffr_hiver] ; carte papier et boussole [tp_bob] ; radio [ars_inond].

**Alléger :** la clé de robinet urbaine [tp_bob].

**Quantités :** eau de boisson 2,5–3 L/j sans compter sur le puits [who_tn9] ; autonomie de plusieurs jours de coupure [tempete99].

**Réflexes**
1. S'inspecter après chaque sortie (pliures, aine, arrière du genou, cuir chevelu) et retirer toute tique au plus tôt [ars_tique].
2. Considérer toute eau de puits comme non potable [ars_puits].
3. Vérifier la couverture réseau de l'itinéraire ; 114 par SMS si elle est faible [ffr_zb].
4. Porter des couleurs vives en saison de chasse [ffr_chasse].
5. En orage, quitter les étendues dégagées et les arbres isolés [orage].
6. Pas de feu ni de cigarette près des champs secs [pompiers].

**Erreurs :** boire l'eau du puits sans traitement [ars_puits] ; tenue sombre pendant une battue [ffr_chasse] ; s'abriter sous un arbre isolé [orage] ; compter uniquement sur le mobile [ffr_zb].

---

## 3. Montagne (moyenne et haute)

**Risques**
- **Orages et crues l'après-midi.** Le PGHM de Corse (2023) recommande d'être redescendu vers 13–14 h si l'orage est annoncé [pghm_corse].
- **Froid lié à l'altitude.** Environ −0,65 °C par 100 m [gradient] **[non vérifié : extrait de recherche]**.
- **UV.** Environ +10 % par 1 000 m ; la neige réfléchit jusqu'à 80 % des UV [who_uv].
- **Avalanches.** Saison 2024-2025 : 126 accidents, 21 morts [anena_bilan]. 90 % de survie si la victime est dégagée dans les 15 premières minutes [anena_15].
- **Mal aigu des montagnes** au-delà de 2 500 m (symptômes en 4–12 h) ; l'œdème cérébral de haute altitude peut tuer en 24 h [wms_cold].
- **Absence de réseau** [cas].
- **Isolement de vallées.** La tempête Alex (2020) a détruit routes et ponts de la Roya et de la Vésubie [alex].
- **Foudre** [orage].

**Ajouter**
- Coupe-vent et doudoune **même en été**. Le PGHM de Corse : « même si quand on part il peut faire chaud… » [pghm_corse].
- Lunettes, casquette, crème solaire [who_uv].
- Couverture de survie, sifflet, téléphone avec le 112 [ffr_hiver].
- PLB ou communicateur satellite, et batterie externe : avoir deux moyens d'alerte [cas].
- Frontale [ffr_hiver].
- Sur neige hors domaine sécurisé : **le « trio indispensable » DVA–pelle–sonde, avec une formation régulière** [anena_mat].

**Alléger :** le coton, à remplacer par le système 3 couches [ffr_hiver].

**Quantités**
- L'effort en altitude peut demander « plus du double » de l'énergie nécessaire au niveau de la mer, alors que l'appétit baisse (UIAA) [uiaa_nut].
- Au-delà de 3 000 m : ne pas monter l'altitude de nuit de plus de 500 m par jour ; une journée de repos tous les 3–4 jours (WMS 2024) [wms_alt].

**Réflexes**
1. Consulter la météo et le BERA ; partir tôt [pghm_corse].
2. Donner son itinéraire et son heure de retour à un proche [pghm_corse].
3. Orage : s'accroupir pieds joints sur le sac, poser les bâtons à distance, s'espacer de 3–5 m [orage].
4. Sans réseau : gagner un point haut, économiser la batterie, tenter le SMS [cas].
5. Renoncer en cas de doute ; ne pas surestimer ses capacités [pghm_corse].
6. S'entraîner au DVA [anena_mat].

**Erreurs :** tenue d'été sans couche chaude [pghm_corse] ; croire que la tente protège de la foudre [orage] ; DVA sans formation [anena_mat] ; monter trop vite [wms_cold].

---

## 4. Forêt (dont feu de forêt)

**Risques**
- **Feu.** 9 feux sur 10 sont d'origine humaine [pompiers]. En un point donné, le front passe en 2 à 10 minutes : « la route au dernier moment est le pire choix » [fdf_conf].
- **Fumées.** Un masque N95/FFP2 filtre les particules, pas le CO ni les gaz [epa].
- **Après tempête.** Des arbres fragilisés et des branches restées suspendues tombent encore pendant plusieurs jours [onf].
- **Tiques** [ars_tique] ; **chasse** [ffr_chasse].

**Ajouter**
- FFP2 + lunettes étanches, gants de cuir épais [aps_feu].
- **Vêtements couvrants en coton ou en laine, jamais synthétiques**, et chaussures fermées [fdf_conf].
- Linge à humidifier pour couvrir le nez et la bouche [pompiers].
- Radio à piles et lampe [fdf_conf] ; tire-tique [ars_tique].

**Alléger ou restreindre :** l'allumage de feu. La consigne est de ne pas allumer de feu en forêt, barbecue compris [dfci].

**Quantités :** en climat chaud, jusqu'au double de la réserve d'eau du sac [tp_bob].

**Réflexes**
1. Sans ordre d'évacuation et avec le feu proche : **se confiner** dans une maison solide et débroussaillée. Fermer volets et aérations, couper VMC et climatisation, calfeutrer avec des linges humides, couper le gaz, remplir baignoire et seaux [fdf_conf].
2. N'évacuer que sur ordre des autorités [crf].
3. En voiture : ne jamais traverser la fumée ; s'arrêter en zone dégagée, feux et warnings allumés, moteur coupé ; rester sous le niveau des vitres [fdf_car][psfdf]. **⚠ Divergence**, voir section 9.
4. Alerter au 112 ou 18 ; SMS au 114 [pompiers].
5. Avant un trajet estival : consulter la vigilance et respecter les fermetures de massifs [psfdf].
6. Après une tempête, ne pas entrer en forêt tant qu'elle n'est pas sécurisée [onf].

**Erreurs**
- Fuir tard par une route forestière [fdf_conf]. Le formateur ex-pompier cite des évacuations tardives mortelles en Espagne (« 13 morts ») **[non vérifié]** [aps_feu].
- Se réfugier dans la piscine, observer le feu depuis la terrasse, porter du synthétique [fdf_conf].
- Stationner sur l'herbe sèche [dfci].

---

## 5. Littoral / zones inondables / zones humides

**Risques**
- **Hauteurs d'eau.** 30 cm d'eau peuvent emporter un véhicule ; « une voiture n'est pas un abri » [ars_inond]. 15 cm d'eau en mouvement peuvent faire tomber un adulte [nws].
- **Pièges fermés.** À Valence (DANA 2024), 65 victimes dans des logements et 32 dans des garages sur 214 [dana].
- **Submersion nocturne.** Xynthia a fait 29 morts à La Faute-sur-Mer, « piégées en pleine nuit », souvent dans des maisons de plain-pied [xynthia]. Une seule vague peut emporter un passant [mf_vs].
- **Électrocution et explosion** ; après la crue, eau du robinet à confirmer, aliments à jeter, CO des nettoyeurs thermiques [ars_inond].
- **Choc thermique** en eau à moins de 15 °C [rnli].
- **Leptospirose.** L'urine de rat survit dans la boue et l'eau (données de La Réunion) [spf_lepto].
- **Moustique tigre** : 81 départements colonisés début 2025 [spf_moust].

**Ajouter**
- Doublure étanche du sac (sac-poubelle épais, méthode Skurka) [skurka_down].
- Bottes, gants et pansements étanches [spf_lepto].
- Lampe et sifflet pour se signaler depuis l'étage ; radio, téléphone chargé, ordonnances et papiers [ars_inond].
- Pastilles ou filtre [ars_inond] ; répulsif [spf_moust].
- Gilet de flottaison : **[non vérifié]**, aucune source consultée ne le recommande pour le grand public.

**Alléger :** le coton [skurka_rain].

**Quantités :** tenir environ 72 h à domicile isolé : eau, nourriture, lait infantile, vêtements chauds, couvertures [ars_inond]. Eau en bouteille ou traitée tant que la mairie n'a pas confirmé la potabilité [ars_inond].

**Réflexes**
1. Monter à l'étage, dans une pièce avec une ouverture vers l'extérieur [ars_inond].
2. Couper gaz, chauffage et électricité dès que l'eau monte [ars_inond].
3. Ne pas aller chercher les enfants à l'école [ars_inond].
4. Pas de voiture ; faire demi-tour devant une route inondée [nws].
5. Vigilance vagues-submersion orange ou rouge : s'éloigner du littoral, gagner le point le plus haut [mf_vs].
6. Chute en eau froide : flotter 60–90 s avant d'agir [rnli].
7. Suivre la vigilance Météo-France et Vigicrues [ars_inond].

**Erreurs :** retourner chercher des affaires, descendre au sous-sol [ars_inond] ; traverser l'eau [nws] ; toucher un appareil électrique mouillé ; groupe électrogène ou nettoyeur thermique à l'intérieur [ars_inond] ; nager tout de suite après la chute [rnli].

---

## 6. Chaud / canicule / sec

**Risques**
- **Coup de chaleur** : urgence vitale, appeler le 15 ou le 112 [santefr_chaleur].
- **Mortalité.** Plus de 5 700 décès attribuables à la chaleur à l'été 2025, dont environ trois quarts chez les 75 ans et plus [spf_2025].
- **Canicule** (vigilance orange) = au moins 3 jours et 3 nuits de chaleur intense [mf_canicule].
- **Hyponatrémie.** Boire trop pendant un effort prolongé en est la cause principale [wms_eah].
- **Médicaments** dégradés dans un coffre ou un habitacle au soleil [ansm].
- **Nuits froides** en milieu sec [fm2176] ; **feux** [pompiers].

**Ajouter**
- Eau : jusqu'au double de la dotation du sac [tp_bob].
- Sels ou aliments salés contre l'hyponatrémie [tp_heat].
- Chapeau, lunettes, crème solaire [pghm_corse].
- Vêtements amples et clairs [santefr_chaleur]. Le coton convient à la chaleur, alors que « le coton tue » au froid [tp_heat].
- Brumisateur [santefr_chaleur] ; bâche ou couverture de survie pour faire de l'ombre [tp_heat] ; pochette isotherme pour les médicaments [ansm].

**Alléger :** les couches isolantes épaisses, en gardant une couche pour la nuit [fm2176].

**Quantités**
- Grand public : au moins 1,5–2 L/j, davantage en cas d'effort [santefr_chaleur].
- Travail en chaleur (soldat acclimaté) : ≈ 0,5–1 L/h selon l'effort ; **plafond ≈ 1,4 L/h et ≈ 11 L/j** [army_wr].
- FM 21-76 : 19 L/j pour un travail dur au soleil à 43 °C [fm2176]. **⚠ Divergence** avec ce plafond.
- Survie : 2,5–3 L/j « selon le climat » [who_tn9].

**Réflexes**
1. Se déplacer aux heures fraîches ou de nuit [fm2176].
2. Réduire l'effort à environ 60 % aux heures chaudes [tp_heat].
3. Se mouiller visage et avant-bras ; fermer les volets le jour, aérer la nuit [santefr_chaleur].
4. Coup de chaleur : **refroidir d'abord** (immersion en eau froide), puis transporter ; appeler le 15 ou le 112 [wms_heat][santefr_chaleur].
5. Personnes âgées : boire sans attendre la soif, qui diminue avec l'âge [santefr_chaleur].
6. Adulte actif : boire selon la soif [wms_eah]. **⚠ Divergence.**
7. Surveiller la couleur des urines (conseil de praticien) [tp_heat].

**Erreurs :** boire massivement sans sel [wms_eah] ; alcool, boissons très sucrées ou caféinées [santefr_chaleur] ; médicaments dans la voiture [ansm] ; ventilateur au-dessus d'environ 35 °C [tp_heat] ; rationner l'eau (« rationner la sueur, pas l'eau », attribué à Cody Lundin) **[non vérifié]** [lundin].

---

## 7. Froid / hiver (neige, gel)

**Risques**
- **Hypothermie.** Stade 1 entre 35 et 32 °C de température centrale [wms_hypo]. Possible jusqu'à environ 10 °C (50 °F) avec sueur, pluie ou immersion [tp_cold].
- **Gelures.** Risque dès 0 °C, qui augmente sous −15 °C ; la WMS a abaissé ce seuil en 2024 [wms_cold].
- **Vent.** Par −18 °C, un vent modéré équivaut à −30 °C ; gelure en moins de 30 minutes [tp_cold].
- **Monoxyde de carbone** : première cause de mort toxique accidentelle en France [ars_co]. En cause : chauffages d'appoint, braseros, groupes électrogènes [ars_co_bzh][mf_froid].
- **Verglas**, aggravation des maladies cardiaques et respiratoires [mf_froid].
- **Filtres à eau** qui gèlent et cassent [tp_cold].

**Ajouter**
- Système 3 couches : sous-couche mérinos ou synthétique, polaire, doudoune, coque [tp_wint].
- Bonnet, moufles par-dessus des gants fins, chaussettes laine épaisses de rechange [tp_wint].
- Chaufferettes [wms_cold][tp_wint].
- **Isolation du sol** : le sol froid vole plus de chaleur que l'air [tp_cold].
- Thermos [mf_froid] ; pastilles ou ébullition plutôt qu'un filtre seul [tp_cold].
- Kit voiture : pelle, chaînes, couvertures [tp_wint].

**Alléger :** jean, sweat en coton, pulls lourds [tp_wint].

**Quantités**
- 4 500 kcal/j : ration grand froid de l'armée US, pour un effort au froid [iom_cold]. C'est un ordre de grandeur, **pas une norme civile**.
- Personne consciente qui frissonne : liquides et aliments riches en glucides [wms_hypo].
- Continuer à boire [tp_cold].

**Réflexes**
1. Retirer une couche **avant** l'effort : la sueur refroidit [tp_wint].
2. Porter la gourde tête en bas, pour que le goulot ne gèle pas [tp_cold].
3. Se coucher le ventre plein, avec une bouteille d'eau chaude dans le duvet [tp_cold].
4. Gelure : pas de réchauffement s'il y a un risque de regel ; réchauffer dans l'eau à 37–39 °C pendant environ 30 min [wms_cold].
5. Groupe électrogène toujours dehors ; chauffage d'appoint jamais en continu [ars_co_bzh] **[extrait de recherche]**.
6. Faire fondre la neige, ne pas la manger ; rester là où l'on sera trouvé [tp_cold].

**Erreurs :** coton ; alcool [tp_cold][tp_wint] ; vêtements serrés [wms_cold] ; brasero ou barbecue en intérieur [mf_froid] ; manger de la neige [tp_cold].

---

## 8. Humide / pluvieux

**Risques**
- **On finit mouillé.** Les vestes imperméables-respirantes condensent la sueur et finissent par prendre l'eau [skurka_rain].
- **Hypothermie par temps doux** [tp_cold]. En hiver, « les vêtements mouillés ne sèchent pas » [ffr_hiver].
- **Pied d'immersion** (lésion par froid sans gel). Il apparaît en général après un à trois jours les pieds mouillés et froids, ou dès 14–22 h dans l'eau de mer à 0–8 °C. Les victimes sont souvent immobiles, épuisées et mal nourries [nfci].
- **Isolants.** Aucun n'est chaud mouillé ; le synthétique garde un avantage relatif en humidité prolongée [skurka_down].
- **Crues d'orage** et traversées de cours d'eau [pghm_corse].

**Ajouter**
- Veste et pantalon de pluie [skurka_rain] ; doublure étanche du sac [skurka_down].
- **Tenue de nuit dédiée, toujours sèche** (« une demi-livre », ≈ 225 g) [skurka_rain].
- Chaussettes de rechange [nfci].
- Allume-feu fiable par temps humide (coton vaseliné) et bâche [tp_bob].

**Alléger :** le coton [tp_wint].

**Quantités :** au moins une paire de chaussettes sèches par jour. En 1914-1918, des chaussettes sèches distribuées chaque soir ont éliminé le pied de tranchée [nfci].

**Réflexes**
1. Faire un **séchage** dès que possible (« reset dry ») [skurka_rain].
2. Rester actif, manger, sécher ses pieds au repos [nfci].
3. Ne mettre la tenue sèche que pour dormir [skurka_rain].
4. Suivre la vigilance et Vigicrues [ars_inond].
5. Ne pas traverser un cours d'eau en crue [pghm_corse].

**Erreurs :** croire que le synthétique reste chaud trempé [skurka_down] ; dormir mouillé [skurka_rain] ; rester immobile les pieds mouillés [nfci] ; camper dans un lit de rivière [fm2176].

---

## 9. Divergences entre sources (à trancher dans l'app)

1. **Boire « sans attendre la soif » ou « selon la soif ».** Santé.fr recommande de boire sans attendre la soif, surtout pour les personnes âgées [santefr_chaleur], et The Prepared de boire régulièrement [tp_heat]. La WMS recommande de boire selon la soif pendant l'effort, pour éviter l'hyponatrémie [wms_eah]. *Pistes :* sans attendre la soif pour les personnes âgées ou sédentaires en canicule ; selon la soif, avec du sel, pour un adulte qui marche avec le sac.
2. **Eau maximale par jour.** Le TB MED 507 plafonne à ≈ 11 L/j et ≈ 1,4 L/h [army_wr] ; le FM 21-76 cite 19 L/j dans un cas extrême [fm2176]. *Piste :* afficher le plafond.
3. **Voiture et feu de forêt.** Pompiers.fr : se mettre à l'abri dans une habitation, « ne vous confinez pas dans une voiture » [pompiers]. feuxdeforet.fr et PSFDF : si l'on est surpris au volant, rester dans l'habitacle, plus sûr que dehors [fdf_car][psfdf]. *Lecture compatible :* ne pas *choisir* la voiture comme refuge, mais ne pas en sortir si l'on est piégé.
4. **Chauffage d'intérieur.** The Prepared admet un chauffage au propane homologué pour l'intérieur, avec une fenêtre entrouverte et un détecteur de CO [tp_wint]. Les ARS : jamais en continu, uniquement par intermittence [ars_co_bzh]. *Pour la France, suivre l'ARS.*
5. **Coton.** Bon au chaud et face au feu [tp_heat][fdf_conf], à proscrire au froid et à l'humidité [tp_wint]. Compromis : la laine.
6. **Pillage.** Des témoignages de praticiens le rapportent [tp_urban] ; la sociologie le juge rare [peek]. Un autre praticien note qu'être en ville n'est pas forcément pire : « cela dépend entièrement de la crise » [tp_urban].
7. **Règle « 1-10-1 » en eau froide** (1 min de choc, 10 min de mouvements utiles, 1 h avant l'inconscience). Le National Center for Cold Water Safety la qualifie de mythe : l'incapacité peut survenir en 2–10 min dans l'eau proche de 0 °C [ncws]. Le RNLI enseigne de flotter 60–90 s [rnli]. *Piste :* utiliser le message du RNLI, pas la règle 1-10-1.
8. **Mortalité par avalanche.** On lit souvent « ~30 morts/an » ; l'ANENA recense 13 décès (2023-24) et 21 (2024-25) [anena_bilan]. Citer le dernier bilan.
9. **Pied d'immersion.** Certaines sources grand public évoquent un risque à 20 °C ou en moins d'une heure ; Zafren (2021) juge ces affirmations non étayées [nfci].

## 10. Limites

- Plusieurs pages officielles ont bloqué l'outil : securite-civile.interieur.gouv.fr, ameli.fr, georisques.gouv.fr.
- Certaines pages n'ont été lues que via un extrait de recherche (G. K. Still, EPA, ARS Bretagne, gradient thermique) : elles sont marquées dans les tableaux.
- Le chiffre de 4 500 kcal est militaire (effort au froid) : pour un civil moins actif, rester sur « + calories, + glucides si frissons ».
- L'éditeur de feuxdeforet.fr n'est pas identifié ; son contenu recoupe celui de PSFDF et de la Croix-Rouge.

## Sources (clé, date, URL)

| Réf. | Source | Date | URL |
|---|---|---|---|
| wms_hypo | WMS – Accidental Hypothermia CPG, 2019 Update (Dow et al.) | déc. 2019 | https://journals.sagepub.com/doi/full/10.1016/j.wem.2019.10.002 |
| wms_heat | WMS – Heat Illness CPG, 2024 Update (Eifling et al.) – résumé | mars 2024 | https://pubmed.ncbi.nlm.nih.gov/38425235/ |
| wms_cold | Synthèse des guidelines WMS 2024 altitude/froid (IJERPH) – gelures, MAM | 14 févr. 2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11855094/ |
| wms_eah | WMS – Exercise-Associated Hyponatremia CPG (Bennett et al.) | 2020 (update 2019) | https://journals.sagepub.com/doi/10.1016/j.wem.2019.11.003 |
| wms_alt | WMS 2024 Acute Altitude Illness – résumé Medscape | non datée (résumé Medscape du CPG WMS 2024) | https://reference.medscape.com/cc2/p10/wms-altitude-illness-high-altitude-pulmonary-edema-guideline-2026a1000m91 |
| nfci | Zafren – Nonfreezing Cold Injury (Trench Foot), IJERPH | 6 oct. 2021 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8508462/ |
| army_wr | US Army – Work/Rest and Water Consumption Table | non daté (renvoie au TB MED 507) | https://home.army.mil/bavaria/4215/3926/1059/Safety_Water_Consumption.pdf |
| fm2176 | US Army FM 21-76 Survival, ch. 13 Désert | 1992 (FM 21-76) | http://www.equipped.org/21-76/ch13.pdf |
| who_tn9 | OMS – Technical note 9 : How much water is needed in emergencies | juil. 2013 | https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf |
| iom_cold | IOM – Nutritional Needs in Cold and High-Altitude Environments, ch. Cold-Weather Field Feeding | 1996 | https://www.ncbi.nlm.nih.gov/books/NBK232872/ |
| uiaa_nut | UIAA MedCom – The importance of nutrition in mountaineering | 21 avr. 2017 (maj 6 oct. 2023) | https://www.theuiaa.org/the-importance-of-nutrition-in-mountaineering/ |
| tp_bob | The Prepared – Bug out bag list | maj 21 déc. 2019 | https://theprepared.com/bug-out-bags/guides/bug-out-bag-list/ |
| tp_urban | The Prepared – forum « Urban bugging out » | 12–15 sept. 2021 | https://theprepared.com/forum/thread/urban-bugging-out/ |
| tp_wint | The Prepared – Winter survival kits / winterize checklist | maj 3 févr. 2025 | https://theprepared.com/situations/guides/prepare-severe-cold-winterize-checklist/ |
| tp_cold | The Prepared – How to survive winter emergencies | maj 14 janv. 2022 | https://theprepared.com/emergencies/guides/survive-cold-weather-winter-scenarios/ |
| tp_heat | The Prepared – How to survive severe heat | maj 30 juil. 2021 | https://theprepared.com/emergencies/guides/severe-heat/ |
| skurka_rain | Andrew Skurka – Clothing & skills to remain comfortable in the rain | 30 sept. 2016 | https://andrewskurka.com/clothing-skills-backpacking-in-the-rain-reader-question/ |
| skurka_down | Andrew Skurka – Protect down insulation from moisture | 7 nov. 2017 (maj 2019) | https://andrewskurka.com/down-insulation-moisture-protection-sleeping-bag-jacket/ |
| lundin | Phoenix Magazine – citation de Cody Lundin (page non consultable) | 1 juil. 2018 | https://www.phoenixmag.com/2018/07/01/desert-desertion/ |
| santefr_chaleur | Santé.fr – Fortes chaleurs et canicule | 3 août 2026 | https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches |
| mf_canicule | Météo-France – Qu'est-ce que la Vigilance canicule ? | non datée | https://meteofrance.com/comprendre-la-vigilance/vigilance-canicule |
| spf_2025 | Santé publique France – Chaleur et santé, bilan été 2025 | 26 févr. 2026 | https://www.santepubliquefrance.fr/sites/default/files/rdd/document/bullnat_chaleur_bilan_2025.pdf |
| icu | notre-environnement.gouv.fr – Îlot de chaleur urbain | 7 août 2025 | https://www.notre-environnement.gouv.fr/actualites/breves/article/pourquoi-fait-il-plus-chaud-en-ville-qu-a-la-campagne |
| ansm | ANSM – Transport et conservation des médicaments (été) | non datée | https://ansm.sante.fr/dossiers-thematiques/produits-de-sante-en-ete/transport-et-conservation-des-medicaments |
| mf_froid | Météo-France – Grand froid : quels risques ? | 2 déc. 2024 | https://meteofrance.com/comprendre-la-meteo/temperatures/grand-froid-quels-risques-comment-se-proteger |
| ars_co | ARS Île-de-France – Monoxyde de carbone | non datée | https://www.iledefrance.ars.sante.fr/monoxyde-de-carbone-1 |
| ars_co_bzh | ARS Bretagne – Groupes électrogènes et chauffages d'appoint (extrait de recherche) | non relevée | https://www.bretagne.ars.sante.fr/groupes-electrogenes-et-chauffages-dappoint-risques-dintoxications-au-monoxyde-de-carbone |
| ars_inond | ARS Auvergne-Rhône-Alpes – Se protéger en cas d'inondation | 30 juin 2025 | https://www.auvergne-rhone-alpes.ars.sante.fr/intemperies-comment-se-proteger-en-cas-dinondation-dans-son-logement |
| nws | NOAA/NWS – Turn Around Don't Drown | non datée | https://weather.gov/tsa/hydro_tadd |
| dana | Los Replicantes – bilan CID/TSJCV des victimes de la DANA (Valence) | 18 nov. 2024 | https://www.losreplicantes.com/articulos/mas-mitad-muertos-dana-comunidad-valenciana-casas-garajes/ |
| xynthia | Europe 1 – Huit ans après Xynthia | 1 mars 2018 | https://www.europe1.fr/societe/huit-ans-apres-xynthia-seuls-10-des-proprietaires-se-sont-mis-aux-nouvelles-normes-de-securite-3587759 |
| mf_vs | Météo-France – Vagues-submersion | 27 janv. 2025 | https://meteofrance.com/comprendre-la-meteo/oceans/les-vagues-submersion |
| rnli | RNLI – Float to Live | non datée | https://rnli.org/water-safety/float |
| ncws | National Center for Cold Water Safety – The 1-10-1 Myth | non datée | https://www.coldwatersafety.org/1-10-1-myth |
| spf_lepto | Santé publique France / ARS La Réunion – Leptospirose | 12 févr. 2024 | https://www.santepubliquefrance.fr/presse/leptospirose-appel-a-la-vigilance |
| spf_moust | Santé publique France – Surveillance renforcée arboviroses 2025 | 2025 | https://www.santepubliquefrance.fr/maladies-et-traumatismes/maladies-a-transmission-vectorielle/chikungunya/articles/donnees-en-france-metropolitaine/chikungunya-dengue-zika-et-west-nile-donnees-de-la-surveillance-renforcee-en-france-hexagonale-2025 |
| fdf_conf | feuxdeforet.fr – Chez moi : se confiner (éditeur non vérifié) | 10 mai 2026 (maj 26 juil. 2026) | https://feuxdeforet.fr/prevention/pendant/se-confiner/ |
| fdf_car | feuxdeforet.fr – Surpris par un feu en voiture (éditeur non vérifié) | 10 mai 2026 (maj 26 juil. 2026) | https://feuxdeforet.fr/prevention/pendant/en-voiture/ |
| pompiers | Pompiers.fr (FNSPF) – Feux de forêt | non datée | https://www.pompiers.fr/feux-foret/ |
| psfdf | PSFDF – Surpris par le feu en voiture | 22 déc. 2025 | https://association-psfdf.fr/pages/articles/reflexes-survie-voiture-incendie.html |
| dfci | DFCI Aquitaine – Consignes de sécurité | non datée | https://www.dfci-aquitaine.fr/consignes-de-securite |
| crf | Croix-Rouge française – Incendies | non datée | https://www.croix-rouge.fr/dossiers/incendies |
| epa | US EPA – Protect your lungs from wildfire smoke or ash (extrait de recherche) | nov. 2018 | https://www.epa.gov/sites/default/files/2018-11/documents/respiratory_protection-no-niosh-5081.pdf |
| aps_feu | Apprendre Préparer (Sur)vivre – « Incendies : protège ta maison… » (formateur, ex-sapeur-pompier) | 29 juil. 2026 | https://www.youtube.com/watch?v=UATgy7o9CWM |
| aps_ville | Apprendre Préparer (Sur)vivre – FAQ « Que faire en ville ? » | 27 mai 2022 | https://www.youtube.com/watch?v=2dzly83NJyU |
| onf | ONF – Tempête Goretti : consignes de sécurité | 12 janv. 2026 | https://www.onf.fr/vivre-la-foret/enjeux-foret/changement-climatique-foret/dangers/tempetes/+/2b10::tempete-goretti-normandie-degats-consignes-de-securite.html |
| ars_tique | ARS Occitanie – Tiques et maladie de Lyme | non datée | https://www.occitanie.ars.sante.fr/tiques-et-maladie-de-lyme |
| ars_puits | ARS Occitanie – Les réseaux privés (puits, forages) | 4 févr. 2026 | https://www.occitanie.ars.sante.fr/les-reseaux-prives |
| ffr_chasse | FFRandonnée – Conseils en période de chasse | 16 sept. 2024 | https://www.ffrandonnee.fr/s-informer/actualites/conseils-aux-randonneurs-en-periode-de-chasse |
| ffr_zb | FFRandonnée – Randonner en zone blanche | non datée | https://www.ffrandonnee.fr/randonner-en-zone-blanche |
| ffr_hiver | FFRandonnée – Randonner en hiver | 15 mars 2021 | https://www.ffrandonnee.fr/randonner/securite/randonner-en-hiver |
| tempete99 | Infoclimat – Tempêtes Lothar et Martin (1999) | non datée | https://www.infoclimat.fr/historic-details-evenement-143-tempetes-martin-et-lothar-de-decembre-1999.html |
| cas | Club Alpin Suisse – « À l'aide, je n'ai pas de réseau ! » | 17 mai 2021 | https://www.sac-cas.ch/fr/les-alpes/a-laide-je-nai-pas-de-reseau-33257/ |
| pghm_corse | Corse Net Infos – conseils du PGHM de Corse | 10 juin 2023 | https://www.corsenetinfos.corsica/Montagne-les-conseils-du-PGHM-de-Corse-pour-partir-en-randonnee-en-toute-securite_a71581.html |
| orage | Pyrénées 31 – Orage en montagne (cite le PGHM de Gavarnie) | 9 août 2026 | https://www.pyrenees31.com/inspiration/orage-montagne-randonnee-bivouac-pyrenees |
| anena_bilan | ANENA – Bilan des accidents d'avalanche 2024-2025 | maj 12 nov. 2025 | https://anena.org/accidents/archives-et-donnees-daccidents-davalanche-en-france/ |
| anena_mat | ANENA – Bien choisir son matériel de secours en avalanche | non datée | https://anena.org/bien-choisir-son-materiel-de-secours-en-avalanche/ |
| anena_15 | franceinfo – interview du directeur de l'ANENA | 14 févr. 2017 | https://www.franceinfo.fr/environnement/evenements-meteorologiques-extremes/avalanches/en-cas-d-avalanche-tout-se-joue-dans-le-premier-quart-d-heure_2059762.html |
| who_uv | OMS – Radiation: Ultraviolet (UV) | non datée | https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-(uv) |
| gradient | Infoclimat – Gradient thermique vertical (extrait de recherche) | non datée | https://www.infoclimat.fr/lexique-definition-165-gradient-thermique-vertical.html |
| alex | Var Actu – Tempête Alex, cinq ans après | 22 sept. 2025 | https://www.varactu.fr/tempete-alex-cinq-ans-apres-les-vallees-de-la-roya-et-de-la-vesubie-toujours-en-attente/ |
| gkstill | G. Keith Still – Standing crowd density (page non lisible, extrait de recherche) | non datée | https://www.gkstill.com/Support/crowd-density/CrowdDensity-1.html |
| wtc | CDC MMWR – World Trade Center Evacuation Study, résultats préliminaires | 10 sept. 2004 | https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5335a3.htm |
| ecb | BCE – Keep calm and carry cash | sept. 2025 (Bulletin 6/2025) | https://www.ecb.europa.eu/press/economic-bulletin/articles/2025/html/ecb.ebart202506_02~1a773e2ca3.en.html |
| peek | Peek, Wachtendorf, Meyer – Sociology of Disasters (Natural Hazards Center) | 2021 | https://hazards.colorado.edu/uploads/basicpage/peek-et-al2021sociology-of-disasters.pdf |
| ferfal | FerFAL (Surviving in Argentina) – billets sur les blackouts | billets 2010–2017 (libellé « blackout ») | https://ferfal.blogspot.com/search/label/blackout |
