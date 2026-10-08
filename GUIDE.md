# Guide — les étapes de création d'Outils pratiques Tunisie

Guide réutilisable pour créer un autre site du même genre. Une ligne par étape, dans l'ordre.

## 04/10/2026 — Création
1. **Étude** : simulateurs tunisiens existants = seulement des sites étrangers génériques, en français seulement → place libre.
2. **Règles officielles vérifiées** : barème IRPP (loi de finances 2025, art. 36), CNSS 9,68 %, CSS 0,5 %, frais pro,
   déductions de famille. Contrôle avec un exemple publié (2 500 brut → 1 849,310 net).
3. **Code des calculs** dans un seul fichier (`assets/calcul.js`), utilisable par les pages ET par le test.
4. **Pages** en HTML simple, français + arabe dans la même page (`data-l="fr"` / `data-l="ar"`), bouton de langue,
   mise en page pensée pour le téléphone.
5. **Arabe** : nombres et montants isolés (U+2066…U+2069) pour garder le bon ordre.
6. **Capture mobile** (Chrome sans écran, cadres de 340 et 390 px) en français et en arabe.
7. **Publication** : dépôt public `Ah6259/outils-pratiques-tunisie`, GitHub Pages activé (branche main, dossier racine).
8. **Fichiers de base** : LICENSE « tous droits réservés », robots.txt, sitemap.xml, `.nojekyll`.

## 05/10/2026 — Règles communes appliquées
9. **Image d'aperçu** des liens (1200 × 630) fabriquée avec Chrome à partir d'une page HTML.
10. **FAQ pour Google** (JSON-LD) sur les deux calculateurs.
11. **Test automatique** `tools/test_site.mjs` (52 vérifications) + **sabotage volontaire** d'une copie pour vérifier
    que le test sonne bien.
12. **CLAUDE.md** (mémoire du projet) et ce guide.

## À faire par Ahmed
- Search Console : ajouter le site, envoyer `sitemap.xml`.
- GoatCounter : créer un compteur pour ce site (statistiques sans cookies).

## 05/10/2026 — Présentation professionnelle (demande d'Ahmed : « ça ne donne pas confiance »)
13. **En-tête commun** (logo SVG + nom + « 1 calcul gratuit par jour · règles 2026 » depuis le 06/10) et **pied de page complet** (navigation,
    date de vérification des règles, mention non officielle, ©), injectés par `assets/page.js` sur toutes les pages.
14. **Bandeau vert** en haut de chaque page avec fil d'Ariane et pastille « Règles à jour au … ».
15. **Cartes** arrondies avec ombre douce, champs avec unité « DT », sélecteur Brut/Net en onglets.
16. **Résultat** : grand montant, **barre de répartition** (net / CNSS / impôt / CSS) avec pourcentages.
17. ~~Badges de confiance~~ (supprimés le 06/10/2026 : ils ressemblaient à des boutons sans rien faire), section **Sources officielles**, page **À propos et méthode**.

## 05/10/2026 — Vraies photos et protection contre la copie
- **Photos réelles** (demande d'Ahmed) : recherche sur Wikimedia Commons (API publique), licence lue sur la page de chaque photo
  (CC0, domaine public, CC BY, CC BY-SA), preuve sauvegardée hors du dépôt (HTML + métadonnées + sha256 + Internet Archive),
  recadrage/compression avec Python Pillow (JPEG ≤ 150 Ko, sans visage, sans emblème de l'État), crédit sous la photo + page À propos.
- **Image d'aperçu v3** (1200 × 630) : page HTML temporaire avec la photo, capturée par Chrome sans écran → `assets/og-image-v3.png`.
- **Protection** : robots.txt anti-IA, meta noai, CSP, anti-copie légère et anti-iframe dans page.js ; scripts des pages sortis
  dans `assets/salaire.js` et `assets/impot.js`. Le test vérifie tout (et un sabotage volontaire le fait bien sonner).

## 05/10/2026 — Trois nouveaux calculateurs : crédit, auto-entrepreneur, retenue à la source
- **Sources officielles** lues à la main et sauvegardées hors du dépôt (BCT pour le TMM, DGI/jibaya.tn, CNSS, cahier des charges TEJ),
  avec leurs conditions d'utilisation ; chaque chiffre de référence du test vérifié à la main (formule, exemples officiels TEJ).
- **Intégration** : vraies cartes sur l'accueil, liens dans le pied de page, sitemap à 7 pages, une seule version `?v=` pour tout le site.
- **Carte « Documents prêts à remplir »** : renvoie vers un futur site séparé ; une seule constante (`URL_DOCUMENTS` dans page.js) à remplir le jour venu.
- **Photos réelles** pour les 3 bandeaux (Wikimedia Commons, licence lue sur la page, preuve + copie Internet Archive, recadrées en 700 × 500, ≤ 150 Ko).
- **Tests** : `test_nouveaux.mjs` ajouté à tests.yml ; test « chaque lien de l'accueil et du pied mène à une page existante » ;
  noms des concurrents sortis du dépôt public (fichier local ignoré par git) ; sabotage volontaire d'une copie → tous les défauts détectés.
- **Robot** : vérification mensuelle du TMM sur la page d'accueil de la BCT → alerte si différent (jamais de modification automatique) ;
  nouveaux scénarios de panne dans test_robot.py (TMM changé, mois périmé, BCT injoignable, page changée, passage d'année).
- **Captures mobiles** : la fenêtre de Chrome sans écran ne descend pas sous ~500 px → page locale avec deux cadres de 340 et 390 px
  pointant vers les fichiers (`file:///…?lang=fr` et `?lang=ar`).

## 05/10/2026 — Installation complète sur le téléphone (service worker)
- `sw.js` à la racine (portée = dossier du site), enregistré par `assets/page.js` (https seulement, jamais en `file:`).
- Stratégie prudente : **réseau d'abord** pour les pages et les données (le visiteur voit toujours la dernière version ;
  le cache ne sert que hors connexion, sinon page « Hors connexion » FR + AR) ; fichiers `?v=` : cache puis mise à jour.
- Jamais en cache : envois (non-GET), autres sites (statistiques, polices…), autres sites d'Ahmed sur la même adresse.
- Meta iPhone sur chaque page (« Sur l'écran d'accueil ») : `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`.
- Test `node tools/test_sw.mjs` : exécute sw.js dans un faux navigateur (cache + réseau simulés) ; sabotage vérifié
  (HTML en « cache d'abord », POST intercepté, mauvaise portée → le test sonne).
- Vieille version bloquée sur un téléphone : changer `CACHE_VERSION` dans `sw.js`.

## 05/10/2026 (soir) — icône et « gratuit »
- Icône des 4 opérations (famille commune des sites) ; « gratuit » dans tous les titres Google.

## 06/10/2026 — Partie payante « Pass Journée » (copie du Pass Examen du Code de la route)
- Règle d'Ahmed : 1 utilisation gratuite par jour, puis 7 DT pour tout pendant la journée. Pour des calculateurs : l'exemple reste
  gratuit, 1 calcul personnel gratuit par jour (10 minutes pour corriger ses chiffres), ensuite le résultat est masqué.
- Une « porte » (`porteCalcul`) au début de chaque calcul ; écran clair avec le prix, « Revenez demain » et « J'ai déjà un code ».
- Pages `pass/` (prix, paiement D17/IZI, preuve WhatsApp, formulaire Formspree) et `pass/conditions/` (INPDP, pas de renouvellement).
- Dépôt PRIVÉ `outils-pass` : programme Python + bouton GitHub (workflow_dispatch) pour activer un client depuis le téléphone ;
  seule l'empreinte salée du code et l'heure de fin arrivent sur le site public (clé de déploiement limitée à ce dépôt).
- « Gratuit » corrigé partout (« 1 calcul gratuit par jour »), nouvelle image d'aperçu v6 ; tests jsdom (exemple, 1er calcul,
  2e bloqué, lendemain, code valide / expiré / faux) ; captures Edge 340/390 px en français et en arabe.
- Bouton « Trouver un comptable » (bordure dorée, logo de l'annuaire) dans le menu de l'en-tête et sur l'accueil.
