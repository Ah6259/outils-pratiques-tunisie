// Test des pages Crédit, Auto-entrepreneur et Retenue à la source — à lancer après chaque modification :
//   node tools/test_nouveaux.mjs            (ou : node tools/test_nouveaux.mjs <dossier du site> pour tester une copie)
// Même méthode que test_site.mjs : pages chargées comme un navigateur, scripts remplacés par leur contenu.
// jsdom s'installe une fois par PC :  npm install --no-save --no-package-lock jsdom
import { JSDOM } from "jsdom";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { createRequire } from "module";

const root = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = f => readFileSync(join(root, f), "utf8");
let erreurs = 0, total = 0;
const check = (desc, cond) => { total++; console.log((cond ? "OK   " : "FAIL ") + desc); if (!cond) erreurs++; };
const proche = (a, b, tol = 0.0015) => Math.abs(a - b) < tol;   // au millime près
const charger = f => { const req = createRequire(import.meta.url); const p = join(root, f); delete req.cache[p]; return req(p); };

// ================= 1. CRÉDIT : exemples calculés à la main =================
const C = charger("assets/calcul-credit.js");
// Exemple 1 : 100 000 DT, 10 %/an, 20 ans. r = 0,1/12 ; (1+r)^240 = 7,328073 ; M = 833,333 / (1 − 1/7,328073) = 965,022
let k = C.calculCredit({ prix: 100000, duree: 20, unite: "ans", tauxFixe: 10 });
check("crédit 100 000 DT, 10 %, 20 ans : mensualité 965,022", proche(k.mensualite, 965.022));
check("crédit 100 000 DT : 240 mensualités", k.mois === 240 && k.lignes.length === 240);
check("crédit 100 000 DT : intérêts 131 605,003 (239 × 965,022 + 964,745 − 100 000)", proche(k.interets, 131605.003));
check("crédit 100 000 DT : dernière ligne solde le capital (reste 0)", k.lignes.at(-1).reste === 0);
check("crédit : somme du capital remboursé = capital emprunté", proche(k.lignes.reduce((s, l) => s + l.capital, 0), 100000, 0.01));
// Exemple 2 : 12 000 DT, 12 %/an, 12 mois. r = 1 % ; 1,01^12 = 1,126825 ; M = 120 / 0,112551 = 1 066,185 ; intérêts 794,226
k = C.calculCredit({ prix: 12000, duree: 12, unite: "mois", tauxFixe: 12 });
check("crédit 12 000 DT, 12 %, 12 mois : mensualité 1 066,185", proche(k.mensualite, 1066.185));
check("crédit 12 000 DT : intérêts 794,226", proche(k.interets, 794.226));
// Exemple 3 : 1 000 DT, 12 %, 2 mois — tableau complet à la main :
// M = 10 / (1 − 1/1,0201) = 507,512 ; mois 1 : intérêts 10,000, capital 497,512, reste 502,488 ;
// mois 2 : intérêts 5,025 (502,488 × 1 %), capital 502,488, échéance 507,513, reste 0
k = C.calculCredit({ prix: 1000, duree: 2, unite: "mois", tauxFixe: 12 });
const [l1, l2] = k.lignes;
check("amortissement 1 000 DT / 2 mois : ligne 1 = 10,000 + 497,512, reste 502,488", l1.interets === 10 && l1.capital === 497.512 && l1.reste === 502.488);
check("amortissement 1 000 DT / 2 mois : ligne 2 = 5,025 + 502,488 = 507,513, reste 0", l2.interets === 5.025 && l2.capital === 502.488 && l2.echeance === 507.513 && l2.reste === 0);
// Exemple 4 : taux 0 % -> capital / n
k = C.calculCredit({ prix: 30000, duree: 5, unite: "ans", tauxFixe: 0 });
check("crédit à 0 % : 30 000 DT / 60 mois = 500,000, aucun intérêt", k.mensualite === 500 && k.interets === 0);
// Apport, TMM + marge, assurance
k = C.calculCredit({ prix: 130000, apport: 30000, duree: 20, mode: "tmm", tmm: 7, marge: 3, assurancePct: 0.5 });
check("apport déduit : 130 000 − 30 000 = 100 000 empruntés", k.capital === 100000);
check("TMM 7 % + marge 3 % = 10 % (même mensualité que l'exemple 1)", k.taux === 10 && proche(k.mensualite, 965.022));
check("assurance 0,5 %/an de 100 000 = 41,667 par mois ; total 1 006,689", proche(k.assuranceMois, 41.667) && proche(k.mensualiteTotale, 1006.689));
check("coût total = intérêts + assurance", proche(k.cout, k.interets + k.assurance));
check("TMM par défaut = valeur officielle de REGLES_CREDIT", C.tauxCredit("tmm", 0, 2) === C.REGLES_CREDIT.tmm.taux + 2);
// Cas limites
const sansNaN = o => JSON.stringify(o).match(/NaN|null|Infinity/) === null;
check("apport > prix : rien à emprunter, mensualité 0, pas de NaN", (k = C.calculCredit({ prix: 1000, apport: 5000, duree: 10, tauxFixe: 9 })).capital === 0 && k.mensualite === 0 && sansNaN(k));
check("valeurs négatives ramenées à 0", (k = C.calculCredit({ prix: -5000, duree: -3, tauxFixe: -2 })).capital === 0 && k.mensualite === 0 && sansNaN(k));
check("durée 0 : pas de tableau, pas de NaN", (k = C.calculCredit({ prix: 50000, duree: 0, tauxFixe: 8 })).lignes.length === 0 && sansNaN(k));
check("durée 0 avec assurance : mensualité totale 0 (pas d'assurance seule)", C.calculCredit({ prix: 50000, duree: 0, tauxFixe: 8, assurancePct: 0.5 }).mensualiteTotale === 0);
check("très grand montant (1 milliard, 50 ans, 25 %) : résultat fini", sansNaN(C.calculCredit({ prix: 1e9, duree: 50, tauxFixe: 25 })));
check("durée plafonnée à 600 mois", C.calculCredit({ prix: 1000, duree: 100, tauxFixe: 5 }).mois === 600);
check("TMM : règle datée et source BCT", /^\d{4}-\d{2}$/.test(C.REGLES_CREDIT.tmm.mois) && C.REGLES_CREDIT.tmm.source.includes("bct.gov.tn") && C.REGLES_CREDIT.tmm.taux > 0);
check("TMM récent le 05/10/2026, à vérifier en 2027", C.tmmRecent(new Date(2026, 9, 5)) && !C.tmmRecent(new Date(2027, 2, 1)));

// ================= 2. AUTO-ENTREPRENEUR =================
const A = charger("assets/calcul-auto.js");
let c = A.contributionAE({ annee: 2, zone: "communal", regime: "tns", tranche: 1 });
check("auto : 2e année, zone communale, CNSS 1re tranche = 200 + 4 × 235,389 = 1 141,556", c.impot === 200 && proche(c.social, 941.556) && proche(c.total, 1141.556));
c = A.contributionAE({ annee: 3, zone: "autre", regime: "artisan" });
check("auto : autre zone, artisan = 100 + 12 × 25,400 = 404,800", c.impot === 100 && proche(c.social, 304.8) && proche(c.total, 404.8));
c = A.contributionAE({ annee: 1 });
check("auto : 1re année exonérée (0) mais montant suivant connu", c.total === 0 && proche(c.totalSansExoneration, 1141.556));
c = A.contributionAE({ annee: 2, tranche: 10 });
check("auto : tranche 10 = 200 + 4 × 4 237,010", proche(c.total, 200 + 4 * 4237.010));
check("auto : tranche hors limites ramenée entre 1 et 10", proche(A.contributionAE({ tranche: 99 }).social, 4 * 4237.010) && proche(A.contributionAE({ tranche: -3 }).social, 941.556));
check("auto : table CNSS cohérente (cotisation = base × 14,71 % au millime)", A.REGLES_AE.cnssTns.tranches.every(([, b, cot]) => Math.abs(b * 0.1471 - cot) < 0.0015));
check("auto : CNSS artisans cohérente (338,666 × 7,5 % = 25,400)", proche(A.REGLES_AE.cnssArtisans.baseMois * 0.075, A.REGLES_AE.cnssArtisans.mois));
check("auto : plafond 75 000 DT", A.REGLES_AE.plafondCA === 75000);
const ok = { tunisien: true, seul: true, activite: "commerce", ca: 30000, dejaDeclare: false };
check("éligible : Tunisien, seul, commerce, 30 000 DT", A.eligibiliteAE(ok).statut === "oui");
check("éligible : chiffre d'affaires = 75 000 DT pile", A.eligibiliteAE({ ...ok, ca: 75000 }).statut === "oui");
check("non éligible : 75 001 DT", A.eligibiliteAE({ ...ok, ca: 75001 }).raisons.includes("plafond"));
check("non éligible : nationalité étrangère", A.eligibiliteAE({ ...ok, tunisien: false }).statut === "non");
check("non éligible : société", A.eligibiliteAE({ ...ok, seul: false }).statut === "non");
check("non éligible : profession libérale", A.eligibiliteAE({ ...ok, activite: "liberale" }).raisons.includes("activite"));
check("non éligible : déjà une déclaration d'existence", A.eligibiliteAE({ ...ok, dejaDeclare: true }).raisons.includes("existence"));
check("à vérifier : agriculture (non citée par la DGI)", A.eligibiliteAE({ ...ok, activite: "agriculture" }).statut === "verifier");
check("à vérifier : chiffre d'affaires vide ou négatif", A.eligibiliteAE({ ...ok, ca: NaN }).statut === "verifier" && A.eligibiliteAE({ ...ok, ca: -5 }).statut === "verifier");
check("non éligible : très grand chiffre d'affaires", A.eligibiliteAE({ ...ok, ca: 1e12 }).statut === "non");
check("auto : sources officielles dans les règles", Object.values(A.REGLES_AE.sources).every(u => /jibaya\.tn|cnss\.tn|autoentrepreneur\.tn/.test(u)));

// ================= 3. RETENUE À LA SOURCE =================
const R = charger("assets/calcul-retenue.js");
// Exemples OFFICIELS du cahier des charges TEJ (DGI, septembre 2026)
let r = R.calculRetenue({ montant: 5000, operation: "hon-reel", tva: 19 });
check("exemple officiel TEJ 1 : honoraires 5 000 HT, TVA 950, TTC 5 950, retenue 3 % 178,500, net 5 771,500",
  r.montantTVA === 950 && r.ttc === 5950 && r.rs === 178.5 && r.net === 5771.5);
r = R.calculRetenue({ montant: 10000, operation: "non-resident", tva: 19, rsTva: 100 });
check("exemple officiel TEJ 2 : non-résident 10 000 HT, retenue 15 % 1 785, TVA retenue 100 % 1 900, net 8 215",
  r.ttc === 11900 && r.rs === 1785 && r.retenueTVA === 1900 && r.net === 8215);
// Calculés à la main
r = R.calculRetenue({ montant: 1000, operation: "loyer", tva: 0 });
check("loyer 1 000 DT sans TVA : retenue 10 % = 100, net 900", r.rs === 100 && r.net === 900);
r = R.calculRetenue({ montant: 2000, operation: "achats", tva: 19, rsTva: 25 });
check("achat 2 000 HT + TVA 19 % : TTC 2 380, retenue 1,5 % 35,700, TVA retenue 25 % 95, net 2 249,300",
  r.ttc === 2380 && r.rs === 35.7 && r.retenueTVA === 95 && r.net === 2249.3);
check("achat de 800 DT TTC : sous le seuil de 1 000 DT, pas de retenue", (r = R.calculRetenue({ montant: 800, sens: "ttc", operation: "achats" })).rs === 0 && r.sousSeuil);
check("achat de 1 000 DT TTC pile : retenue 15,000", R.calculRetenue({ montant: 1000, sens: "ttc", operation: "achats" }).rs === 15);
check("montant TTC 5 950 (TVA 19 %) -> HT 5 000", R.calculRetenue({ montant: 5950, sens: "ttc", operation: "hon-reel", tva: 19 }).ht === 5000);
check("net 5 771,500 -> HT 5 000 (calcul inverse)", R.calculRetenue({ montant: 5771.5, sens: "net", operation: "hon-reel", tva: 19 }).ht === 5000);
check("net 8 215 non-résident -> HT 10 000", R.calculRetenue({ montant: 8215, sens: "net", operation: "non-resident", tva: 19, rsTva: 100 }).ht === 10000);
check("inverse : le net recalculé retombe sur le net demandé (1 234,567)", R.calculRetenue({ montant: 1234.567, sens: "net", operation: "hon-forfait", tva: 19, rsTva: 25 }).net === 1234.567);
check("dividendes : la TVA est ignorée", R.calculRetenue({ montant: 1000, operation: "dividendes", tva: 19, rsTva: 25 }).ttc === 1000);
check("retenue 0, négatif, très grand : pas de NaN", [0, -100, 1e12].every(m => sansNaN(R.calculRetenue({ montant: m, operation: "achats", tva: 19, rsTva: 25 }))));
check("montant négatif ramené à 0", R.calculRetenue({ montant: -100, operation: "loyer" }).net === 0);
check("opération inconnue -> première opération (pas d'erreur)", R.calculRetenue({ montant: 100, operation: "???" }).op.id === R.REGLES_RS.operations[0].id);
const T = Object.fromEntries(R.REGLES_RS.operations.map(o => [o.id, o.taux]));
check("taux officiels : loyers 10, hôtels 5, honoraires réel 3 / forfait 10, achats 1,5 / 1 / 0,5, occasionnel 15, non-résidents 15",
  T.loyer === 10 && T.hotel === 5 && T["hon-reel"] === 3 && T["hon-forfait"] === 10 && T.achats === 1.5 && T["achats-is15"] === 1 && T["achats-is10"] === 0.5 && T.occasionnel === 15 && T["non-resident"] === 15);
check("chaque opération a un code TEJ valide", R.REGLES_RS.operations.every(o => /^RS\d{1,2}_\d{6}$/.test(o.code)));
check("règles de la retenue datées, sources officielles", /\d{2}\/\d{2}\/\d{4}/.test(R.REGLES_RS.verifie) && R.REGLES_RS.source.includes("jibaya.tn") && R.REGLES_RS.tej === "https://tej.finances.gov.tn");

// ================= 4. PAGES (comme un navigateur) =================
async function page(chemin, lang = "fr") {
  const dossier = dirname(join(root, chemin));
  const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
    (_, a, src) => `<script>${readFileSync(join(dossier, src), "utf8")}</script>`);
  const dom = new JSDOM(html, { url: `https://ah6259.github.io/outils-pratiques-tunisie/${chemin.replace("index.html", "")}?lang=${lang}`,
                               runScripts: "dangerously", pretendToBeVisual: true });
  await new Promise(ok => dom.window.addEventListener("load", ok));
  return dom.window;
}
const texte = el => el.textContent.replace(/[⁦⁩  ]/g, " ").replace(/\s+/g, " ");
const saisir = (w, id, v) => { const e = w.document.getElementById(id); e.value = v; e.dispatchEvent(new w.Event("input")); e.dispatchEvent(new w.Event("change")); };
const cliquer = (w, nom, v) => w.document.querySelector(`.choix[data-nom="${nom}"] button[data-v="${v}"]`).dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const propre = w => !/NaN|undefined|Infinity|\[object/.test(w.document.querySelector("main").textContent);

const PAGES = ["credit/index.html", "auto-entrepreneur/index.html", "retenue-source/index.html"];

// --- crédit
let w = await page("credit/index.html"), d = w.document;
check("page crédit : mensualité affichée au chargement (120 000 DT, 10 %, 20 ans -> 1 158,026)", texte(d.getElementById("grand")).includes("1 158,026"));
check("page crédit : 240 mois + 20 lignes d'année dans le tableau d'amortissement", d.querySelectorAll("#amort tbody tr").length === 260);
check("page crédit : barre capital / intérêts", d.querySelectorAll("#barre span").length === 2);
saisir(w, "prix", "100000"); saisir(w, "apport", "0");
check("page crédit : 100 000 DT -> 965,022", texte(d.getElementById("grand")).includes("965,022"));
cliquer(w, "mode", "tmm");
check("page crédit : mode TMM affiche le TMM officiel, sa date et la BCT", !d.getElementById("bloc-tmm").classList.contains("cache")
  && texte(d.getElementById("tmm-info")).includes("7,00 %") && texte(d.getElementById("tmm-info")).includes("septembre 2026")
  && d.querySelector("#tmm-info a").href.includes("bct.gov.tn") && d.querySelector("#tmm-info a").target === "_blank");
check("page crédit : TMM 7 % + marge 3 % = 965,022", texte(d.getElementById("grand")).includes("965,022"));
saisir(w, "assurance", "0.5");
check("page crédit : avec assurance 0,5 % -> 1 006,689", texte(d.getElementById("grand")).includes("1 006,689") && d.querySelectorAll("#barre span").length === 3);
cliquer(w, "unite", "mois"); saisir(w, "duree", "0");
check("page crédit : durée 0 -> 0,000 et message, pas de NaN", texte(d.getElementById("grand")).includes("0,000") && propre(w));
saisir(w, "duree", "-5"); saisir(w, "prix", "-100");
check("page crédit : valeurs négatives sans NaN", propre(w));
saisir(w, "prix", "999999999999"); saisir(w, "duree", "600");
check("page crédit : montant énorme sans NaN", propre(w));
check("page crédit : lien WhatsApp", d.getElementById("partage").href.startsWith("https://wa.me/?text="));

// --- auto-entrepreneur
w = await page("auto-entrepreneur/index.html"); d = w.document;
check("page auto : éligible par défaut (verdict vert)", d.getElementById("verdict").classList.contains("oui"));
check("page auto : 1 141,556 DT par an par défaut", texte(d.getElementById("grand")).includes("1 141,556"));
saisir(w, "ca", "80000");
check("page auto : 80 000 DT -> non éligible avec la raison du plafond", d.getElementById("verdict").classList.contains("non") && texte(d.getElementById("verdict")).includes("75 000,000"));
saisir(w, "ca", "30000"); saisir(w, "activite", "liberale");
check("page auto : profession libérale -> non éligible", d.getElementById("verdict").classList.contains("non"));
saisir(w, "activite", "agriculture");
check("page auto : agriculture -> à vérifier", d.getElementById("verdict").classList.contains("verifier"));
cliquer(w, "annee", "1");
check("page auto : 1re année -> 0,000 et montant suivant", texte(d.getElementById("grand")).includes("0,000") && texte(d.getElementById("resume")).includes("1 141,556"));
cliquer(w, "annee", "2"); cliquer(w, "zone", "autre"); cliquer(w, "regime", "artisan");
check("page auto : autre zone + artisan -> 404,800 et tranche cachée", texte(d.getElementById("grand")).includes("404,800") && d.getElementById("bloc-tranche").classList.contains("cache"));
saisir(w, "ca", "-1");
check("page auto : chiffre d'affaires négatif sans NaN", propre(w));
check("page auto : 10 tranches CNSS proposées", d.querySelectorAll("#tranche option").length === 10);

// --- retenue
w = await page("retenue-source/index.html"); d = w.document;
check("page retenue : exemple officiel par défaut -> retenue 178,500, net 5 771,500", texte(d.getElementById("grand")).includes("178,500") && texte(d.getElementById("resume")).includes("5 771,500"));
check("page retenue : rappel TEJ exact", texte(d.getElementById("tej")).includes("Depuis le 1er janvier 2026, le certificat de retenue à la source doit être établi sur la plateforme officielle TEJ (tej.finances.gov.tn)"));
check("page retenue : aucun bouton ni lien de certificat à télécharger", !/télécharger le certificat|générer le certificat/i.test(d.body.textContent) && !d.querySelector("a[download]"));
saisir(w, "operation", "achats"); cliquer(w, "sens", "ttc"); saisir(w, "montant", "800");
check("page retenue : achat 800 DT TTC -> 0,000 et « pas de retenue »", texte(d.getElementById("grand")).includes("0,000") && texte(d.getElementById("resume")).includes("pas de retenue"));
saisir(w, "operation", "dividendes");
check("page retenue : dividendes -> champs TVA cachés", d.getElementById("bloc-tva").classList.contains("cache"));
saisir(w, "operation", "non-resident"); cliquer(w, "sens", "net"); saisir(w, "tva", "19"); saisir(w, "rstva", "100"); saisir(w, "montant", "8215");
check("page retenue : net 8 215 non-résident -> retenue 3 685,000 (1 785 + 1 900)", texte(d.getElementById("grand")).includes("3 685,000"));
check("page retenue : tableau de tous les taux (18 opérations + TVA)", d.querySelectorAll("#taux-liste tbody tr").length === 19);
saisir(w, "montant", "-50");
check("page retenue : montant négatif sans NaN", propre(w));

// --- arabe
for (const p of PAGES) {
  w = await page(p, "ar"); d = w.document;
  check(`${p} en arabe : lang=ar, dir=rtl, bouton « Français »`, d.documentElement.lang === "ar" && d.documentElement.dir === "rtl" && d.querySelector(".langue").textContent === "Français");
  check(`${p} en arabe : montant isolé (ordre lisible)`, d.getElementById("grand").textContent.startsWith("⁦"));
  check(`${p} en arabe : textes calculés en arabe, pas de NaN`, /[؀-ۿ]/.test(d.getElementById("tableau").textContent) && propre(w));
  check(`${p} en arabe : chaque texte FR a sa traduction AR`, d.querySelectorAll('[data-l="fr"]').length === d.querySelectorAll('[data-l="ar"]').length);
}

// ================= 5. Règles communes : référencement, sources, sécurité =================
const vRef = lire("salaire-net/index.html").match(/style\.css\?v=(\w+)/)[1];
const DOMAINES_OK = ["ah6259.github.io", "gc.zgo.at", "fonts.googleapis.com", "fonts.gstatic.com", "schema.org", "wa.me",
  "www.bct.gov.tn", "jibaya.tn", "www.cnss.tn", "www.autoentrepreneur.tn", "tej.finances.gov.tn",
  "commons.wikimedia.org", "creativecommons.org"];   // + crédits des photos (Wikimedia Commons, licences)
// Noms des concurrents : JAMAIS dans ce dépôt public (règle d'Ahmed). Liste locale dans tools/.concurrents (ignoré par git),
// une expression par ligne séparée par « | ». Absente sur GitHub : cette vérification est alors sautée.
const fichierConc = [join(root, "tools", ".concurrents"), join(dirname(fileURLToPath(import.meta.url)), ".concurrents")].find(existsSync);
const CONCURRENTS = fichierConc ? new RegExp(readFileSync(fichierConc, "utf8").trim().split(/\r?\n/).filter(Boolean).join("|"), "i") : null;
if (!CONCURRENTS) console.log("SAUTÉ vérification des concurrents (tools/.concurrents absent, normal sur GitHub)");
const sansConcurrent = t => !CONCURRENTS || !CONCURRENTS.test(t);
for (const p of PAGES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical, aperçu, icône`, /<title>.+<\/title>/.test(s) && s.includes('name="description"') && s.includes('rel="canonical"') && s.includes("og-image-v5.jpg") && s.includes("logo.svg"));
  check(`${p} : CSP, noai, referrer`, s.includes("Content-Security-Policy") && s.includes("noai, noimageai") && s.includes('name="referrer"'));
  const faq = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ld = null; try { ld = JSON.parse(faq[1]); } catch (e) {}
  check(`${p} : FAQ Google (JSON-LD valide, 3 questions)`, ld && ld["@type"] === "FAQPage" && ld.mainEntity.length === 3);
  const versions = [...s.matchAll(/\?v=(\w+)/g)].map(m => m[1]);
  check(`${p} : tous les fichiers assets/ à la même version que salaire-net (${vRef})`, versions.length >= 5 && versions.every(v => v === vRef));
  check(`${p} : aucun script dans la page (CSP)`, !/<script(?![^>]*(src=|application\/ld\+json))[^>]*>/.test(s));
  const img = s.match(/<img src="([^"]+)"/);
  check(`${p} : vraie photo dans le bandeau (pas de dessin provisoire)`, !!img && /\.jpe?g$/.test(img[1]) && existsSync(join(root, dirname(p), img[1])));
  const externes = [...s.matchAll(/(?:href|src)="(https?:\/\/[^"\/]+)/g)].map(m => m[1].replace(/^https?:\/\//, ""));
  check(`${p} : liens externes uniquement vers des sources officielles (${[...new Set(externes)].filter(x => !DOMAINES_OK.includes(x)).join(", ") || "ok"})`, externes.every(x => DOMAINES_OK.includes(x)));
  if (CONCURRENTS) check(`${p} : aucun concurrent cité`, sansConcurrent(s));
  check(`${p} : section « Sources officielles » en FR et AR`, s.includes("Sources officielles") && s.includes("المصادر الرسمية"));
  check(`${p} : avertissement « pas un service officiel » / indicatif`, /indicatif/.test(s) && /تقريبية/.test(s));
  check(`${p} : liens externes ouverts dans une nouvelle fenêtre`, [...s.matchAll(/<a [^>]*href="https?:\/\/(?!ah6259)[^"]+"[^>]*>/g)].every(m => m[0].includes('target="_blank"') && m[0].includes("noopener")));
  w = await page(p); d = w.document;
  const pied = d.getElementById("pied")?.textContent || "";
  check(`${p} : en-tête, pied de page © et date « à jour au »`, !!d.querySelector("#entete .logo-mark") && pied.includes("©")
    && [...d.querySelectorAll("[data-maj]")].every(x => /\d{2}\/\d{2}\/\d{4}/.test(x.textContent)));
}
for (const f of ["assets/calcul-credit.js", "assets/calcul-auto.js", "assets/calcul-retenue.js", "assets/credit.js", "assets/auto-entrepreneur.js", "assets/retenue.js", "assets/nouveaux.css"])
  if (CONCURRENTS) check(`${f} : aucun concurrent cité`, sansConcurrent(lire(f)));

console.log(erreurs ? `\n${erreurs} PROBLÈME(S) sur ${total}` : `\nTOUT PASSE (${total} vérifications)`);
process.exit(erreurs ? 1 : 0);
