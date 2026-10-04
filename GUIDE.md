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
