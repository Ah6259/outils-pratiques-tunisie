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
- Pages : accueil, `salaire-net/` (brut ⇄ net, chef de famille, enfants), `impot-revenu/` (IRPP tranche par tranche).
  Bientôt : crédit, auto-entrepreneur, documents prêts à remplir (payants plus tard, Konnect/Flouci).
- Tout est calculé **dans le téléphone** du visiteur : aucune donnée envoyée, aucun serveur.

## Règles de calcul (assets/calcul.js, objet `REGLES`) — À METTRE À JOUR CHAQUE JANVIER (loi de finances)
- CNSS salarié 9,68 % (9,18 % + 0,50 % perte d'emploi) ; frais professionnels 10 %, plafond 2 000 DT/an ;
  chef de famille 300 DT/an, 100 DT par enfant (4 max) ; barème LF 2025 à 8 tranches (0/15/25/30/33/36/38/40 %) ;
  CSS 0,5 % du revenu imposable si > 5 000 DT/an. 12 salaires égaux par an, sans primes.
- Chaque retenue mensuelle (CNSS, IRPP, CSS) est **arrondie au millime** avant de calculer le net, comme sur une fiche de paie.
- Références qui doivent toujours tomber juste (paie-tunisie.com) : 2 500 → 1 849,310 ; 1 500 → 1 189,706 ; 800 → 684,262.

## Avant chaque publication
1. `node tools/test_site.mjs` (57 vérifications, dont 5 références relevées sur le simulateur de paie-tunisie.com : calculs de référence, pages FR/AR, aperçu, licence…).
   jsdom s'installe une fois par PC : `npm install --no-save --no-package-lock jsdom` (node_modules ignoré).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages (cache des téléphones) — le test le vérifie.
3. Capture mobile (Chrome sans écran, cadres 340/390 px) en français ET en arabe si l'affichage change.
4. Montants au milieu d'un texte arabe : passer par `dt()` / `iso()` (isolation U+2066…U+2069).

## Visibilité
- sitemap.xml + robots.txt ; FAQ Google (JSON-LD) sur les 2 calculateurs ; image d'aperçu `assets/og-image-v1.png`
  (si on la change : **nouveau nom de fichier**, WhatsApp/Facebook gardent l'ancienne).
- Reste à faire par Ahmed : Search Console, compte GoatCounter (statistiques).
