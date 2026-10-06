# Outils pratiques Tunisie

Calculateurs pour la Tunisie, en français et en arabe : https://ah6259.github.io/outils-pratiques-tunisie/
(exemple toujours gratuit + 1 calcul gratuit par jour ; **Pass Journée** 7 DT = tous les calculs pendant 24 heures)

- `salaire-net/` : salaire brut ⇄ net (CNSS 9,68 %, IRPP barème LF 2025 à 8 tranches, CSS 0,5 %).
- `impot-revenu/` : impôt sur le revenu annuel, tranche par tranche.
- `credit/` : crédit immobilier et auto (mensualité, TMM + marge, assurance, tableau d'amortissement).
- `auto-entrepreneur/` : éligibilité et contribution unique (impôt forfaitaire + CNSS).
- `retenue-source/` : retenue à la source (taux officiels de la plateforme TEJ), montant hors TVA ⇄ TVA comprise ⇄ net payé.
- `assets/calcul.js` : règles de paie (objet `REGLES`) — **à mettre à jour à chaque loi de finances (janvier)** ;
  `assets/calcul-credit.js` (TMM), `calcul-auto.js`, `calcul-retenue.js` : règles des 3 autres calculateurs.
- Documents prêts à remplir : site « Documents Tunisie » (`URL_DOCUMENTS` dans `assets/page.js`).
- `pass/` et `pass/conditions/` : **Pass Journée** (code : `assets/pass.js`, codes publiés en empreintes dans `donnees/pass.json`).
  Activation par Ahmed depuis l'application GitHub : dépôt PRIVÉ `Ah6259/outils-pass`, bouton « pass » (voir son README).
- Menu de l'en-tête : bouton doré « Trouver un comptable » vers notre annuaire Comptables Tunisie (+ carte sur l'accueil).
- **Votre avis** (accueil `#avis`, lien « Votre avis » dans le pied de page de toutes les pages) : note facultative (😀🙂😐🙁),
  message (obligatoire, ≤ 1000 caractères), e-mail facultatif ; envoyé **seulement au clic** à Formspree (formulaire `mwlpakqj`,
  commun à tous les sites d'Ahmed) avec les champs cachés `site` = « Outils pratiques Tunisie » et `page`. Code : `assets/avis.js`.
- Tests avant chaque publication (tout doit être vert) : `node tools/test_site.mjs`, `node tools/test_nouveaux.mjs`,
  `node tools/test_sw.mjs`, `node tools/test_avis.mjs`, `python tools/test_robot.py` (voir CLAUDE.md et GUIDE.md).
- Changer le `?v=` des fichiers `assets/` dans les pages à chaque modification (cache des téléphones).

Tous droits réservés (voir LICENSE).

## Plan de continuité (le site doit vivre seul le plus longtemps possible)
| Ce qui tourne seul | Quand | Ce qui se passe en cas de problème |
|---|---|---|
| `surveillance.yml` : compare nos calculs à un simulateur de référence (5 cas) | le 1er de chaque mois + chaque jour en janvier | règles changées ou vérification impossible → **alerte** (issue GitHub, email) ; le site n'est jamais modifié dans ce cas |
| Date « Règles à jour au … » | à chaque vérification réussie | — |
| Passage à la nouvelle année (titres, textes, ©) | à partir du 15 janvier si les règles sont identiques | — |
| Battement de cœur (commit mensuel) | chaque mois | évite la mise en pause des robots par GitHub (60 jours) |
| `surveillance.yml` : TMM de la Banque centrale (page Crédit) | le 1er de chaque mois | TMM changé, ou mois à rafraîchir → **alerte** « Crédit : le TMM … a changé » ; page de la BCT illisible → alerte « lecture du TMM impossible » ; le TMM du site n'est jamais modifié automatiquement |
| `tests.yml` : fichiers des robots (YAML) + les 5 tests | à chaque modification | email de GitHub en cas d'échec |
| `pass` (dépôt privé `outils-pass`) : codes du Pass Journée | au bouton d'Ahmed + nettoyage chaque nuit | résumé « Le site n'a PAS été mis à jour » si la clé manque (voir son README) |

**Installation sur le téléphone** : `sw.js` (service worker) = **réseau d'abord** pour les pages et les données
(le cache ne sert que hors connexion) ; CSS/JS/images versionnés (?v=) = cache puis mise à jour. Si un téléphone garde une
vieille version : changer `CACHE_VERSION` dans `sw.js` (vide le cache de tous les téléphones). Test : `node tools/test_sw.mjs`.

**Si une alerte arrive** : demander à Claude « mets à jour les règles d'Outils pratiques » (nouveaux taux de la loi de finances,
puis le test doit retomber exactement sur le simulateur de référence avant publication).
**Alerte TMM** : demander à Claude « mets à jour le TMM d'Outils pratiques » (nouveau taux et mois dans `REGLES_CREDIT.tmm`,
relus sur la page de la Banque centrale, puis les tests).
**Chaque janvier** : revoir aussi à la main les pages Auto-entrepreneur et Retenue à la source (titres avec l'année, taux, montants) :
le robot ne change pas leurs dates exprès (dates officielles fixes).

## Nouveautés
- 05/10/2026 : nouvelle icône (les 4 opérations) et « calcul gratuit » dans les titres Google.
- 06/10/2026 : **Pass Journée** (1 calcul gratuit par jour, puis 7 DT pour 24 heures) ; bouton « Trouver un comptable » ; image d'aperçu v6.
