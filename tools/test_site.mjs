// Test automatique d'Outils pratiques Tunisie — à lancer après chaque modification :
//   node tools/test_site.mjs
// jsdom s'installe une fois par PC :  npm install --no-save --no-package-lock jsdom
import { JSDOM } from "jsdom";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
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
// Exemple publié (guide de paie 2026) : 2 500 DT brut, célibataire
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
// Références du simulateur de référence (relevées le 05/10/2026) : chaque ligne arrondie au millime
for (const [brut, famille, net] of [[2500, {}, 1849.310], [1500, {}, 1189.706], [1500, { chef: true, enfants: 2 }, 1200.332],
                                    [800, {}, 684.262], [5000, { chef: true, enfants: 3 }, 3348.256]])
  check(`simulateur de référence : ${brut} brut ${JSON.stringify(famille)} -> ${net}`, c.brutVersNet(brut, famille).net.toFixed(3) === net.toFixed(3));
check("net -> brut cohérent pour 900 DT", proche(c.brutVersNet(c.netVersBrut(900, {}).brut, {}).net, 900));
check("le net augmente avec le brut", [500, 1000, 2000, 4000, 8000].every((b, i, t) => !i || c.brutVersNet(b, {}).net > c.brutVersNet(t[i - 1], {}).net));
check("format tunisien : 1 849,310 DT", c.dt(1849.31).replace(/[⁦⁩  ]/g, "") === "1849,310DT");

// ---- 2. Pages (simulées sans navigateur) -------------------------------------
async function page(chemin, lang = "fr", modifier = js => js) {
  // comme un navigateur : chaque <script src> est remplacé par son contenu, puis tout s'exécute dans l'ordre
  // (modifier : permet de tester une variante d'un script, ex. URL_DOCUMENTS remplie)
  const dossier = dirname(join(root, chemin));
  const html = lire(chemin).replace(/<script([^>]*) src="([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
    (_, a, src) => `<script>${modifier(readFileSync(join(dossier, src), "utf8"), src)}</script>`);
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
check("salaire : barre de répartition en 4 parts", d.querySelectorAll("#barre span").length === 4);
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
const TOUTES = ["index.html", "salaire-net/index.html", "impot-revenu/index.html", "a-propos/index.html",
                "credit/index.html", "auto-entrepreneur/index.html", "retenue-source/index.html"];
const AVEC_PHOTO = TOUTES.filter(p => p !== "a-propos/index.html");
for (const p of TOUTES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.+<\/title>/.test(s) && s.includes('name="description"') && s.includes('rel="canonical"'));
  check(`${p} : image d'aperçu et icône`, s.includes("og-image-v3.png") && s.includes("logo.svg"));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  const w2 = await page(p);
  const pied = w2.document.getElementById("pied")?.textContent || "";
  check(`${p} : en-tête avec logo`, !!w2.document.querySelector("#entete .logo-mark"));
  check(`${p} : pied de page ©, non officiel, date de vérification`, pied.includes("©") && pied.includes("pas un service officiel") && /\d{2}\/\d{2}\/\d{4}/.test(pied));
  check(`${p} : date « à jour au » remplie`, [...w2.document.querySelectorAll("[data-maj]")].every(x => /\d{2}\/\d{2}\/\d{4}/.test(x.textContent)));
}
check("FAQ Google sur les 2 calculateurs", ["salaire-net/index.html", "impot-revenu/index.html"].every(p => lire(p).includes("FAQPage")));
check("image d'aperçu présente", existsSync(join(root, "assets/og-image-v3.png")));
const locs = [...lire("sitemap.xml").matchAll(/<loc>https:\/\/ah6259\.github\.io\/outils-pratiques-tunisie\/([^<]*)<\/loc>/g)].map(m => m[1]);
check("plan du site : 7 pages (accueil, 3 + 3 calculateurs, à propos)", (lire("sitemap.xml").match(/<loc>/g) || []).length === 7 && locs.length === 7);
check("plan du site : chaque adresse mène à une page existante", locs.every(l => existsSync(join(root, l, "index.html"))));
check("toutes les pages : même version ?v= partout (cache des téléphones)", new Set(TOUTES.flatMap(p => lire(p).match(/\?v=\w+/g) || [])).size === 1);

// chaque lien de l'accueil (cartes) et du pied de page (sur chaque page) mène à une page existante
const cible = (p, href) => { const u = new URL(href, `https://ah6259.github.io/outils-pratiques-tunisie/${p.replace("index.html", "")}`);
  if (u.host !== "ah6259.github.io") return null;
  const chemin = decodeURIComponent(u.pathname.replace("/outils-pratiques-tunisie/", ""));
  return join(root, chemin.endsWith("/") || chemin === "" ? join(chemin, "index.html") : chemin); };
w = await page("index.html"); d = w.document;
const cartes = [...d.querySelectorAll("main .outils a[href]")];
check("accueil : 5 calculateurs en vrais liens (salaire, impôt, crédit, auto-entrepreneur, retenue)",
  ["salaire-net/", "impot-revenu/", "credit/", "auto-entrepreneur/", "retenue-source/"].every(h => cartes.some(a => a.getAttribute("href") === h)));
// Documents Tunisie est en ligne depuis le 05/10/2026 : plus aucune carte « bientôt »
check("accueil : plus aucune carte « bientôt »", d.querySelectorAll(".outil.bientot").length === 0);
check("accueil : carte Documents = lien vers notre site Documents Tunisie", texte(d.getElementById("carte-documents")).includes("Sur notre site Documents Tunisie")
  && d.getElementById("carte-documents").tagName === "A");
for (const p of TOUTES) {
  const w2 = p === "index.html" ? w : await page(p);
  const liens = [...w2.document.querySelectorAll(p === "index.html" ? "main a[href], #pied a[href], #entete a[href]" : "#pied a[href], #entete a[href], .fil a[href]")]
    .map(a => a.getAttribute("href")).filter(h => !/^(https?:|mailto:|#)/.test(h));
  const casses = liens.filter(h => { const f = cible(p, h); return !f || !existsSync(f.split("#")[0]); });
  check(`${p} : ${liens.length} liens internes (accueil, pied, en-tête) vers des pages existantes${casses.length ? " — cassés : " + casses.join(", ") : ""}`, liens.length >= 7 && casses.length === 0);
}
check("pied de page : liens vers les 5 calculateurs et À propos", ["salaire-net/", "impot-revenu/", "credit/", "auto-entrepreneur/", "retenue-source/", "a-propos/"]
  .every(h => [...w.document.querySelectorAll("#pied nav a")].some(a => a.getAttribute("href") === h)));
// URL_DOCUMENTS (assets/page.js) : remplie depuis la mise en ligne de Documents Tunisie (05/10/2026)
check("URL_DOCUMENTS : constante unique dans page.js, adresse du site Documents Tunisie", (pageJsSrc => (pageJsSrc.match(/^const URL_DOCUMENTS = /gm) || []).length === 1
  && /^const URL_DOCUMENTS = "https:\/\/ah6259\.github\.io\/documents-tunisie\/";/m.test(pageJsSrc))(lire("assets/page.js")));
const wDoc = w;
const carteDoc = wDoc.document.getElementById("carte-documents");
check("URL_DOCUMENTS remplie : la carte devient un lien (nouvel onglet), sans badge « bientôt »", carteDoc.tagName === "A"
  && carteDoc.href === "https://ah6259.github.io/documents-tunisie/" && carteDoc.target === "_blank" && carteDoc.rel.includes("noopener")
  && !carteDoc.querySelector(".badge") && !carteDoc.classList.contains("bientot"));
check("robots.txt indique le plan du site", lire("robots.txt").includes("sitemap.xml"));
check("LICENSE tous droits réservés", lire("LICENSE").includes("Tous droits réservés"));


// une seule année partout : celle de ANNEE (assets/page.js), mise à jour par le robot en janvier
const ANNEE = lire("assets/page.js").match(/const ANNEE = (\d{4})/)[1];
const anneesIsolees = f => [...lire(f).matchAll(/(?<![\d\/\-])(202\d)(?![\d\/\-])/g)].map(m => m[1])
  .filter(a => a !== "2024" && a !== "2025");   // 2024-2025 = numéro et année de la loi de finances
check(`toutes les pages affichent l'année ${ANNEE}`,
  ["index.html", "salaire-net/index.html", "impot-revenu/index.html", "a-propos/index.html"].every(f => anneesIsolees(f).every(a => a === ANNEE)));


// une VRAIE PHOTO libre de droits dans le bandeau de chaque calculateur (règle commune) :
// fichier présent, crédit + licence affichés sous la photo, crédit dans « À propos », preuve de licence sauvegardée
const LICENCE = /CC BY-SA \d\.\d|CC BY \d\.\d|CC0|domaine public/;
const aPropos = lire("a-propos/index.html");
// preuves hors du dépôt (dossier parent) : vérifiées sur le PC d'Ahmed, absentes sur GitHub
const dossierPreuves = join(root, "..", "preuves conditions d'utilisation");
const lisezMoi = existsSync(dossierPreuves) ? readdirSync(dossierPreuves).map(d => join(dossierPreuves, d, "photos", "LISEZ-MOI.md"))
  .filter(existsSync).map(f => readFileSync(f, "utf8")).join("\n") : null;
for (const p of AVEC_PHOTO) {
  const d2 = new JSDOM(lire(p)).window.document;
  const fig = d2.querySelector("figure.illus");
  const img = fig?.querySelector("img");
  const src = img?.getAttribute("src") || "";
  const cap = fig?.querySelector("figcaption")?.textContent || "";
  const fichierPhoto = join(root, dirname(p), src);
  check(`${p} : photo du bandeau présente (${src})`, !!img && /\.(jpe?g|webp)$/.test(src) && existsSync(fichierPhoto));
  check(`${p} : photo légère (≤ 150 Ko)`, !!img && existsSync(fichierPhoto) && statSync(fichierPhoto).size <= 150_000);
  check(`${p} : crédit et licence affichés sous la photo`, /Photo/.test(cap) && LICENCE.test(cap) && cap.includes("Wikimedia Commons")
        && !!fig.querySelector('a[rel~="license"]'));
  const fichier = src.split("/").pop();
  check(`${p} : crédit de ${fichier} dans « À propos »`, !!fichier && new RegExp(`data-photo="${fichier}"[^]*?(${LICENCE.source})`).test(aPropos));
  const source = fig?.dataset.source || "";
  if (lisezMoi === null) console.log(`SAUTÉ preuve de licence de ${fichier} (dossier des preuves absent, normal sur GitHub)`);
  else check(`${p} : preuve de licence sauvegardée pour ${fichier}`, !!source && lisezMoi.includes(source));
}
check("plus aucun dessin SVG dans les bandeaux", !AVEC_PHOTO.some(p => /illus-[\w-]+\.svg/.test(lire(p))));
check("dessins provisoires supprimés (illus-credit, illus-auto, illus-retenue)", ["credit", "auto", "retenue"].every(n => !existsSync(join(root, `assets/illus-${n}.svg`))));

// ---- 4. Sécurité, robots d'IA et anti-copie (consigne d'Ahmed du 05/10/2026) ------------------------
const robots = lire("robots.txt");
const blocs = robots.split(/\n\s*\n/).filter(b => /User-agent/i.test(b));
const regle = ua => { const b = blocs.find(b => new RegExp(`^User-agent: ${ua}\\s*$`, "mi").test(b));
  return b ? (/^Disallow: \/\s*$/m.test(b) ? "interdit" : "permis") : "absent"; };
for (const ua of ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended",
  "Applebot-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Meta-ExternalAgent", "FacebookBot", "Diffbot", "Omgilibot",
  "cohere-ai", "ImagesiftBot", "HTTrack", "WebCopier", "WebZIP", "Offline Explorer", "wget", "SiteSnagger"])
  check(`robots.txt interdit ${ua}`, regle(ua) === "interdit");
check("robots.txt laisse passer Googlebot, Bingbot et les autres", regle("Googlebot") === "permis" && regle("Bingbot") === "permis" && regle("\\*") === "permis");
const pageJs = lire("assets/page.js"), css = lire("assets/style.css");
for (const p of TOUTES) {
  const s = lire(p);
  check(`${p} : meta noai, noimageai`, /<meta name="robots" content="noai, noimageai">/.test(s));
  check(`${p} : CSP stricte (scripts du site seulement)`, /http-equiv="Content-Security-Policy" content="[^"]*script-src 'self';/.test(s)
        && !/script-src[^;]*unsafe/.test(s));
  check(`${p} : aucun script dans la page (sinon bloqué par la CSP)`, (s.match(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/g) || []).length === 0);
  check(`${p} : referrer strict-origin-when-cross-origin`, s.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'));
  check(`${p} : script anti-copie chargé (page.js)`, /<script src="(\.\.\/)?assets\/page\.js\?v=/.test(s));
  check(`${p} : liens externes en rel="noopener"`, [...s.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)].every(m => /rel="[^"]*noopener/.test(m[0])));
}
check("anti-copie : clic droit et glisser bloqués sur les images", pageJs.includes('"contextmenu"') && pageJs.includes('"dragstart"') && /img\{[^}]*-webkit-touch-callout:none/.test(css));
check("anti-copie : source ajoutée au texte copié", pageJs.includes('"copy"') && pageJs.includes("© tous droits réservés"));
check("anti-copie : anti-iframe d'un autre site", pageJs.includes("window.top === window.self"));
for (const p of AVEC_PHOTO.filter(p => p !== "index.html"))
  check(`${p} : le montant calculé (#grand) est dans une zone copiable (.resultat)`, !!new JSDOM(lire(p)).window.document.querySelector(".resultat #grand"));
check("montants calculés, champs et liens restent copiables", /\.resultat,\.resultat \*,input,select,textarea,a\{user-select:text/.test(css)
      && pageJs.includes('".resultat, input, select, textarea, a"'));
// le calculateur reste utilisable avec la protection
w = await page("salaire-net/index.html"); d = w.document;
d.getElementById("montant").value = "800"; d.getElementById("montant").dispatchEvent(new w.Event("input"));
check("formulaire utilisable avec la protection : 800 -> 684,262", texte(d.getElementById("grand")).includes("684,262"));
// aucun secret dans les fichiers suivis par git
const suivis = execSync("git ls-files", { cwd: root, encoding: "utf8" }).split("\n").filter(f => /\.(html|js|mjs|py|yml|md|txt|json|css)$/.test(f));
const fuite = suivis.filter(f => /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{12,}|ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_\-]{30,}|\b\d{8,10}:[A-Za-z0-9_\-]{30,}|[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.[a-z]+/i.test(lire(f)));
check(`aucun secret ni e-mail privé dans le dépôt${fuite.length ? " : " + fuite.join(", ") : ""}`, fuite.length === 0);

// pas de traduction automatique du navigateur (pages bilingues : Chrome se trompait de langue et traduisait en anglais)
for (const p of ["index.html","salaire-net/index.html","impot-revenu/index.html","a-propos/index.html","credit/index.html","auto-entrepreneur/index.html","retenue-source/index.html"])
  check(`${p} : traduction automatique désactivée (notranslate)`, lire(p).includes('content="notranslate"') && /<html[^>]*translate="no"/.test(lire(p)));

console.log(erreurs ? `\n${erreurs} PROBLÈME(S)` : "\nTOUT PASSE");
process.exit(erreurs ? 1 : 0);
