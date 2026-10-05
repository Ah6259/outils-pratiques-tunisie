# Mémoire du projet — Outils pratiques Tunisie

Fichier lu automatiquement par Claude Code au début de chaque session dans ce dossier.
**Dépôt PUBLIC : rien de personnel ni de secret ici.** À tenir à jour à chaque modification importante (avec README et GUIDE).

## Qui et comment travailler
- Propriétaire : Ahmed (compte GitHub `Ah6259`), débutant. Expliquer simplement, **en français**.
- **Demander l'accord d'Ahmed avant de modifier le site** (sauf s'il dit « fais »). **Demander avant d'installer un logiciel.**
- Ahmed vérifie sur son téléphone après publication.
- Appliquer les **règles communes à tous ses sites** : fichier `regles communes a tous les sites.md`
  dans le dossier parent des projets (hors de ce dépôt).

## Le site
- En ligne : https://ah6259.github.io/outils-pratiques-tunisie/ — dépôt `Ah6259/outils-pratiques-tunisie` (GitHub Pages, branche main).
- Créé le 04/10/2026. Calculateurs gratuits, **français + arabe** (bouton, ou `?lang=ar` dans l'adresse).
- Pages : accueil, `salaire-net/` (brut ⇄ net, chef de famille, enfants), `impot-revenu/` (IRPP tranche par tranche), `a-propos/` (méthode, données, limites, sources).
- Présentation « professionnelle » (05/10) : en-tête et pied de page communs injectés par `assets/page.js` (date `MAJ` à changer à chaque vérification des règles), bandeau vert, badges de confiance SVG, sources officielles sur chaque page.
  Bientôt : crédit, auto-entrepreneur, documents prêts à remplir (payants plus tard, Konnect/Flouci).
- Tout est calculé **dans le téléphone** du visiteur : aucune donnée envoyée, aucun serveur.

## Règles de calcul (assets/calcul.js, objet `REGLES`) — À METTRE À JOUR CHAQUE JANVIER (loi de finances)
- CNSS salarié 9,68 % (9,18 % + 0,50 % perte d'emploi) ; frais professionnels 10 %, plafond 2 000 DT/an ;
  chef de famille 300 DT/an, 100 DT par enfant (4 max) ; barème LF 2025 à 8 tranches (0/15/25/30/33/36/38/40 %) ;
  CSS 0,5 % du revenu imposable si > 5 000 DT/an. 12 salaires égaux par an, sans primes.
- Chaque retenue mensuelle (CNSS, IRPP, CSS) est **arrondie au millime** avant de calculer le net, comme sur une fiche de paie.
- Références qui doivent toujours tomber juste (simulateur de référence) : 2 500 → 1 849,310 ; 1 500 → 1 189,706 ; 800 → 684,262.

## Avant chaque publication
1. `node tools/test_site.mjs` (142 vérifications, dont 5 références relevées sur le simulateur de référence : calculs de référence, pages FR/AR, aperçu, licence…).
   jsdom s'installe une fois par PC : `npm install --no-save --no-package-lock jsdom` (node_modules ignoré).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages (cache des téléphones) — le test le vérifie.
3. Capture mobile (Chrome sans écran, cadres 340/390 px) en français ET en arabe si l'affichage change.
4. Montants au milieu d'un texte arabe : passer par `dt()` / `iso()` (isolation U+2066…U+2069).

## Robots (autonomie)
- `surveillance.yml` (1er du mois + chaque jour de janvier) : `tools/verifier_regles.py` compare 5 cas au simulateur de
  référence (adresse dans le secret GitHub REF_URL, et localement dans tools/.reference non suivi par git ; tolérance 2 millimes : leurs arrondis varient) → OK : met à jour `MAJ` (page.js), et à partir du
  15 janvier passe `ANNEE` et tous les « 2026 » isolés à la nouvelle année ; écart → issue « alerte-robot » (rien modifié).
  Commit mensuel = battement de cœur. Preuves CGU/robots du simulateur de référence : dossier parent (hors dépôt) `preuves conditions d'utilisation6-10-05\`.
- **Ne jamais citer de concurrent** sur le site ni dans ce dépôt public (règle d'Ahmed).
- `tests.yml` à chaque push : `node tools/test_site.mjs` + `python tools/test_robot.py` (15 scénarios).
- L'année n'est écrite qu'à des endroits remplaçables automatiquement ; l'image d'aperçu n'a pas d'année (og-image-v2).

## Visibilité
- sitemap.xml + robots.txt ; FAQ Google (JSON-LD) sur les 2 calculateurs ; image d'aperçu `assets/og-image-v3.png` (avec la photo des pièces)
  (si on la change : **nouveau nom de fichier**, WhatsApp/Facebook gardent l'ancienne).
- Reste à faire par Ahmed : Search Console, compte GoatCounter (statistiques).

## Photos et protection (05/10/2026)
- Bandeaux : **vraies photos libres de droits** (Wikimedia Commons) au lieu des dessins : `assets/photo-pieces-dinar.jpg`
  (accueil + salaire-net ; 金娜 Kim S, CC BY-SA 2.0) et `assets/photo-calculatrice.jpg` (impot-revenu ; Coyau, CC BY-SA 3.0).
  Crédit + licence sous la photo (`figure.illus` avec `data-source` = page Commons), section « Photos » (#photos) dans À propos,
  ligne dans le pied de page. Preuves de licence (HTML, métadonnées, sha256, Internet Archive) : dossier parent (hors dépôt)
  `preuves conditions d'utilisation/2026-10-05/photos/`. Nouvelle photo = même chaîne (le test vérifie crédit, licence et preuve).
  Les anciens dessins `illus-paie.svg` / `illus-impot.svg` ne sont plus utilisés.
- Sécurité / anti-copie : robots.txt interdit les robots d'IA et aspirateurs (moteurs de recherche permis) ; meta `noai, noimageai`,
  CSP stricte (scripts du site seulement → **aucun script dans les pages** : `assets/salaire.js`, `assets/impot.js`), referrer ;
  `page.js` : pas de clic droit/glisser sur les images, source ajoutée au texte copié, anti-iframe ; montants calculés
  (`.resultat`), champs et liens restent copiables.
