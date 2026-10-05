# Outils pratiques Tunisie

Calculateurs gratuits pour la Tunisie, en français et en arabe : https://ah6259.github.io/outils-pratiques-tunisie/

- `salaire-net/` : salaire brut ⇄ net (CNSS 9,68 %, IRPP barème LF 2025 à 8 tranches, CSS 0,5 %).
- `impot-revenu/` : impôt sur le revenu annuel, tranche par tranche.
- `credit/` : crédit immobilier et auto (mensualité, TMM + marge, assurance, tableau d'amortissement).
- `auto-entrepreneur/` : éligibilité et contribution unique (impôt forfaitaire + CNSS).
- `retenue-source/` : retenue à la source (taux officiels de la plateforme TEJ), montant hors TVA ⇄ TVA comprise ⇄ net payé.
- `assets/calcul.js` : règles de paie (objet `REGLES`) — **à mettre à jour à chaque loi de finances (janvier)** ;
  `assets/calcul-credit.js` (TMM), `calcul-auto.js`, `calcul-retenue.js` : règles des 3 autres calculateurs.
- Documents prêts à remplir : futur site « Documents Tunisie » ; le lien s'active en remplissant `URL_DOCUMENTS` dans `assets/page.js`.
- Tests avant chaque publication (tout doit être vert) : `node tools/test_site.mjs`, `node tools/test_nouveaux.mjs`,
  `python tools/test_robot.py` (voir CLAUDE.md et GUIDE.md).
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
| `tests.yml` : fichiers des robots (YAML) + les 3 tests | à chaque modification | email de GitHub en cas d'échec |

**Si une alerte arrive** : demander à Claude « mets à jour les règles d'Outils pratiques » (nouveaux taux de la loi de finances,
puis le test doit retomber exactement sur le simulateur de référence avant publication).
**Alerte TMM** : demander à Claude « mets à jour le TMM d'Outils pratiques » (nouveau taux et mois dans `REGLES_CREDIT.tmm`,
relus sur la page de la Banque centrale, puis les tests).
**Chaque janvier** : revoir aussi à la main les pages Auto-entrepreneur et Retenue à la source (titres avec l'année, taux, montants) :
le robot ne change pas leurs dates exprès (dates officielles fixes).
