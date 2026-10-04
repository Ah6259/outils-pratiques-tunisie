// Test automatique d'Outils pratiques Tunisie — à lancer après chaque modification :
//   node tools/test_site.mjs
// jsdom s'installe une fois par PC :  npm install --no-save --no-package-lock jsdom
import { JSDOM } from "jsdom";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = f => readFileSync(join(root, f), "utf8");
let erreurs = 0;
const check = (desc, cond) => { console.log((cond ? "OK   " : "FAIL ") + desc); if (!cond) erreurs++; };
const proche = (a, b) => Math.abs(a - b) < 0.0015;   // au millime près

// ---- 1. Calculs comparés à des résultats de référence -----------------------
const c = createRequire(import.meta.url)(join(root, "assets/calcul.js"));
// Référence publiée (SmartPaie, « Calcul du salaire net en Tunisie 2026 ») : 2 500 DT brut, célibataire
let r = c.brutVersNet(2500, {});
check("2 500 brut : CNSS 242,000", proche(r.cnss, 242));
check("2 500 brut : IRPP 398,233 / mois", proche(r.irpp, 398.233));
check("2 500 brut : CSS 10,457 / mois", proche(r.css, 10.457));
check("2 500 brut : net 1 849,310 (référence publiée)", proche(r.net, 1849.31));
// Barème calculé à la main
check("IRPP 5 000 DT/an = 0", c.irppAnnuel(5000).total === 0);
check("IRPP 10 000 DT/an = 750", proche(c.irppAnnuel(10000).total, 750));
check("IRPP 20 000 DT/an = 3 250", proche(c.irppAnnuel(20000).total, 3250));
check("IRPP 100 000 DT/an = 32 750", proche(c.irppAnnuel(100000).total, 32750));
check("IRPP de 0 et d'un revenu négatif = 0", c.irppAnnuel(0).total === 0 && c.irppAnnuel(-50).total === 0);
check("8 tranches dans le barème", c.REGLES.bareme.length === 8);
check("CSS nulle sous 5 000 DT", c.cssAnnuelle(4999) === 0 && proche(c.cssAnnuelle(20000), 100));
// Plafond des frais professionnels : 2 000 DT/an
check("frais professionnels plafonnés à 2 000", c.imposableAnnuel(100000, {}).fraisPro === 2000);
check("frais professionnels à 10 % sous le plafond", proche(c.imposableAnnuel(15000, {}).fraisPro, 1500));
// Famille : chef 300 + 100 par enfant, 4 enfants au maximum
check("déductions : chef + 2 enfants = 500", c.imposableAnnuel(20000, { chef: true, enfants: 2 }).deductions === 500);
check("déductions : 6 enfants comptés comme 4", c.imposableAnnuel(20000, { chef: true, enfants: 6 }).deductions === 700);
check("la famille augmente le net", c.brutVersNet(1500, { chef: true, enfants: 2 }).net > c.brutVersNet(1500, {}).net);
// Calcul inverse net -> brut
check("net 1 849,310 -> brut 2 500 (montant rond)", c.netVersBrut(1849.31, {}).brut === 2500);
// Références du simulateur de paie-tunisie.com (relevées le 05/10/2026) : chaque ligne arrondie au millime
for (const [brut, famille, net] of [[2500, {}, 1849.310], [1500, {}, 1189.706], [1500, { chef: true, enfants: 2 }, 1200.332],
                                    [800, {}, 684.262], [5000, { chef: true, enfants: 3 }, 3348.256]])
  check(`paie-tunisie.com : ${brut} brut ${JSON.stringify(famille)} -> ${net}`, c.brutVersNet(brut, famille).net.toFixed(3) === net.toFixed(3));
check("net -> brut cohérent pour 900 DT", proche(c.brutVersNet(c.netVersBrut(900, {}).brut, {}).net, 900));
check("le net augmente avec le brut", [500, 1000, 2000, 4000, 8000].every((b, i, t) => !i || c.brutVersNet(b, {}).net > c.brutVersNet(t[i - 1], {}).net));
check("format tunisien : 1 849,310 DT", c.dt(1849.31).replace(/[⁦⁩  ]/g, "") === "1849,310DT");

// ---- 2. Pages (simulées sans navigateur) -------------------------------------
async function page(chemin, lang = "fr") {
  // comme un navigateur : chaque <script src> est remplacé par son contenu, puis tout s'exécute dans l'ordre
  const dossier = dirname(join(root, chemin));
  const html = lire(chemin).replace(/<script([^>]*) src="([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
    (_, a, src) => `<script>${readFileSync(join(dossier, src), "utf8")}</script>`);
  const dom = new JSDOM(html, { url: `https://ah6259.github.io/outils-pratiques-tunisie/${chemin.replace("index.html", "")}?lang=${lang}`,
                               runScripts: "dangerously", pretendToBeVisual: true });
  await new Promise(ok => dom.window.addEventListener("load", ok));
  return dom.window;
}
const texte = el => el.textContent.replace(/[⁦⁩  ]/g, " ").replace(/\s+/g, " ");

let w = await page("salaire-net/index.html");
let d = w.document;
check("salaire : résultat affiché au chargement (1 500 DT -> 1 189,706)", texte(d.getElementById("grand")).includes("1 189,706"));
check("salaire : tableau CNSS / impôt / CSS / net", d.querySelectorAll("#tableau tr").length === 5);
d.getElementById("montant").value = "2500";
d.getElementById("montant").dispatchEvent(new w.Event("input"));
check("salaire : 2 500 -> 1 849,310 à l'écran", texte(d.getElementById("grand")).includes("1 849,310"));
d.getElementById("chef").checked = true; d.getElementById("chef").dispatchEvent(new w.Event("input"));
check("salaire : cocher chef de famille change le net", !texte(d.getElementById("grand")).includes("1 849,310"));
d.getElementById("chef").checked = false; d.getElementById("chef").dispatchEvent(new w.Event("input"));
d.querySelector('.choix[data-nom="sens"] button[data-v="net"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
d.getElementById("montant").value = "1849.31"; d.getElementById("montant").dispatchEvent(new w.Event("input"));
check("salaire : mode « je connais le net » -> brut 2 500", texte(d.getElementById("grand")).includes("2 500,000"));
check("salaire : détail des tranches", d.querySelectorAll("#detail tr").length >= 8);
check("salaire : lien WhatsApp", d.getElementById("partage").href.startsWith("https://wa.me/?text="));
check("salaire : français par défaut", d.documentElement.lang === "fr" && d.documentElement.dir === "ltr");

w = await page("salaire-net/index.html", "ar");
d = w.document;
check("salaire en arabe : lang=ar et dir=rtl", d.documentElement.lang === "ar" && d.documentElement.dir === "rtl");
check("salaire en arabe : titre du résultat en arabe", /[؀-ۿ]/.test(d.getElementById("titre-res").textContent));
check("salaire en arabe : montants isolés (ordre lisible)", d.getElementById("grand").textContent.startsWith("⁦"));
check("salaire en arabe : bouton « Français »", d.querySelector(".langue").textContent === "Français");

w = await page("impot-revenu/index.html");
d = w.document;
check("impôt : 20 000 DT -> 3 250,000", texte(d.getElementById("grand")).includes("3 250,000"));
check("impôt : 3 tranches + total", d.querySelectorAll("#tableau tr").length === 4);
d.getElementById("revenu").value = "0"; d.getElementById("revenu").dispatchEvent(new w.Event("input"));
check("impôt : revenu 0 -> 0,000", texte(d.getElementById("grand")).includes("0,000"));

// ---- 3. Règles communes : référencement, aperçu, licence, cache ----------------
for (const p of ["index.html", "salaire-net/index.html", "impot-revenu/index.html"]) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.+<\/title>/.test(s) && s.includes('name="description"') && s.includes('rel="canonical"'));
  check(`${p} : image d'aperçu`, s.includes("og-image-v1.png"));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  check(`${p} : mention © et site non officiel`, s.includes("©") && (s.includes("non officiel") || s.includes("pas un service officiel")));
}
check("FAQ Google sur les 2 calculateurs", ["salaire-net/index.html", "impot-revenu/index.html"].every(p => lire(p).includes("FAQPage")));
check("image d'aperçu présente", existsSync(join(root, "assets/og-image-v1.png")));
check("plan du site : 3 pages", (lire("sitemap.xml").match(/<loc>/g) || []).length === 3);
check("robots.txt indique le plan du site", lire("robots.txt").includes("sitemap.xml"));
check("LICENSE tous droits réservés", lire("LICENSE").includes("Tous droits réservés"));

console.log(erreurs ? `\n${erreurs} PROBLÈME(S)` : "\nTOUT PASSE");
process.exit(erreurs ? 1 : 0);
