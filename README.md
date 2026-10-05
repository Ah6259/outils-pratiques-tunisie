# Outils pratiques Tunisie

Calculateurs gratuits pour la Tunisie, en français et en arabe : https://ah6259.github.io/outils-pratiques-tunisie/

- `salaire-net/` : salaire brut ⇄ net (CNSS 9,68 %, IRPP barème LF 2025 à 8 tranches, CSS 0,5 %).
- `impot-revenu/` : impôt sur le revenu annuel, tranche par tranche.
- `assets/calcul.js` : toutes les règles (objet `REGLES`) — **à mettre à jour à chaque loi de finances (janvier)**.
- Test avant chaque publication : `node tools/test_site.mjs` (voir CLAUDE.md et GUIDE.md).
- Changer le `?v=` des fichiers `assets/` dans les pages à chaque modification (cache des téléphones).

Tous droits réservés (voir LICENSE).

## Plan de continuité (le site doit vivre seul le plus longtemps possible)
| Ce qui tourne seul | Quand | Ce qui se passe en cas de problème |
|---|---|---|
| `surveillance.yml` : compare nos calculs à un simulateur de référence (5 cas) | le 1er de chaque mois + chaque jour en janvier | règles changées ou vérification impossible → **alerte** (issue GitHub, email) ; le site n'est jamais modifié dans ce cas |
| Date « Règles à jour au … » | à chaque vérification réussie | — |
| Passage à la nouvelle année (titres, textes, ©) | à partir du 15 janvier si les règles sont identiques | — |
| Battement de cœur (commit mensuel) | chaque mois | évite la mise en pause des robots par GitHub (60 jours) |
| `tests.yml` : tous les tests | à chaque modification | email de GitHub en cas d'échec |

**Si une alerte arrive** : demander à Claude « mets à jour les règles d'Outils pratiques » (nouveaux taux de la loi de finances,
puis le test doit retomber exactement sur le simulateur de référence avant publication).
