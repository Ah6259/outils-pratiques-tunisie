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
- Pages : accueil, `salaire-net/` (brut ⇄ net, chef de famille, enfants), `impot-revenu/` (IRPP tranche par tranche),
  `credit/` (mensualité, TMM + marge, assurance, tableau d'amortissement), `auto-entrepreneur/` (éligibilité + contribution unique),
  `retenue-source/` (HT ⇄ TTC ⇄ net, taux officiels, rappel TEJ ; **ne fabrique aucun certificat**), `a-propos/` (méthode, données, limites, sources, photos).
- Présentation « professionnelle » (05/10) : en-tête et pied de page communs injectés par `assets/page.js` (date `MAJ` à changer à chaque vérification des règles), bandeau vert, badges de confiance SVG, sources officielles sur chaque page.
  Pied de page : liens vers les 5 calculateurs + À propos.
- **Documents prêts à remplir** = futur site séparé « Documents Tunisie ». Sur l'accueil : carte « bientôt » (texte « Sur notre site Documents Tunisie »).
  Quand il sera en ligne : remplir **une seule constante** `URL_DOCUMENTS` dans `assets/page.js`
  (`"https://ah6259.github.io/documents-tunisie/"`) → la carte devient un lien (nouvel onglet), sans badge. Le test vérifie les deux états.
- Tout est calculé **dans le téléphone** du visiteur : aucune donnée envoyée, aucun serveur (seule exception : « Votre avis », envoyé au clic).
- **Votre avis** (05/10/2026, règle d'Ahmed : sur chacun de ses sites) : section `#avis` en bas de l'accueil (carte FR + AR, note
  😀🙂😐🙁 facultative, message obligatoire ≤ 1000 caractères, e-mail facultatif), lien « Votre avis » dans le pied de page (`page.js`).
  `assets/avis.js` (fichier externe) envoie par `fetch` à `https://formspree.io/f/mwlpakqj` (Accept JSON) seulement au clic, avec
  les champs cachés `site` = « Outils pratiques Tunisie », `page`, `_subject` et le piège `_gotcha`. CSP : `connect-src` et
  `form-action` + `https://formspree.io` sur toutes les pages ; champs sélectionnables malgré l'anti-copie ; le service worker
  laisse passer formspree.io. Formspree gratuit = 50 envois/mois pour TOUS les sites (même formulaire).

## Règles de calcul — salaire et impôt (assets/calcul.js, objet `REGLES`) — À METTRE À JOUR CHAQUE JANVIER (loi de finances)
- CNSS salarié 9,68 % (9,18 % + 0,50 % perte d'emploi) ; frais professionnels 10 %, plafond 2 000 DT/an ;
  chef de famille 300 DT/an, 100 DT par enfant (4 max) ; barème LF 2025 à 8 tranches (0/15/25/30/33/36/38/40 %) ;
  CSS 0,5 % du revenu imposable si > 5 000 DT/an. 12 salaires égaux par an, sans primes.
- Chaque retenue mensuelle (CNSS, IRPP, CSS) est **arrondie au millime** avant de calculer le net, comme sur une fiche de paie.
- Références qui doivent toujours tomber juste (simulateur de référence) : 2 500 → 1 849,310 ; 1 500 → 1 189,706 ; 800 → 684,262.

## Règles des nouveaux calculateurs (05/10/2026) — sources officielles sauvegardées (dossier parent, hors dépôt :
`preuves conditions d'utilisation/2026-10-05/sources-officielles-credit-autoentrepreneur-retenue/`)
- **Crédit** (`assets/calcul-credit.js`, `REGLES_CREDIT`) : M = C × r ÷ (1 − (1 + r)^−n), r = taux annuel ÷ 12 ; chaque ligne au millime,
  la dernière solde le capital. **TMM** = `REGLES_CREDIT.tmm` (septembre 2026 : 7,00 %, page d'accueil de la BCT, « Principaux taux ») ;
  conditions BCT : citation exacte, BCT citée, lien en nouvelle fenêtre. Après 75 jours (date du visiteur) la page invite à vérifier.
  Références vérifiées à la main : 100 000 DT, 10 %, 20 ans → 965,022 ; 12 000 DT, 12 %, 12 mois → 1 066,185 (intérêts 794,226).
- **Auto-entrepreneur** (`assets/calcul-auto.js`, `REGLES_AE`) : DGI (jibaya.tn, FAQ) — plafond 75 000 DT, impôt 200 DT (zone communale)
  ou 100 DT, 1re année exonérée ; CNSS non-salariés 14,71 % par tranches (à partir du 2e trimestre 2026), artisans loi 2002-32 25,400 DT/mois.
  Références : 2e année, communale, tranche 1 → 1 141,556 DT/an ; autre zone + artisan → 404,800.
- **Retenue à la source** (`assets/calcul-retenue.js`, `REGLES_RS`) : cahier des charges officiel TEJ (DGI, septembre 2026) — taux et codes TEJ ;
  loi de finances 2026 : article 52 inchangé. Références (exemples officiels du cahier) : honoraires 5 000 HT, TVA 19 % → retenue 178,500,
  net 5 771,500 ; non-résident 10 000 HT → 1 785 + TVA retenue 1 900, net 8 215. Depuis le 1er janvier 2026, certificats sur TEJ seulement.

## Avant chaque publication
1. Les cinq tests (tout doit être vert) :
   `node tools/test_site.mjs` (≈ 275 vérifications : calculs de référence, pages FR/AR, liens de l'accueil et du pied, photos, sécurité…),
   `node tools/test_nouveaux.mjs` (≈ 140 : crédit, auto-entrepreneur, retenue ; accepte un dossier en argument pour tester une copie),
   `PYTHONIOENCODING=utf-8 python tools/test_robot.py` (31 scénarios du robot),
   `node tools/test_sw.mjs` (service worker : réseau d'abord, exclusions, meta iPhone ; accepte un dossier en argument),
   `node tools/test_avis.mjs` (Votre avis : section, pied de page de toutes les pages, CSP, envoi simulé ; accepte un dossier en argument).
   jsdom s'installe une fois par PC : `npm install --no-save --no-package-lock jsdom` (node_modules ignoré).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages, **une seule version pour tout le site** (actuelle : `20261005s`) — les tests le vérifient.
3. Capture mobile 340/390 px en français ET en arabe si l'affichage change : Chrome sans écran sur une page HTML locale
   contenant deux `<iframe>` (340 et 390 px) vers les fichiers `file:///…?lang=fr|ar` (la fenêtre de Chrome sans écran ne descend
   pas sous ~500 px ; l'anti-iframe de page.js laisse passer `file:`).
4. Montants au milieu d'un texte arabe : passer par `dt()` / `iso()` (isolation U+2066…U+2069) ; formules : `<span dir="ltr" style="white-space:nowrap">`.
5. Sabotage volontaire d'une copie de temps en temps pour vérifier que les tests sonnent.

## Robots (autonomie)
- `surveillance.yml` (1er du mois + chaque jour de janvier) : `tools/verifier_regles.py` compare 5 cas au simulateur de
  référence (adresse dans le secret GitHub REF_URL, et localement dans tools/.reference non suivi par git ; tolérance 2 millimes : leurs arrondis varient) → OK : met à jour `MAJ` (page.js), et à partir du
  15 janvier passe `ANNEE` et tous les « 2026 » isolés à la nouvelle année ; écart → issue « alerte-robot » (rien modifié).
  Commit mensuel = battement de cœur. Preuves CGU/robots du simulateur de référence : dossier parent (hors dépôt) `preuves conditions d'utilisation/2026-10-05/`.
- **TMM** (même robot, après la paie) : lit UNE fois par mois la page d'accueil de bct.gov.tn (même lecteur, User-Agent honnête) ;
  TMM différent de `REGLES_CREDIT.tmm`, ou mois à rafraîchir avant les 75 jours → **code 5**, issue « Crédit : le TMM … a changé » ;
  BCT illisible → **code 6**, issue « lecture du TMM impossible ». Le TMM du site n'est **jamais** modifié par le robot
  (la date de vérification de la paie est quand même publiée). Pour mettre à jour : changer `taux` et `mois` dans `REGLES_CREDIT.tmm`.
  À faire après la première publication : lancer `surveillance.yml` une fois à la main pour vérifier que GitHub peut lire la BCT.
- **Passage d'année** : `FICHIERS_ANNEE` ne contient PAS credit/ (aucune année écrite), auto-entrepreneur/ ni retenue-source/
  (dates fixes : « Depuis le 1er janvier 2026 », « septembre 2026 », « 2e trimestre 2026 »). Leurs titres « (2026) » sont donc
  à revoir **à la main** en janvier avec la loi de finances (l'alerte CSS de janvier 2027 le rappellera).
- **Ne jamais citer de concurrent** sur le site ni dans ce dépôt public (règle d'Ahmed). La liste servant au test est dans
  `tools/.concurrents` (local, ignoré par git ; vérification sautée sur GitHub).
- `tests.yml` à chaque push : YAML des robots valide + `test_site.mjs` + `test_nouveaux.mjs` + `test_sw.mjs` + `test_avis.mjs` + `test_robot.py`.
  Dans `.github/workflows/*.yml` : jamais de « : » dans un `run:` d'une ligne (utiliser `run: |`).
- L'année n'est écrite qu'à des endroits remplaçables automatiquement ; l'image d'aperçu n'a pas d'année.

## Visibilité
- sitemap.xml (7 pages) + robots.txt ; FAQ Google (JSON-LD) sur les 5 calculateurs ; image d'aperçu `assets/og-image-v5.jpg` (avec la photo des pièces et l'icône du site ; modèle `tools/og-image.html`, capture 1200×630 puis JPEG qualité 88 ; JPEG < 250 Ko, sinon WhatsApp n'affiche qu'une petite vignette ; balise `og:image:type`)
  (si on la change : **nouveau nom de fichier**, WhatsApp/Facebook gardent l'ancienne). L'ancien `og-image-v3.png` peut être supprimé.
- **Statistiques GoatCounter** (sans cookies, 05/10/2026) sur toutes les pages : compteur partagé
  `https://prix-eaux-tunisie.goatcounter.com` (pages séparées par chemin `/outils-pratiques-tunisie/…`) ;
  CSP : `script-src` + `https://gc.zgo.at`, `connect-src` / `img-src` + le compteur. Mentionné dans À propos. Les tests le vérifient.
- **Installation sur le téléphone** (05/10/2026) : `manifest.webmanifest` avec `"id": "/outils-pratiques-tunisie/"` (UNIQUE : tous les
  sites d'Ahmed partagent l'origine ah6259.github.io ; sans id, Chrome disait « déjà installée »), start_url/scope `./`,
  icônes `assets/icons/` (192, 512, maskable 512, apple-touch-icon 180) tirées de `assets/logo.svg`. Lien sur chaque page ; test.
- **Service worker** (05/10/2026, installation complète Chrome/Android + iPhone) : `sw.js` à la racine, portée `/outils-pratiques-tunisie/`,
  enregistré à la fin de `assets/page.js` (https seulement, try/catch). **Réseau d'abord** pour les pages HTML et les données (le cache ne sert
  que hors connexion ; sinon page « Hors connexion » FR+AR) ; CSS/JS/images avec `?v=` : cache puis mise à jour en arrière-plan.
  Jamais en cache : non-GET, autres origines (GoatCounter, polices…), autres sites d'Ahmed. Caches nommés `outils-pratiques-tunisie-<CACHE_VERSION>`
  (on ne supprime QUE les nôtres : l'origine est partagée). Vieille version bloquée sur un téléphone → changer `CACHE_VERSION`.
  Meta iPhone (`apple-mobile-web-app-capable`, `-title` « Outils TN ») sur chaque page. Test : `node tools/test_sw.mjs` (faux navigateur).
- Reste à faire par Ahmed : Search Console (renvoyer le sitemap).

## Photos et protection (05/10/2026)
- Bandeaux : **vraies photos libres de droits** (Wikimedia Commons) : `assets/photo-pieces-dinar.jpg`
  (accueil + salaire-net ; 金娜 Kim S, CC BY-SA 2.0), `assets/photo-calculatrice.jpg` (impot-revenu ; Coyau, CC BY-SA 3.0),
  `assets/photo-maison-tunis.jpg` (credit ; maison de la médina de Tunis, Rais67, domaine public),
  `assets/photo-atelier-tissage.jpg` (auto-entrepreneur ; atelier de tissage à Mahdia, Meriem Mach, CC BY-SA 4.0),
  `assets/photo-documents.jpg` (retenue-source ; pile de documents, Niklas Bildhauer, CC BY-SA 2.0). Aucune personne visible.
  Crédit + licence sous la photo (`figure.illus` avec `data-source` = page Commons), section « Photos » (#photos) dans À propos,
  ligne dans le pied de page. Preuves de licence (HTML, métadonnées, sha256, Internet Archive) : dossier parent (hors dépôt)
  `preuves conditions d'utilisation/2026-10-05/photos/`. Nouvelle photo = même chaîne (le test vérifie crédit, licence et preuve).
  Plus aucun dessin dans les bandeaux (les SVG provisoires des 3 nouvelles pages ont été supprimés ; `illus-paie.svg` / `illus-impot.svg` inutilisés).
- Sécurité / anti-copie : robots.txt interdit les robots d'IA et aspirateurs (moteurs de recherche permis) ; meta `noai, noimageai`,
  CSP stricte (scripts du site seulement → **aucun script dans les pages** : `assets/salaire.js`, `impot.js`, `credit.js`,
  `auto-entrepreneur.js`, `retenue.js`), referrer ;
  `page.js` : pas de clic droit/glisser sur les images, source ajoutée au texte copié, anti-iframe ; montants calculés
  (`.resultat`), champs et liens restent copiables. Liens externes des nouvelles pages : nouvelle fenêtre + `noopener`,
  uniquement vers des sources officielles (BCT, jibaya.tn, CNSS, autoentrepreneur.tn, TEJ) et Wikimedia/Creative Commons.

## Mise à jour du 05/10/2026 (soir)
- **Icône (famille commune des 5 sites)** : un seul symbole en aplats 2-3 tons, accent doré `#F2B33D`, sans texte ni brillance (règle d'Ahmed : jamais d'effet « image IA » ni de clip-art). Ce site : **les 4 opérations (+ − × =), la touche = en doré**. Source = `assets/logo.svg` ; PNG 192/512 = dessin arrondi, maskable 512 et iPhone 180 = même dessin sur carré plein, symbole à 78 %. Générateur (hors dépôt) : `_claude code project/icones des sites - generateur.py`. Changer l'icône → renouveler `CACHE_VERSION` de `sw.js`.
- **« Gratuit » mis en avant** (titres Google, descriptions, aperçus de partage, manifeste), seulement là où c'est vrai. La future partie payante n'est jamais annoncée à l'avance (décision d'Ahmed).
- **Aperçus WhatsApp** : tous les sites sont réglés pareil (1200 × 630, JPEG léger). WhatsApp sur PC fait de petites vignettes : envoyer les liens depuis le téléphone (ou transférer un message préparé sur le téléphone).
- **Règle d'Ahmed : tout tourne sur internet (GitHub), sans son PC ni son intervention, « même s'il meurt ».**
- Titres : « calcul gratuit » ajouté là où il manquait (retenue à la source).
- **Lien vers l'annuaire des comptables** (fait le 05/10/2026, validé par Ahmed) : dans chaque `.resultat`, `<p class="lien-pro" id="lien-pro" hidden>` vers https://ah6259.github.io/comptables-tunisie/ (nouvel onglet), texte FR + AR adapté au calculateur (jamais « meilleur »).
  Caché dans la page ; `lienPro(vrai/faux)` (page.js) l'affiche à la fin de chaque `calculer()` seulement s'il y a un résultat. Clic → GoatCounter événement `lien-comptables/<calculateur>` (attribut `data-compteur`). Aucun changement de CSP. Testé dans `test_site.mjs`. Aucun lien vers le mariage (garder le sérieux du site).
