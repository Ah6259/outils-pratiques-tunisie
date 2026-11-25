# Mémoire du projet — Outils pratiques Tunisie

## EN TOUT PREMIER (24/11/2026, problème vu par Ahmed)
- La mémoire générale, les « update workflow » et le journal de TOUS les sites sont dans le dépôt PRIVÉ **`Ah6259/projets-ahmed`**
  (le dépôt général), PAS ici. Une session ouverte sur ce seul dépôt ne voit donc pas le dernier travail d'Ahmed (le 24/11, une session
  a répondu « dernier update workflow : 22/11 » alors qu'il y en avait deux le jour même dans projets-ahmed).
- **Au début de CHAQUE session, avant de répondre quoi que ce soit** : si `../projets-ahmed` n'existe pas, le brancher
  (`add_repo` Ah6259/projets-ahmed, puis `git clone --depth 30 https://github.com/Ah6259/projets-ahmed ../projets-ahmed`) ; sinon `git pull` ;
  puis `python3 "debut de session.py" outils` dans `../projets-ahmed` et en résumer le résultat à Ahmed.
- « Dernier workflow / dernière mise à jour » = regarder `git log` de projets-ahmed ET de ce dépôt (toutes branches), jamais un seul.

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
- Créé le 04/10/2026. Calculateurs (exemple + **1 calcul gratuit par jour**, puis **Pass Journée 7 DT / 24 h**), **français + arabe** (bouton, ou `?lang=ar` dans l'adresse).
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
0. Pages modifiées dans `tools/sources/` (JAMAIS `<chemin>/index.html` ni `ar/` à la main) puis `python tools/construire.py` (voir 21/11/2026, une adresse par langue).
1. Les cinq tests (tout doit être vert) :
   `node tools/test_site.mjs` (≈ 410 vérifications, dont le Pass Journée et le bouton « Trouver un comptable » : calculs de référence, pages FR/AR, liens de l'accueil et du pied, photos, sécurité…),
   `node tools/test_nouveaux.mjs` (≈ 140 : crédit, auto-entrepreneur, retenue ; accepte un dossier en argument pour tester une copie),
   `PYTHONIOENCODING=utf-8 python tools/test_robot.py` (31 scénarios du robot),
   `node tools/test_sw.mjs` (service worker : réseau d'abord, exclusions, meta iPhone ; accepte un dossier en argument),
   `node tools/test_avis.mjs` (Votre avis : section, pied de page de toutes les pages, CSP, envoi simulé ; accepte un dossier en argument).
   jsdom s'installe une fois par PC : `npm install --no-save --no-package-lock jsdom` (node_modules ignoré).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages, **une seule version pour tout le site** (actuelle : `20261125e`) — les tests le vérifient.
3. Capture mobile 340/390 px en français ET en arabe si l'affichage change : Chrome sans écran sur une page HTML locale
   contenant deux `<iframe>` (340 et 390 px) vers les fichiers `file:///…?lang=fr|ar` (la fenêtre de Chrome sans écran ne descend
   pas sous ~500 px ; l'anti-iframe de page.js laisse passer `file:`).
4. Montants au milieu d'un texte arabe : passer par `dt()` / `iso()` (isolation U+2066…U+2069) ; formules : `<span dir="ltr" style="white-space:nowrap">`.
   Affichage (06/10/2026) : `[hidden]{display:none!important}` dans style.css (sinon l'encart des comptables, caché avant le calcul, pouvait rester visible) et **pas de faux boutons** : les badges « Identique aux fiches de paie / Aucune donnée envoyée / Gratuit » des 7 pages sont supprimés (cartes avec icône sans lien ; l'info est dans l'intro et le pied) ; test_site.mjs vérifie les deux.
5. Sabotage volontaire d'une copie de temps en temps pour vérifier que les tests sonnent.
6. **Visiteur simulé** (règle générale du 18/10/2026, outil commun copié tel quel) : `python3 tools/visiteur_simule.py` (aussi dans tests.yml) — liens/images morts, page à 390 px dans Chromium, et `tools/scenarios-visiteur.json` : il remplit les 5 calculateurs comme un visiteur et vérifie la LOGIQUE (brut plus haut → net plus haut, revenu → impôt, prix/taux/durée/apport/assurance → mensualité, montant → retenue, tranche CNSS → contribution) et l'écran « Pass Journée 7 DT » au 2e calcul d'un autre calculateur. Chaque paquet de 20 scénarios = un navigateur neuf = UN calculateur (calcul gratuit du jour) : garder l'alignement par 20 (complété par des lectures d'exemple). Jamais de « % » dans un scénario (l'outil plante).

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
- sitemap.xml (7 pages) + robots.txt ; FAQ Google (JSON-LD) sur les 5 calculateurs ; image d'aperçu `assets/og-image-v6.jpg` (06/10 : pastille « 1 calcul gratuit par jour » au lieu de « Gratuit ») (avec la photo des pièces et l'icône du site ; modèle `tools/og-image.html`, capture 1200×630 puis JPEG qualité 88 ; JPEG < 250 Ko, sinon WhatsApp n'affiche qu'une petite vignette ; balise `og:image:type`)
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
- **« Gratuit » mis en avant** seulement là où c'est vrai. Depuis le 06/10/2026 (Pass Journée) : « 1 calcul gratuit par jour » dans l'en-tête, les titres, descriptions, aperçus, manifeste ; plus aucun « Calculs gratuits » sans limite (test).
- **Aperçus WhatsApp** : tous les sites sont réglés pareil (1200 × 630, JPEG léger). WhatsApp sur PC fait de petites vignettes : envoyer les liens depuis le téléphone (ou transférer un message préparé sur le téléphone).
- **Règle d'Ahmed : tout tourne sur internet (GitHub), sans son PC ni son intervention, « même s'il meurt ».**
- Titres : « calcul gratuit » ajouté là où il manquait (retenue à la source).
- **Lien vers l'annuaire des comptables** (fait le 05/10/2026, validé par Ahmed) : dans chaque `.resultat`, `<p class="lien-pro" id="lien-pro" hidden>` vers https://ah6259.github.io/comptables-tunisie/ (nouvel onglet), texte FR + AR adapté au calculateur (jamais « meilleur »).
  Caché dans la page ; `lienPro(vrai/faux)` (page.js) l'affiche à la fin de chaque `calculer()` seulement s'il y a un résultat. Clic → GoatCounter événement `lien-comptables/<calculateur>` (attribut `data-compteur`). Aucun changement de CSP. Testé dans `test_site.mjs`. Aucun lien vers le mariage (garder le sérieux du site).

## Pass Journée (partie payante, 06/10/2026, accord écrit d'Ahmed — même règle que Documents)
- **Gratuit pour toujours** : l'EXEMPLE affiché à l'ouverture de chaque calculateur + **1 calcul personnel par jour et par appareil**
  (tous calculateurs confondus). « Calcul personnel » = le visiteur change un chiffre ou un choix (comparé à l'état de la page au
  chargement). Pendant **10 minutes** sur le même calculateur, il peut corriger ses chiffres (taper « 2500 » = 4 frappes).
  `localStorage` `opt-calcul-gratuit-v1` = `{jour, calc, debut}` (try/catch : stockage impossible = permis). Le lendemain : nouveau calcul gratuit.
- **2e calcul personnel du jour** : `body[data-verrou]` masque le résultat (`.resultat` sauf `#pass-bloque`, et les zones `[data-resultat]` :
  détail de l'impôt, tableau d'amortissement, verdict auto-entrepreneur) ; écran « Vous avez utilisé votre calcul gratuit du jour »
  → gros bouton doré **Pass Journée 7 DT (tous les calculs pendant 24 heures)**, « Revenez demain… », « J'ai déjà un code »,
  « Revoir l'exemple (gratuit) ». GoatCounter : événement `pass-bloque/<calculateur>` (une fois par page).
- Chaque `calculer()` commence par `if (window.porteCalcul && !porteCalcul("<calculateur>")) return;` (après les blocs du formulaire).
  Ligne `#pass-note` sous le résultat (exemple / calcul gratuit / Pass actif) avec petit bouton doré vers `pass/`.
- **Pass Journée = 7 DT, 24 heures à partir de l'activation** (appui d'Ahmed sur « paye »), heure de fin écrite dans le message.
  Nouveau paiement pendant un Pass : +24 h après la fin en cours. Pas de renouvellement automatique, aucune période payée remboursée,
  vendeur « l'éditeur du site » (JAMAIS le nom de la société), prix non TTC, INPDP (accord, sans numéro).
- Pages : `pass/` (prix, avantages, « Paiement » <details> D17/IZI 24 321 390, motif = code de commande (depuis le 25/11/2026, voir plus bas), bouton vert WhatsApp,
  « J'ai un code » `#code-acces`, formulaire Formspree `mwlpakqj` avec `pour_activer`), `pass/conditions/`. Sitemap : `pass/` (8 pages).
- **Bouton doré « Pass Journée »** dans l'en-tête SEULEMENT sur `<body data-pass>` (5 calculateurs + 2 pages du Pass) ;
  **jamais sur l'accueil** (décision d'Ahmed : le visiteur partirait) — ni bouton ni lien vers pass/ sur l'accueil (test).
  Lien « Pass Journée » dans le pied de page des autres pages.
- Code : `assets/pass.js` (chargé juste après page.js par les 7 pages). Code d'accès = 8 caractères sans O/0/I/1.
  `donnees/pass.json` (public) = `sel`, `tours` (100 000), `codes: [{h, fin}]` : h = PBKDF2-SHA-256(code, sel) ; fin = heure de fin
  en temps universel (`2026-10-07T13:32:00Z`). AUCUNE donnée personnelle (test). Code gardé dans `opt-pass-v1` ; revérifié au plus
  1 fois par heure (arrêté/expiré = effacé ; pas de réseau = gardé jusqu'à la fin). Rien n'est demandé au réseau sans code gardé.
- **Activation** : dépôt PRIVÉ `Ah6259/outils-pass` (dossier local `../pass (prive)/`), bouton « pass » dans l'application GitHub
  (paye / arret / liste) + nettoyage chaque nuit. Il écrit ici `donnees/pass.json` avec la clé de déploiement « robot-pass »
  (secret `CLE_SITE` du dépôt privé ; secours : `JETON_SITE`). Voir son README.
- **Limites honnêtes** : calcul gratuit compté dans le navigateur (vider le navigateur = nouveau calcul gratuit) ; un code peut être
  partagé pendant ses 24 h ; GitHub Pages met jusqu'à 10 min à publier un code.

## Bouton « Trouver un comptable » (06/10/2026, demande d'Ahmed : « améliorer les liens entre site et moteur »)
- Menu de l'en-tête (`MENU_SITE` dans page.js, toutes les pages) : **en premier** le bouton `a.menu-annuaire` (bordure dorée #F2B33D,
  logo de l'annuaire copié en `assets/logo-comptables.svg` car la CSP n'autorise que les images du site) vers
  https://ah6259.github.io/comptables-tunisie/ (nouvel onglet), puis les 5 calculateurs. Sur l'accueil : carte `#carte-comptables`
  (`.outil-annuaire`) avec les cartes des calculateurs. Clic compté « lien-site/comptables » (`data-compteur`). Les encarts sous les
  résultats (`lien-comptables/<calculateur>`) sont inchangés. Test : `boutonComptables()` dans test_site.mjs.
- **Bouton « Partager »** (06/10/2026, demande d'Ahmed) : icône ronde `.partager` dans `.entete-boutons` de toutes les pages (page.js, FR+AR) ; menu de partage du téléphone (`navigator.share`), sinon WhatsApp (`wa.me`) avec l'adresse sans `#` ni `?lang` ; clic compté `partage/<page>` dans GoatCounter. Test : `boutonPartager()` dans test_site.mjs.

- **Vidéo de présentation** (06/10/2026) : `assets/video/presentation.mp4`, 1080 × 1920, + couverture et aperçu 1200 × 630 (`apercu-video.jpg`). Musique de fond : J. S. Bach, Aria des Variations Goldberg (enregistrement Musopen, CC0, Wikimedia Commons ; preuve dans le dossier privé `videos (outil)/preuves musique/`). Page **`video/`** (lecteur + gros bouton « Ouvrir le site » + Partager, og:video / og:image) : réglages `tools/page_video.json`, fabriquée par node tools/page_video.mjs (à relancer si À propos change). Le bouton « Partager » envoie un LIEN : la page vidéo + l'adresse du site dans le texte (`window.partagerLien`, bloc « vidéo de présentation » en fin du JS commun), jamais le fichier. Test `node tools/test_video.mjs`.
  Pour la refaire : `python fabriquer.py outils` puis `python brancher_partage.py outils` dans le dossier PRIVÉ du PC `videos (outil)/`.

- **Adresse depuis le 11/10/2026 : https://outils.clicvia.com/** (domaine clicvia.com d'Ahmed, ligne DNS `CNAME outils → ah6259.github.io` nuage gris, fichier `CNAME`). L'ancienne adresse ah6259.github.io/outils-pratiques-tunisie/ redirige seule. Site à la racine « / » : `BASE_SITE` de assets/page.js (sw.js, vidéo) ; GoatCounter garde le préfixe `/outils-pratiques-tunisie`. Si l'outil vidéo réécrit le bloc VIDEO_SITE, remettre `"base": BASE_SITE` et l'ORIGINE outils.clicvia.com.
- **11/10/2026 — aperçu WhatsApp** : `og:url` (adresse canonique) ajouté sur chaque page (sans lui, WhatsApp peut montrer une petite vignette ; règle commune § 14).

- **Visibilité Google (12/10/2026, règle commune § 8)** : liens vers nos autres sites en `https://<site>.clicvia.com/` (jamais `ah6259.github.io`), lien « Tous nos services » → https://clicvia.com/ dans le pied de page, `robots.txt` avec ligne Sitemap, `sitemap.xml` daté, JSON-LD sur l'accueil, clé IndexNow `377f054ba9c5ed40d6796adc8d87d1e8.txt` à la racine (ne pas supprimer : robot `indexnow` du portail). Contrôle : `node "outils visibilite/controle.mjs"` (dépôt projets-ahmed). Sitemap envoyé dans Search Console par Ahmed le 12/10/2026.

- **Google + Bing (12/10/2026)** : sitemap envoyé par Ahmed dans Google Search Console et dans Bing Webmaster Tools (site clicvia.com/), indexation de l'accueil demandée. Pour un nouveau site : mêmes gestes, voir `nouveau site - procedure.md` § 4 étape 5 (dépôt projets-ahmed).

- **18/10/2026 (Pass : case du code, leçon de l'immobilier)** : sur `pass/`, la carte « J'ai un code » (`#code-acces`, champ `#code-saisie`, formulaire `#code-form`) est maintenant EN HAUT, juste sous `#pass-etat`, avant l'offre — visible quel que soit l'état du téléphone ; un code tapé remplace l'ancien (`opt-pass-v1`). Ce site n'a PAS d'essai gratuit (test). Message « code expiré » : « ci-dessous ». Version `?v=20261018a`. Tests « Pass : … » dans test_site.mjs.

- **19/10/2026 — Visiteur simulé : contrôle des ESPACES (règle commune § 29)** : nouvelle copie commune installée, 0 anomalie, aucun défaut d'espace sur ce site.

- **20/10/2026 — Rappel de fin du Pass Journée (demande d'Ahmed ; pas de Telegram ni d'e-mail, la page parle au client)** : `afficherRappel()` de
  `assets/pass.js` met sous l'en-tête (calculateurs + pages Pass) un bandeau `#rappel-pass` dans les 6 dernières heures (dernier quart des 24 h),
  au plus 1 fois par jour (mémoire `opt-pass-rappel-v1`) : « Merci pour votre inscription ! Votre Pass Journée se termine le JJ/MM/AAAA à HHhMM »,
  bouton doré « Renouveler mon Pass » (`pass/#offre`), lien « Donner mon avis » (`#avis` de l'accueil), croix ; après la fin (≤ 30 jours) :
  « terminé — merci ! » une fois. FR + AR, 11 tests « rappel du Pass » dans test_site.mjs ; version 20261020a.
- **20/10/2026 — lien TUNIMPOT (demande d'Ahmed)** : page `impot-revenu/`, carte « Source officielle » : paragraphe `#tunimpot`
  (FR + AR) vers le simulateur officiel gratuit du ministère des Finances, l'application **TUNIMPOT** sur Google Play
  (`tn.gov.finances.tunimpot`, éditeur CIMF, vérifié en ligne le 20/10/2026), clic compté `lien-tunimpot/impot-revenu` ; test dans test_site.mjs.
  Pas de lien App Store (l'application n'y est plus : id1214945134 introuvable) ; pas de lien vers la page officielle
  impots.finances.gov.tn/…/tunimpot (en http, injoignable depuis nos serveurs le 20/10) : à ajouter si elle répond un jour en https.

- **RÈGLE D'AHMED (25/10/2026, règle commune § 44) : la page « Comment fonctionne le site ? » (`a-propos/`, FR + AR, h1 « Comment fonctionne le site ? » / « كيف يعمل الموقع؟ ») est mise à jour à CHAQUE modification visible, dans le même envoi** (nouveau calculateur, fonction changée ou retirée). Cartes `#fonctionnement` (chaque fonction en une ligne), `#gratuit-pass` (exemple + 1 calcul gratuit par jour, Pass Journée), `#mises-a-jour` (robot mensuel, TMM, site indépendant), puis méthode / vos données / limites / sources / photos. Liens : pied de page de toutes les pages (`page.js`, « Comment fonctionne le site ? ») et accueil (`#lien-fonctionnement`). **Test `FONCTIONS` dans `tools/test_site.mjs`** (repère dans le code -> phrase attendue dans la page) : fonction présente mais non expliquée = test rouge = publication bloquée. Nouvelle fonction = une ligne dans `FONCTIONS` + son explication FR + AR. Pas d'année écrite dans ces nouvelles cartes (test « toutes les pages affichent l'année »). Versions 20261025a.

- **08/11/2026 — plan SEO d'Ahmed appliqué à ce site (phase 2 ; contrôle commun `outils visibilite/controle_seo.mjs` de projets-ahmed ;
  plan : `consignes des taches/seo-outils.md`)** : titres des 9 pages ramenés à <= 70 caractères (le suffixe « | Outils pratiques Tunisie »
  retiré des calculateurs), descriptions <= 165 ; « 1 calcul gratuit par jour » reste dans la description de l'accueil et d'À propos
  (test existant). Avant : titres de 84 à 114 caractères, descriptions de 182 à 300 (Google les coupait). Test « SEO : titre de 10 à 70
  caractères et description de 40 à 170, titres uniques » dans test_site.mjs ; les 6 tests verts.
- **17/11/2026 — page 404 commune + liens Confidentialité / Conditions (liste des « 20 points » d'Ahmed)** : `404.html` + `404.js` à la racine
  (modèle `outils communs/page-404/` de projets-ahmed : le modifier là-bas puis `installer.py site "Outils pratiques Tunisie" "#0B7A53"`) ;
  pied (assets/page.js) : liens https://clicvia.com/confidentialite/ et /conditions/ (versions ar/ quand la page est en arabe) ;
  test_site.mjs bloque si la 404 ou un lien manque (FR + AR, toutes les pages) ; 404.html exclue de test_sw / test_avis. Version 20261117a.

## 21/11/2026 — Mode sombre lisible (signalé par Ahmed : mots illisibles en sombre) — version 20261121a
- En sombre, `--vert` devient clair : texte blanc dessus illisible (bouton « Envoyer », onglet du calculateur courant, vidéo) et bandeau du haut blanc sur vert clair (~2,2).
  Bloc « Mode sombre lisible » à la fin de `assets/style.css` : bandeau aux verts foncés, texte foncé sur l'accent, fonds blancs -> `var(--carte)`, verts WhatsApp foncés, `--rouge` plus clair (montants « − »).
- Bloc « Paiement » (`ol.paie-etapes`, D17/IZI) : ce site n'avait PAS de `--p` (fond clair codé en dur, texte clair en sombre = 1,0 ; puces invisibles en clair) -> `--p` / `--p-clair` / `--p-tres-clair` = verts du site. Contrôle Playwright (≥ 4,5 en sombre, toutes les pages) : 0 défaut.

## 21/11/2026 — UNE ADRESSE PAR LANGUE (règle commune § 8 point 9 ; méthode de Code de la route) — version 20261121b, `CACHE_VERSION` 5
- Avant : français et arabe mêlés dans la même page (`?lang=ar`), Google ne voyait qu'une page « française » à moitié arabe (« hreflang : aucun »).
- Les 9 pages publiques (accueil, 5 calculateurs, a-propos, pass, pass/conditions) sont ÉCRITES dans `tools/sources/<chemin>/index.html`
  (bilingues, spans data-l comme avant) et FABRIQUÉES par `python tools/construire.py` : `<chemin>/index.html` = français seul
  (lang="fr", data-langue-fixe="fr", data-autre-langue) et `ar/<chemin>/index.html` = arabe seul (lang="ar" dir="rtl", titre et description
  arabes de `tools/sources/textes-ar.json`, canonical / og:url ar/…, og:locale ar_AR, alt des photos en arabe, FAQ JSON-LD française retirée,
  fichiers pris à la racine : data-racine un niveau plus bas, data-site = dossier des pages), hreflang fr / ar / x-default (= fr) sur les deux.
  Plan du site : 9 FR + 9 AR + video/. **Modifier les sources puis construire, jamais `ar/` (ni les pages françaises) à la main** :
  `python tools/construire.py --verifier` (étape de `tests.yml` + test_site.mjs) rougit si une page fabriquée n'est pas à jour.
- `video/` garde une seule adresse (`?lang=ar`) ; `tools/page_video.json` prend maintenant `tools/sources/a-propos/index.html` comme modèle
  (sinon la page vidéo hériterait de data-langue-fixe).
- `assets/page.js` : langue = celle de l'adresse ; bouton de langue = autre adresse (mêmes paramètres et ancre ; crochet `window.allerVers` des
  tests) ; ancien lien `?lang=ar` renvoyé vers ar/ ; langue gardée renvoyée seulement en venant d'une page du site (jamais robot, lien partagé,
  Google, cadre) ; liens des pages (menu, pied, logo, Pass) = `window.racinePages()`, fichiers = `data-racine`. pass.js : `racinePagesPass()`.
  Partager : l'adresse du site en arabe est `…/ar/`.
- Robot `surveillance.yml` : `FICHIERS_ANNEE` vise les SOURCES (accueil, salaire-net, impot-revenu, a-propos) + les titres arabes de ces pages
  dans textes-ar.json, puis `changer_annee()` relance la construction (pages FR + ar/ refaites ; test_robot.py le vérifie : 32 scénarios).
- Tests : `page(p, "ar")` / `ouvrir(p, {lang:"ar"})` ouvrent ar/<chemin> ; bloc « une adresse par langue » de test_site.mjs (une langue par page,
  hreflang réciproques, canonical, og:url, og:locale, titres arabes uniques <= 70, liens valides, menu/pied en ar/, bouton de langue, renvoi
  `?lang=ar`, pages à jour) ; test_nouveaux, test_avis, test_video adaptés ; scénarios du visiteur simulé en arabe sur `ar/…`.
- Mode clair : boutons WhatsApp (`.partage`, `.btn-wa`) en vert #1A7F45 (blanc dessus 3,5 / 2,9 avant) ; contrôle sombre + clair (4,5) : 0.
- Page « Comment fonctionne le site ? » : ligne « Une adresse par langue » (FR + AR) + ligne `FONCTIONS`.

## 21-22/11/2026 — Google + IA (demande d'Ahmed : « que Google et les IA indexent nos sites »)
- État Search Console (21/11) : accueil « Submitted and indexed » (une des 3 pages enregistrées de tous les sites) ; salaire-net/ et
  impot-revenu/ « Discovered - currently not indexed ». Requêtes vues : « simulateur cea tunisie » (aucun calculateur CEA : idée possible).
- Accueil : H1 français « Salaire net, impôt, crédit : les calculs du quotidien en Tunisie » (mots tapés) ; JSON-LD WebSite + éditeur
  `Organization` Clicvia (sameAs page Facebook) dans tools/sources/index.html.
- `llms.txt` réécrit à la main SANS année ni chiffre périmé (l'ancien, de l'outil commun du 13/10, écrivait « 2026 » partout).
- « Comment fonctionne le site ? » (FR + AR) : « Publié par Clicvia… pour nous écrire : Votre avis » (carte « Mises à jour automatiques et site indépendant »).

## 24/11/2026 — Pass : E-MAIL OBLIGATOIRE (règle d'Ahmed : un e-mail automatique enverra bientôt au client son code et les étapes du paiement)
- Formulaire `#pass-form` (source `tools/sources/pass/index.html`, FR + AR fabriquées) : champ `#pass-email` (`type="email" name="email" required`)
  juste après le téléphone ; `assets/pass.js` refuse l'envoi si l'e-mail est vide ou invalide (`^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`) et l'envoie à Formspree.
  Texte « données » du formulaire et des conditions du Pass : e-mail ajouté (nom, téléphone, e-mail). Tests « e-mail » dans test_site.mjs
  (champ required FR + AR + source, envoi refusé sans e-mail ou avec un e-mail invalide, e-mail transmis). Version 20261124a.

## 25/11/2026 — CODE DE COMMANDE créé AU FORMULAIRE (décision d'Ahmed, règle commune § 70 ; référence : `outils communs/pass-commun/CONSIGNES.md` de projets-ahmed)
- Formulaire valide (nom, téléphone 8 chiffres, e-mail, conditions ; formule cachée) -> `nouveauCodeCommande()` de `assets/pass.js` crée le code
  (`crypto.getRandomValues`, MÊME alphabet et MÊME longueur que les codes d'accès : 8 caractères sans O/0/I/1, affiché `ABCD-EF23`).
  Envoyé à Formspree (champ `code`, sujet « … — code ABCD-EF23 », ligne `pour_activer` = `action: paye ; nom: … ; telephone: … ; code: ABCD-EF23`).
  Envoi raté = même code au nouvel essai.
- « Dernière étape » (`#apres-pass`, FR + AR) : code en gros (`#code-commande`, dir=ltr) + « C'est votre numéro de commande… » + « Vous le recevez aussi
  par e-mail » ; paiement en 3 étapes avec MOTIF = le code (24 321 390 ; en arabe 24321390) ; WhatsApp pré-rempli avec le code (`lienPreuve()`) ;
  « Ensuite » ; filet « code oublié dans le motif » ; bouton « Nouvelle commande ».
- Mémoire `pass-commande` = `{code, formule, date}` SEULEMENT (60 jours). Retour sur pass/ : bandeau `#commande-attente` + étapes + WhatsApp,
  le code est essayé tout seul (`verifierCommandeAttente()` -> `activerCode`) : activé = Pass ouvert + clé effacée ; sinon « En attente de votre paiement ».
  Un code tapé dans « J'ai un code » qui est celui de la commande l'efface aussi (`finCommande`).
- Le Pass dure toujours 24 heures à partir de l'ACTIVATION (appui d'Ahmed), pas du formulaire. Motif = le code partout (page, conditions, a-propos) ;
  plus jamais « nom et téléphone » (test).
- Activation (dépôt privé outils-pass, bouton « pass ») : action `paye` + `code` + `nom` + `telephone` (recopiés de `pour_activer`) -> CE code activé tel
  quel ; refusé si mauvais format ou déjà utilisé ; code vide = ancien comportement ; code seul d'un client connu = réactivation (codes déjà vendus OK).
- Tests : bloc « CODE DE COMMANDE » de test_site.mjs (FR + AR, mémoire, retour, activation, 60 jours, données perso, 300 codes) + ligne FONCTIONS ;
  version 20261125b ; phrase « Vous le recevez aussi par e-mail » cachée tant que `EMAIL_AUTO = false` (assets/pass.js : e-mail automatique pas encore en service).

## 25/11/2026 — E-MAIL AUTOMATIQUE EN SERVICE (A.17, méthode `outils communs/email-clients/BRANCHER-UN-SITE.md` de projets-ahmed, modèle Alerte Concours)
- `assets/pass.js` : `EMAIL_AUTO = true` ; `envoyerEmail(d)` envoie (sans attendre, jamais bloquant) au service `https://api-email.clicvia.com/inscription`
  le JSON `{ site: "outils", langue (fr|ar, langue de la page), nom, email, code (ABCD-EF23, celui affiché), formule (valeur exacte du champ caché) }`,
  appelé UNE fois juste avant Formspree, après toutes les vérifications, jamais si le piège `_gotcha` est rempli. Le service (Worker Cloudflare + Resend,
  copie à Ahmed) écrit au client dans la langue de la page. Retour en arrière : `EMAIL_AUTO = false` (phrases cachées, rien envoyé).
- Phrases `.email-auto` affichées (« vous y recevez votre code et les étapes du paiement », « Vous le recevez aussi par e-mail ») ; CSP de `pass/`
  (source `tools/sources/pass/index.html`) : `connect-src` + `https://api-email.clicvia.com` ; « Comment fonctionne le site ? » : « E-mail de confirmation »
  + « Vos données » (Formspree, Resend, rien n'est gardé), 2 lignes FONCTIONS.
- Tests (test_site.mjs, FR + AR) : promesses visibles, sans e-mail = erreur longue et rien envoyé, piège = rien, JSON exact, CSP, et JSON ACCEPTÉ par le vrai
  `verifier()` du service (worker.js + sites.json de `../projets-ahmed` s'il existe ; sinon sauté). Version 20261125d.

## 25/11/2026 — Pass : MODULE COMMUN du parcours d'achat (PASS.1, règle commune § 70.8 ; `outils communs/pass-commun/` de projets-ahmed)
- La page pass/ (FR + ar/) charge `assets/pass.js` (codes d'accès, calcul gratuit, Pass ouvert, rappels : inchangé), puis **`assets/pass-commun.js`**
  (COPIE EXACTE du module de projets-ahmed, empreinte `assets/pass-commun.empreinte` : NE JAMAIS LA MODIFIER ICI ; on améliore le module puis
  `python3 "outils communs/pass-commun/synchroniser.py"`), puis **`assets/pass-reglages.js`** (propre au site : nom, formule unique, code
  `PASS.alphabet` / `PASS.longueur` affiché ABCD-EF23, textes du site, `pour_activer`, bandeau du retour `auRetour`, `apresAuRetour`, `classesEtat`
  attente / err, `essayerCode` = `activerCode()` APRÈS la revérification du Pass gardé (`window.PASS_PRET` de pass.js)). Source
  `tools/sources/pass/index.html` : les 2 scripts + attributs `data-code`, `data-email-auto`, `data-etat-commande`. Restent dans pass.js : liens
  WhatsApp sans commande (`majLiensPreuve()`), `cacherCommande()`, `finCommande()` (code tapé = commande effacée). Rien ne change pour le visiteur
  (comparaison avant / après FR + AR) ; différence voulue : e-mail automatique UNE fois par commande. Tests : bloc « module commun du Pass » de
  test_site.mjs (empreinte, copie identique si projets-ahmed est à côté — variable `PROJETS_AHMED` —, scripts, module branché) ; 14 sabotages vérifiés. Version 20261125e.
