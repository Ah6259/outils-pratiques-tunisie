// Test automatique d'Outils pratiques Tunisie — à lancer après chaque modification :
//   node tools/test_site.mjs
// jsdom s'installe une fois par PC :  npm install --no-save --no-package-lock jsdom
import { JSDOM, VirtualConsole } from "jsdom";
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
  const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
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
                "credit/index.html", "auto-entrepreneur/index.html", "retenue-source/index.html",
                "pass/index.html", "pass/conditions/index.html"];
const AVEC_PHOTO = TOUTES.filter(p => p !== "a-propos/index.html" && !p.startsWith("pass/"));
for (const p of TOUTES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.+<\/title>/.test(s) && s.includes('name="description"') && s.includes('rel="canonical"'));
  check(`${p} : image d'aperçu et icône`, s.includes("og-image-v6.jpg") && s.includes("logo.svg"));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  const w2 = await page(p);
  const pied = w2.document.getElementById("pied")?.textContent || "";
  check(`${p} : en-tête avec logo`, !!w2.document.querySelector("#entete .logo-mark"));
  check(`${p} : pied de page ©, non officiel, date de vérification`, pied.includes("©") && pied.includes("pas un service officiel") && /\d{2}\/\d{2}\/\d{4}/.test(pied));
  check(`${p} : date « à jour au » remplie`, [...w2.document.querySelectorAll("[data-maj]")].every(x => /\d{2}\/\d{2}\/\d{4}/.test(x.textContent)));
}
check("FAQ Google sur les 2 calculateurs", ["salaire-net/index.html", "impot-revenu/index.html"].every(p => lire(p).includes("FAQPage")));
check("image d'aperçu présente", existsSync(join(root, "assets/og-image-v6.jpg")));
// manifeste : id UNIQUE = chemin du site (sinon Chrome croit le site « déjà installé » : tous les sites partagent ah6259.github.io)
let man = {}; try { man = JSON.parse(lire("manifest.webmanifest")); } catch (e) {}
check("manifeste présent, id unique = chemin du site, start_url/scope ./, icônes 192, 512 et maskable existantes",
  man.id === "/outils-pratiques-tunisie/" && man.start_url === "./" && man.scope === "./" && man.display === "standalone" && !!man.name && !!man.short_name
  && ["192x192", "512x512"].every(t => man.icons?.some(i => i.sizes === t)) && man.icons?.some(i => i.purpose === "maskable")
  && man.icons.every(i => existsSync(join(root, i.src))) && existsSync(join(root, "assets/icons/apple-touch-icon.png")));
check("toutes les pages : lien vers le manifeste, icône iPhone et theme-color", TOUTES.every(p => { const s = lire(p), r = "../".repeat(p.split("/").length - 1);
  return s.includes(`<link rel="manifest" href="${r}manifest.webmanifest">`) && s.includes(`<link rel="apple-touch-icon" href="${r}assets/icons/apple-touch-icon.png">`) && s.includes('<meta name="theme-color"'); }));
check("image d'aperçu JPEG < 250 Ko (sinon WhatsApp n'affiche qu'une petite vignette)", existsSync(join(root, "assets/og-image-v6.jpg")) && statSync(join(root, "assets/og-image-v6.jpg")).size < 250000 && TOUTES.every(p => lire(p).includes('<meta property="og:image:type" content="image/jpeg">')));
const locs = [...lire("sitemap.xml").matchAll(/<loc>https:\/\/ah6259\.github\.io\/outils-pratiques-tunisie\/([^<]*)<\/loc>/g)].map(m => m[1]);
check("plan du site : au moins 9 pages (accueil, 5 calculateurs, à propos, Pass Journée, page vidéo)", (lire("sitemap.xml").match(/<loc>/g) || []).length === locs.length && locs.length >= 9 && locs.includes("pass/") && locs.includes("video/"));
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
  check(`${p} : CSP stricte (scripts du site + GoatCounter seulement)`, /http-equiv="Content-Security-Policy" content="[^"]*script-src 'self' https:\/\/gc\.zgo\.at;/.test(s)
        && !/script-src[^;]*unsafe/.test(s));
  check(`${p} : statistiques GoatCounter (sans cookies) chargées, CSP compatible`,
        s.includes('<script data-goatcounter="https://prix-eaux-tunisie.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>')
        && /connect-src[^;]*https:\/\/prix-eaux-tunisie\.goatcounter\.com/.test(s) && /img-src[^;]*https:\/\/prix-eaux-tunisie\.goatcounter\.com/.test(s));
  check(`${p} : aucun script dans la page (sinon bloqué par la CSP)`, (s.match(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/g) || []).length === 0);
  check(`${p} : referrer strict-origin-when-cross-origin`, s.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'));
  check(`${p} : script anti-copie chargé (page.js)`, /<script src="(\.\.\/)*assets\/page\.js\?v=/.test(s));
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

// ---- Lien discret vers l'annuaire gratuit des comptables, sous chaque résultat (05/10/2026) ----------
// caché dans la page (hidden : rien avant le calcul, rien sans JavaScript), affiché par le calcul, clic compté dans GoatCounter
const COMPTABLES = "https://ah6259.github.io/comptables-tunisie/";
for (const [calc, champ, mot] of [["salaire-net", "montant", "fiches de paie"], ["impot-revenu", "revenu", "conseiller fiscal"],
    ["credit", "prix", "expert-comptable"], ["auto-entrepreneur", null, "s'inscrire et déclarer"], ["retenue-source", "montant", "expert-comptable"]]) {
  const p = `${calc}/index.html`;
  const brut = new JSDOM(lire(p)).window.document.getElementById("lien-pro");
  check(`${p} : cadre vers l'annuaire des comptables présent dans la zone résultat, caché avant le calcul`,
        !!brut && !!brut.closest(".resultat") && brut.hidden === true);
  for (const lang of ["fr", "ar"]) {
    w = await page(p, lang); d = w.document;
    const b = d.getElementById("lien-pro"), a = b?.querySelector("a");
    check(`${p} (${lang}) : cadre affiché après le calcul, lien vers l'annuaire (nouvel onglet, noopener)`, !!a && !b.hidden
          && a.href === COMPTABLES && a.target === "_blank" && a.rel.includes("noopener") && a.dataset.compteur === `lien-comptables/${calc}`);
    const fr = a?.querySelector('[data-l="fr"]')?.textContent || "", ar = a?.querySelector('[data-l="ar"]')?.textContent || "";
    check(`${p} (${lang}) : texte français et arabe, sobre (jamais « meilleur »)`, fr.includes(mot) && fr.includes("près de chez vous")
          && /[؀-ۿ]/.test(ar) && ar.includes("قريب منك") && !/meilleur|أفضل/i.test(fr + ar));
  }
  if (champ) {
    d.getElementById(champ).value = "0"; d.getElementById(champ).dispatchEvent(new w.Event("input"));
    check(`${p} : sans résultat (montant 0), le cadre est caché`, d.getElementById("lien-pro").hidden === true);
    d.getElementById(champ).value = champ === "revenu" ? "20000" : "50000"; d.getElementById(champ).dispatchEvent(new w.Event("input"));
    check(`${p} : nouveau résultat, le cadre revient`, d.getElementById("lien-pro").hidden === false);
  }
  const comptes = [];
  w.goatcounter = { count: o => comptes.push(o) };
  w.addEventListener("click", e => e.preventDefault());   // pas de vraie navigation dans le test
  d.querySelector("#lien-pro a span").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  check(`${p} : clic compté dans GoatCounter (événement lien-comptables/${calc})`, comptes.length === 1
        && comptes[0].path === `lien-comptables/${calc}` && comptes[0].event === true);
  delete w.goatcounter;
  let plante = false;
  try { d.querySelector("#lien-pro a").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); } catch (e) { plante = true; }
  check(`${p} : sans GoatCounter (bloqué), le clic ne plante pas`, !plante);
}
check("lien vers l'annuaire : aucun nouveau domaine dans la CSP", !TOUTES.some(p => /Content-Security-Policy[^>]*comptables-tunisie/.test(lire(p))));

// ---- Affichage : éléments cachés et faux boutons (06/10/2026) ----
check("style : [hidden]{display:none!important} (l'encart des comptables et tout élément caché par le JS restent cachés malgré un display:flex/grid)",
      /\[hidden\]\{display:none!important\}/.test(lire("assets/style.css").replace(/\s+/g, "")));
// Tuiles « icône + petit texte » qui ont l'air de boutons mais ne mènent nulle part (supprimées le 06/10/2026, demande d'Ahmed)
// (une étiquette en gras dans un encadré qui donne une vraie information, ex. « Coût : 50 DT », n'est pas une tuile)
const tuilesSansLien = doc => [...doc.body.querySelectorAll("*")].filter(el => {
  if (/^(a|button|label|summary|svg|h[1-6]|b|strong|em|small|i|option|select|input|textarea|form|header|footer|nav|main|figure|img|section|article)$/i.test(el.tagName)) return false;
  if (el.closest("a,button,label,summary,header,footer,nav,form,svg,[hidden],template")) return false;
  const f = el.firstElementChild;
  if (!f || f.tagName.toLowerCase() !== "svg" || el.querySelector("a,button,input,select,textarea")) return false;
  const t = el.textContent.replace(/\s+/g, " ").trim();
  return t.length > 0 && t.length < 90;
}).map(el => el.textContent.replace(/\s+/g, " ").trim().slice(0, 40));
for (const p of TOUTES) {
  const morts = tuilesSansLien(new JSDOM(lire(p)).window.document);
  check(`${p} : aucune carte avec une icône sans lien (pas de faux bouton)${morts.length ? " → " + morts.join(" | ") : ""}`, !morts.length);
}
check("accueil : « 1 calcul gratuit par jour, sans inscription » dans l'intro (FR + AR), sans badge", /1 calcul gratuit par jour, sans inscription/.test(lire("index.html")) && /حساب مجاني كل يوم، دون تسجيل/.test(lire("index.html")) && !/badge-c|class="paie-confiance"/.test(lire("index.html")));
await passJournee();
await boutonComptables();
await boutonPartager();

// ---- Pass Journée (partie payante, 06/10/2026, accord écrit d'Ahmed) -----------------------------------------
// exemple gratuit, 1 calcul personnel gratuit par jour (tous calculateurs), 2e bloqué, lendemain, code valide / expiré / faux,
// page pass/ (prix, paiement, formulaire), conditions, bouton doré seulement sur les calculateurs et les pages du Pass.
async function passJournee() {
  const { webcrypto, pbkdf2Sync } = await import("crypto");
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const t = el => el ? el.textContent.replace(/[⁦-⁩  ]/g, " ").replace(/\s+/g, " ").trim() : "";
  const CALCS = { "salaire-net": "montant", "impot-revenu": "revenu", "credit": "prix", "auto-entrepreneur": "ca", "retenue-source": "montant" };
  const JOUR = (d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
  const AUJ = JOUR(new Date()), HIER = JOUR(new Date(Date.now() - 86400000 * 1.5));
  const futur = new Date(Date.now() + 20 * 3600000).toISOString(), passe = new Date(Date.now() - 3600000).toISOString();
  // fenêtre comme un navigateur ; avant = réglages du stockage avant le chargement (calcul gratuit déjà utilisé, code gardé…)
  async function ouvrir(chemin, { lang = "fr", avant = null } = {}) {
    const dossier = dirname(join(root, chemin));
    const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
      (_, a, src) => `<script>${readFileSync(join(dossier, src), "utf8")}</script>`);
    const fautes = [], vc = new VirtualConsole();
    vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) fautes.push(e.message); });
    const dom = new JSDOM(html, { url: `https://ah6259.github.io/outils-pratiques-tunisie/${chemin.replace("index.html", "")}?lang=${lang}`,
      runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) { if (avant) avant(w); } });
    await new Promise(ok => dom.window.addEventListener("load", ok));
    dom.window.fautes = fautes;
    return dom.window;
  }
  const saisir = (w, id, v) => { const e = w.document.getElementById(id); e.value = v; e.dispatchEvent(new w.Event("input")); e.dispatchEvent(new w.Event("change")); };
  const bloque = w => w.document.body.hasAttribute("data-verrou") && !!w.document.getElementById("pass-bloque") && !w.document.getElementById("pass-bloque").hidden;
  const gratuitUtilise = (calc, debut = Date.now() - 3600000, jour = AUJ) => w => w.localStorage.setItem("opt-calcul-gratuit-v1", JSON.stringify({ jour, calc, debut }));

  // -- dépôt public : aucune donnée personnelle
  let pj = {}; try { pj = JSON.parse(lire("donnees/pass.json")); } catch (e) {}
  check("donnees/pass.json : seulement sel, tours, date et liste {empreinte, heure de fin} (aucun nom, aucun téléphone)",
    Object.keys(pj).every(k => ["_lisez_moi", "maj", "sel", "tours", "codes"].includes(k)) && typeof pj.sel === "string" && pj.sel.length >= 16 &&
    pj.tours >= 100000 && Array.isArray(pj.codes) && pj.codes.every(c => Object.keys(c).join() === "h,fin" && /^[0-9a-f]{64}$/.test(c.h) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(c.fin)) &&
    !/\b[2-9]\d{7}\b|nom|telephone|téléphone/i.test(JSON.stringify(pj.codes)));
  check("dépôt public : aucun fichier de clients (clients.json) ni dossier « pass (prive) »",
    !["clients.json", "donnees/clients.json", "pass (prive)"].some(f => existsSync(join(root, f))));

  // -- 1. l'exemple à l'ouverture : toujours visible et gratuit, même si le calcul gratuit du jour est déjà utilisé
  for (const [calc, champ] of Object.entries(CALCS)) {
    let w = await ouvrir(`${calc}/index.html`, { avant: gratuitUtilise("autre") }), d = w.document;
    check(`${calc} : aucune erreur JavaScript`, w.fautes.length === 0);
    check(`${calc} : EXEMPLE affiché à l'ouverture, gratuit même après le calcul gratuit du jour (note « Exemple », bouton Pass près du résultat)`,
      !bloque(w) && /\d/.test(t(d.getElementById("grand"))) && t(d.getElementById("pass-note")).includes("Exemple") &&
      d.querySelector("#pass-note a.btn-pass-petit")?.getAttribute("href") === "../pass/" && !!d.querySelector(".resultat #pass-note"));
    // 2e calcul personnel du même jour (le gratuit a servi sur un autre calculateur) : bloqué
    const comptes = []; w.goatcounter = { count: o => comptes.push(o) };
    saisir(w, champ, "12345");
    const b = d.getElementById("pass-bloque");
    check(`${calc} : 2e calcul personnel du jour -> résultat masqué, « Vous avez utilisé votre calcul gratuit du jour »`, bloque(w) &&
      t(b).includes("Vous avez utilisé votre calcul gratuit du jour") && !!b.closest(".resultat"));
    check(`${calc} : écran bloqué -> Pass Journée 7 DT (24 heures) vers pass/, « Revenez demain », « J'ai déjà un code »`,
      !!b && b.querySelector("a.btn-pass-grand")?.getAttribute("href") === "../pass/" && /7 DT/.test(t(b)) && t(b).includes("24 heures") &&
      t(b).includes("revenez demain : un nouveau calcul gratuit vous attend") && b.querySelector('a[href="../pass/#code-acces"]') && t(b).includes("J'ai déjà un code"));
    check(`${calc} : écran bloqué compté anonymement (GoatCounter « pass-bloque/${calc} », une fois)`, comptes.length === 1 && comptes[0].path === `pass-bloque/${calc}` && comptes[0].event === true);
    saisir(w, champ, "23456");
    check(`${calc} : toujours bloqué, compté une seule fois par page`, bloque(w) && comptes.length === 1);
    d.getElementById("revoir-exemple")?.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    check(`${calc} : « Revoir l'exemple » -> chiffres d'origine, résultat de l'exemple de nouveau visible`, !bloque(w) && t(d.getElementById("pass-note")).includes("Exemple"));
  }
  const css = lire("assets/style.css").replace(/\s+/g, "");
  check("style : résultat masqué quand c'est bloqué (body[data-verrou] .resultat > :not(.pass-bloque), [data-resultat])",
    css.includes("body[data-verrou].resultat>:not(.pass-bloque){display:none!important}") && css.includes("body[data-verrou][data-resultat]{display:none!important}"));
  check("détail de l'impôt (salaire), tableau d'amortissement (crédit), verdict (auto-entrepreneur) masqués eux aussi (data-resultat)",
    /<section class="carte" data-resultat>\s*<details>\s*<summary><span data-l="fr">Détail du calcul/.test(lire("salaire-net/index.html")) &&
    /<section class="carte" data-resultat>\s*<details>\s*<summary><span data-l="fr">Tableau d'amortissement/.test(lire("credit/index.html")) &&
    lire("auto-entrepreneur/index.html").includes('id="verdict" data-resultat'));

  // -- 2. 1er calcul personnel du jour : autorisé (résultat + encart des comptables), corrections pendant 10 minutes
  let w = await ouvrir("salaire-net/index.html"), d = w.document;
  saisir(w, "montant", "2500");
  check("1er calcul personnel du jour : autorisé, résultat affiché (2 500 -> 1 849,310) avec l'encart vers les comptables",
    !bloque(w) && t(d.getElementById("grand")).includes("1 849,310") && !d.getElementById("lien-pro").hidden);
  const g = JSON.parse(w.localStorage.getItem("opt-calcul-gratuit-v1") || "{}");
  check("calcul gratuit noté sur l'appareil : jour, calculateur, heure", g.jour === AUJ && g.calc === "salaire-net" && g.debut > 0);
  check("calcul gratuit : note « vous pouvez corriger vos chiffres pendant 10 minutes »", t(d.getElementById("pass-note")).includes("corriger vos chiffres pendant 10 minutes"));
  saisir(w, "montant", "800");
  check("calcul gratuit : correction des chiffres dans les 10 minutes -> toujours autorisé (800 -> 684,262)", !bloque(w) && t(d.getElementById("grand")).includes("684,262"));
  w = await ouvrir("salaire-net/index.html", { avant: gratuitUtilise("salaire-net", Date.now() - 11 * 60000) }); d = w.document;
  saisir(w, "montant", "3000");
  check("même calculateur après 10 minutes : nouveau calcul -> bloqué", bloque(w));
  w = await ouvrir("credit/index.html", { avant: gratuitUtilise("salaire-net", Date.now() - 60000) }); d = w.document;
  saisir(w, "prix", "50000");
  check("autre calculateur le même jour (tous calculateurs confondus) -> bloqué", bloque(w));
  // -- 3. le lendemain : de nouveau autorisé
  w = await ouvrir("impot-revenu/index.html", { avant: gratuitUtilise("salaire-net", Date.now() - 86400000 * 1.5, HIER) }); d = w.document;
  saisir(w, "revenu", "25000");
  check("le lendemain : nouveau calcul gratuit autorisé (25 000 -> 4 750,000)", !bloque(w) && t(d.getElementById("grand")).includes("4 750,000") &&
    JSON.parse(w.localStorage.getItem("opt-calcul-gratuit-v1")).jour === AUJ);
  // stockage impossible (navigation privée stricte…) : on laisse calculer
  w = await ouvrir("impot-revenu/index.html"); d = w.document;
  Object.defineProperty(w, "localStorage", { get() { throw new Error("bloqué"); }, configurable: true });
  saisir(w, "revenu", "30000");
  check("stockage du navigateur impossible : le calcul marche quand même", !bloque(w) && t(d.getElementById("grand")).includes("6 250,000"));

  // -- 4. avec un code valide : tout est permis ; code expiré : bloqué
  const avecPass = fin => w => { gratuitUtilise("autre")(w); w.localStorage.setItem("opt-pass-v1", JSON.stringify({ code: "ABCD2345", fin, verifie: Date.now() })); };
  for (const calc of Object.keys(CALCS)) {
    w = await ouvrir(`${calc}/index.html`, { avant: avecPass(futur) }); d = w.document;
    saisir(w, CALCS[calc], "45678"); saisir(w, CALCS[calc], "56789");
    check(`${calc} : Pass Journée actif -> calculs autorisés après le gratuit du jour, note « Pass Journée actif jusqu'au … », en-tête coché`,
      !bloque(w) && t(d.getElementById("pass-note")).includes("Pass Journée actif") && !!d.querySelector("#entete .entete-pass.actif"));
  }
  w = await ouvrir("credit/index.html", { avant: avecPass(passe) }); d = w.document;
  w.fetch = () => Promise.reject(new TypeError("Failed to fetch"));
  saisir(w, "prix", "70000");
  check("code expiré gardé sur l'appareil -> calcul bloqué", bloque(w) && !d.querySelector("#entete .entete-pass.actif"));

  // -- 5. vérification d'un code dans le navigateur (empreinte PBKDF2-SHA-256 salée, comme le robot du dépôt privé)
  const SEL = "sel-de-test", TOURS = 1000;
  const h = c => pbkdf2Sync(c, SEL, TOURS, 32, "sha256").toString("hex");
  const LISTE = { maj: "2026-10-06T10:00:00Z", sel: SEL, tours: TOURS, codes: [{ h: h("ABCD2345"), fin: futur }, { h: h("EFGH6789"), fin: passe }] };
  const reseau = (wx, liste, panne) => { Object.defineProperty(wx, "crypto", { value: webcrypto, configurable: true });
    wx.n = 0; wx.fetch = () => { wx.n++; return panne ? Promise.reject(new TypeError("Failed to fetch")) : Promise.resolve({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(liste)) }); }; };
  w = await ouvrir("pass/index.html"); d = w.document; reseau(w, LISTE);
  check("empreinte JS = empreinte Python du robot (même vecteur de test, 100 000 tours)",
    await w.eval('empreinteCode("ABCD2345", "sel-de-test", 100000)') === "517bf9a9ea3ad38b3adcbeef5808d4efe420fbf10a2b7bd9179640f4d1c7c2dd");
  check("code valide (minuscules, tiret) : accepté avec son heure de fin", (r => r.etat === "ok" && r.fin === futur)(await w.eval('verifierCode("abcd-2345")')));
  check("code expiré : refusé « expire »", (await w.eval('verifierCode("EFGH6789")')).etat === "expire");
  check("code faux : refusé « inconnu »", (await w.eval('verifierCode("ZZZZ2222")')).etat === "inconnu");
  check("code mal formé (O, 0, I, 1 ou longueur) : refusé « forme »", (await w.eval('verifierCode("ABCD0O1I")')).etat === "forme" && (await w.eval('verifierCode("ABC")')).etat === "forme");
  const cf = d.getElementById("code-form");
  cf.querySelector("input[name=code]").value = "ZZZZ2222";
  cf.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(200);
  check("page pass/ : code faux -> « Code non reconnu », rien gardé", d.getElementById("code-status").className === "err" && /non reconnu/.test(t(d.getElementById("code-status"))) && !w.localStorage.getItem("opt-pass-v1"));
  cf.querySelector("input[name=code]").value = "EFGH 6789";
  cf.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(200);
  check("page pass/ : code expiré -> « Ce code a expiré », rien gardé", /a expiré/.test(t(d.getElementById("code-status"))) && !w.localStorage.getItem("opt-pass-v1"));
  cf.querySelector("input[name=code]").value = "abcd 2345";
  cf.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(200);
  check("page pass/ : code valide -> accepté, gardé sur l'appareil, « actif jusqu'au … à …h… », carte d'état et en-tête cochés",
    d.getElementById("code-status").className === "ok" && /jusqu'au \d{2}\/\d{2}\/\d{4} à \d{2}h\d{2}/.test(t(d.getElementById("code-status"))) &&
    JSON.parse(w.localStorage.getItem("opt-pass-v1")).fin === futur && w.eval("passActif()") && !d.getElementById("pass-etat").hidden && !!d.querySelector(".entete-pass.actif"));
  reseau(w, LISTE, true);
  check("pas de connexion : « reseau », le Pass gardé n'est pas effacé", (await w.eval('verifierCode("ABCD2345")')).etat === "reseau" && w.eval("passActif()"));
  w.localStorage.setItem("opt-pass-v1", JSON.stringify({ code: "ABCD2345", fin: futur, verifie: 0 }));
  reseau(w, { ...LISTE, codes: [] }); await w.eval("reverifierPass()");
  check("revérification : code arrêté (absent de pass.json) -> effacé, retour au calcul gratuit", !w.localStorage.getItem("opt-pass-v1") && !w.eval("passActif()"));
  w.localStorage.setItem("opt-pass-v1", JSON.stringify({ code: "ABCD2345", fin: passe, verifie: 0 }));
  reseau(w, LISTE); await w.eval("reverifierPass()");
  check("revérification : code prolongé -> nouvelle heure de fin", JSON.parse(w.localStorage.getItem("opt-pass-v1") || "{}").fin === futur);
  w.localStorage.setItem("opt-pass-v1", JSON.stringify({ code: "ABCD2345", fin: futur, verifie: Date.now() }));
  reseau(w, LISTE); await w.eval("reverifierPass()");
  check("revérification : au plus une fois par heure (aucun appel réseau juste après)", w.n === 0);
  w.localStorage.setItem("opt-pass-v1", JSON.stringify({ code: "EFGH6789", fin: passe, verifie: 0 }));
  await w.eval("reverifierPass()");
  check("revérification : code expiré -> nettoyé de l'appareil", !w.localStorage.getItem("opt-pass-v1"));
  w = await ouvrir("salaire-net/index.html");
  { let n = 0; w.fetch = () => { n++; return Promise.reject(new Error("x")); }; await w.eval("reverifierPass()");
    check("aucun appel réseau au chargement d'un calculateur sans code gardé", n === 0); }

  // -- 6. page pass/ : prix et avantages directs, paiement, formulaire, conditions
  w = await ouvrir("pass/index.html"); d = w.document;
  const offre = t(d.getElementById("offre"));
  check("pass/ : aucune erreur JavaScript", w.fautes.length === 0);
  check("pass/ : prix 7 DT pour 24 heures visible tout de suite", t(d.getElementById("tarifs")).includes("7 DT") && t(d.getElementById("tarifs")).includes("24 heures"));
  check("pass/ : avantages (tous les calculs 24 heures, 5 calculateurs, 24 h à partir de l'activation, pas de renouvellement automatique)",
    ["Tous les calculs pendant 24 heures", "24 heures à partir de l'activation de votre code", "Pas de renouvellement automatique", "retenue à la source"].every(m => offre.includes(m)));
  check("pass/ : aucun prix « TTC » ni nom de société", !/TTC|SUARL|S\.?A\.?R\.?L/i.test(lire("pass/index.html") + lire("pass/conditions/index.html")));
  const pay = d.getElementById("paiement");
  check("pass/ : bouton « Paiement » (<details>) avec D17 et IZI (liens vers les applications officielles) au 24 321 390, mode d'emploi, plus de Wafacash, 7 DT, motif nom + téléphone", !!pay && pay.tagName === "DETAILS" && t(pay.querySelector("summary")).startsWith("Paiement") &&
    ["D17", "IZI", "Transfert rapide", "24 321 390", "7 DT", "votre nom et votre téléphone"].every(m => t(pay).includes(m)) && !/Wafacash/i.test(pay.outerHTML) && ["tn.mobipost", "tn.izi.consumer", "id1475640303", "id1603653941"].every(u => pay.querySelector(`a[href*="${u}"]`)));
  check("paiement simple et rassurant (règle commune du 08/10/2026) : 3 étapes numérotées, phrase de confiance, description de l'offre cachée quand « Paiement » est ouvert", /<ol class="paie-etapes">/.test(lire("pass/index.html")) && /class="paie-confiance"/.test(lire("pass/index.html")) && /class="avantages[^"]*masque-si-paiement/.test(lire("pass/index.html")) && lire("assets/style.css").includes(":has(> details.paiement[open]) > .masque-si-paiement{display:none}"));
  const wa = d.getElementById("pass-preuve");
  check("pass/ : bouton vert « Envoyer la preuve de paiement par WhatsApp » vers wa.me/21624321390, texte prérempli", !!wa && wa.classList.contains("btn-wa") &&
    wa.href.startsWith("https://wa.me/21624321390?text=") && decodeURIComponent(wa.href).includes("Pass Journée") && t(wa).includes("Envoyer la preuve de paiement par WhatsApp"));
  const form = d.getElementById("pass-form");
  check("pass/ : formulaire Formspree mwlpakqj (nom, téléphone, case conditions, piège)", form.getAttribute("action") === "https://formspree.io/f/mwlpakqj" &&
    !!form.querySelector("[name=nom]") && !!form.querySelector("[name=telephone]") && !!form.querySelector("input[name=conditions][type=checkbox]") &&
    !!form.querySelector("input[name=_gotcha]") && !!form.querySelector('a[href="conditions/"]'));
  const appels = []; w.fetch = (u, o) => { appels.push({ u, o }); return Promise.resolve({ ok: true, status: 200 }); };
  form.querySelector("[name=nom]").value = "Test Client"; form.querySelector("[name=telephone]").value = "12";
  form.querySelector("[name=conditions]").checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
  check("pass/ : téléphone faux refusé, rien envoyé", appels.length === 0 && d.getElementById("pass-status").className === "err");
  form.querySelector("[name=telephone]").value = "+216 98 765 432"; form.querySelector("[name=conditions]").checked = false;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
  check("pass/ : conditions non cochées refusées, rien envoyé", appels.length === 0 && /conditions/.test(t(d.getElementById("pass-status"))));
  form.querySelector("[name=conditions]").checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(30);
  const envoi = appels[0] ? Object.fromEntries(appels[0].o.body.entries()) : {};
  check("pass/ : envoi Formspree (nom, téléphone 8 chiffres, formule 7 DT, ligne « pour_activer : action paye »)", appels.length === 1 && appels[0].u === "https://formspree.io/f/mwlpakqj" &&
    envoi.nom === "Test Client" && envoi.telephone === "98765432" && /7 DT/.test(envoi.formule) && String(envoi.pour_activer).includes("action: paye") && envoi.site === "Outils pratiques Tunisie");
  check("pass/ : après l'envoi, paiement + « Vous recevrez votre code par WhatsApp » + preuve WhatsApp avec nom et téléphone", form.hidden && !d.getElementById("apres-pass").hidden &&
    t(d.getElementById("apres-pass")).includes("Vous recevrez votre code par WhatsApp") && decodeURIComponent(d.getElementById("pass-preuve-apres").href).includes("Test Client — 98765432"));
  w = await ouvrir("pass/conditions/index.html"); d = w.document;
  const tc = t(d.querySelector(".conditions"));
  check("conditions : vendeur « l'éditeur du site », 7 DT, 24 heures à partir de l'activation, 1 calcul gratuit par jour, pas de renouvellement, aucune période payée remboursée, INPDP",
    ["l'éditeur du site", "7 DT pour un Pass Journée de 24 heures", "24 heures à partir de l'activation du code", "1 calcul personnel gratuit par jour", "Aucun renouvellement automatique",
     "Aucune période payée n'est remboursée", "INPDP"].every(m => tc.includes(m)) && !/déclaration n°|numéro de déclaration/i.test(tc));
  w = await ouvrir("pass/index.html", { lang: "ar" }); d = w.document;
  check("pass/ en arabe : titre, prix et formulaire en arabe", /[؀-ۿ]/.test(t(d.querySelector("h1"))) && /[؀-ۿ]/.test(t(d.getElementById("tarifs"))) && /[؀-ۿ]/.test(t(d.querySelector("#inscription h2"))));
  w = await ouvrir("credit/index.html", { lang: "ar", avant: gratuitUtilise("autre") }); d = w.document;
  saisir(w, "prix", "50000");
  check("écran bloqué en arabe", bloque(w) && t(d.getElementById("pass-bloque")).includes("استعملت حسابك المجاني لهذا اليوم") && /[؀-ۿ]/.test(t(d.querySelector("#pass-bloque .btn-pass-grand"))));

  // -- 7. bouton doré « Pass Journée » : calculateurs et pages du Pass SEULEMENT (jamais sur l'accueil, décision d'Ahmed)
  const mauvais = [];
  for (const p of TOUTES) { const wx = await ouvrir(p); const a = wx.document.querySelector("#entete a.entete-pass");
    const doit = /^(salaire-net|impot-revenu|credit|auto-entrepreneur|retenue-source|pass)\//.test(p);
    if (doit !== !!a || (a && !new URL(a.getAttribute("href"), wx.location.href).href.endsWith("/outils-pratiques-tunisie/pass/"))) mauvais.push(p); }
  check(`bouton doré « Pass Journée » dans l'en-tête des calculateurs et des pages du Pass seulement ${mauvais}`, mauvais.length === 0);
  w = await ouvrir("index.html", { avant: avecPass(futur) }); d = w.document;
  check("accueil : AUCUN bouton ni lien vers le Pass (ni en-tête, ni page, ni pied)", !d.querySelector(".entete-pass, .btn-pass-grand, .btn-pass-petit, #pass-note") &&
    ![...d.querySelectorAll("a[href]")].some(a => /pass\//.test(a.getAttribute("href"))) && !/pass\.js/.test(lire("index.html")));
  check("les 5 calculateurs et les 2 pages du Pass chargent assets/pass.js juste après page.js (même version)",
    [...Object.keys(CALCS).map(c => `${c}/index.html`), "pass/index.html", "pass/conditions/index.html"].every(p => /<script src="(\.\.\/)+assets\/page\.js\?v=(\w+)"><\/script>\r?\n<script src="(\.\.\/)+assets\/pass\.js\?v=\2"><\/script>/.test(lire(p))));

  // -- 8. « gratuit » toujours vrai : plus de « calculs gratuits » sans limite dans les titres, descriptions, aperçus, manifeste
  const textesPublics = [...TOUTES.map(lire), lire("manifest.webmanifest"), lire("assets/page.js")].join("\n");
  check("plus aucun « Calculs gratuits », « Calculez gratuitement », « Calculateurs gratuits », « Gratuit, en français »",
    !/Calculs gratuits|Calculez gratuitement|Calculateurs gratuits|calcul gratuit honoraires|Gratuit, en français|حسابات مجانية|أدوات حساب مجانية/i.test(textesPublics));
  check("« 1 calcul gratuit par jour » annoncé (en-tête, accueil, manifeste)", lire("assets/page.js").includes("1 calcul gratuit par jour") &&
    lire("index.html").includes("1 calcul gratuit par jour") && lire("manifest.webmanifest").includes("1 calcul gratuit par jour"));
  check("image d'aperçu : modèle sans pastille « Gratuit » seule (« 1 calcul gratuit par jour »)", lire("tools/og-image.html").includes('<span class="pill">1 calcul gratuit par jour</span>') &&
    !lire("tools/og-image.html").includes('<span class="pill">Gratuit</span>'));
}

// ---- Bouton « Trouver un comptable » vers notre annuaire (demande d'Ahmed, 06/10/2026 : liens entre site et moteur) ----
async function boutonComptables() {
  const ANNU = "https://ah6259.github.io/comptables-tunisie/";
  const ko = [];
  for (const p of TOUTES) for (const lang of ["fr", "ar"]) {
    const wx = await page(p, lang), a = wx.document.querySelector("#entete nav.menu a.menu-annuaire");
    const img = a?.querySelector("img");
    if (!a || a.href !== ANNU || a.target !== "_blank" || !a.rel.includes("noopener") || a.dataset.compteur !== "lien-site/comptables" || !img ||
        !img.getAttribute("src").endsWith("assets/logo-comptables.svg") || !a.textContent.includes(lang === "fr" ? "Trouver un comptable" : "ابحث عن محاسب")) ko.push(p + " " + lang);
  }
  check(`menu de l'en-tête : bouton « Trouver un comptable » / « ابحث عن محاسب » avec le logo de l'annuaire, sur toutes les pages ${ko.join(", ")}`, ko.length === 0);
  check("logo de l'annuaire copié dans le site (CSP : images du site seulement) et bordure dorée #F2B33D",
    existsSync(join(root, "assets/logo-comptables.svg")) && lire("assets/logo-comptables.svg").includes("<svg") &&
    /\.menu a\.menu-annuaire\{[^}]*border:2px solid #F2B33D/.test(lire("assets/style.css")) && /\.outil-annuaire\{border:2px solid #F2B33D\}/.test(lire("assets/style.css")));
  const w2 = await page("index.html"), c = w2.document.getElementById("carte-comptables");
  check("accueil : carte « Trouver un comptable » avec les cartes des calculateurs (logo, nouvel onglet, clic compté)",
    !!c && !!c.closest(".outils") && c.href === ANNU && c.target === "_blank" && c.dataset.compteur === "lien-site/comptables" &&
    c.querySelector("img").getAttribute("src") === "assets/logo-comptables.svg" && c.textContent.includes("Trouver un comptable"));
  const comptes = []; w2.goatcounter = { count: o => comptes.push(o) };
  w2.addEventListener("click", e => e.preventDefault());
  w2.document.querySelector("#entete a.menu-annuaire").dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  c.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("clic sur « Trouver un comptable » compté anonymement (« lien-site/comptables »)", comptes.length === 2 && comptes.every(o => o.path === "lien-site/comptables" && o.event === true));
  const menuKo = [];
  for (const p of TOUTES) { const wx = await page(p);
    for (const a of wx.document.querySelectorAll("#entete nav.menu a:not(.menu-annuaire)")) { const f = cible(p, a.getAttribute("href")); if (!f || !existsSync(f)) menuKo.push(p + " → " + a.getAttribute("href")); } }
  check(`menu de l'en-tête : les 5 calculateurs mènent à des pages existantes ${menuKo.join(", ")}`, menuKo.length === 0);
  check("encarts sous les résultats inchangés (lien-comptables/<calculateur>)", ["salaire-net", "impot-revenu", "credit", "auto-entrepreneur", "retenue-source"]
    .every(c2 => lire(`${c2}/index.html`).includes(`data-compteur="lien-comptables/${c2}"`)));
}

// ---- Bouton « Partager » (demande d'Ahmed, 06/10/2026 : plus de partages entre visiteurs) ----
async function boutonPartager() {
  const ko = [];
  for (const p of TOUTES) for (const lang of ["fr", "ar"]) {
    const wx = await page(p, lang), b = wx.document.querySelector("#entete button.partager");
    if (!b || b.getAttribute("aria-label") !== (lang === "fr" ? "Partager cette page" : "شارك هذه الصفحة") || !b.querySelector("svg")) ko.push(p + " " + lang);
  }
  check(`en-tête : bouton « Partager » (« Partager cette page » / « شارك هذه الصفحة ») sur toutes les pages ${ko.join(", ")}`, ko.length === 0);
  for (const p of [TOUTES[0], TOUTES[TOUTES.length - 1]]) {
    const wx = await page(p, "ar"), ouverts = [], comptes = [];
    wx.open = (...a) => { ouverts.push(a); return null; };
    wx.goatcounter = { count: o => comptes.push(o) };
    wx.document.querySelector("#entete button.partager").click();
    await new Promise(ok => setTimeout(ok, 0));
    // partage par lien (demande d'Ahmed) : la page vidéo du site + l'adresse du site, dans la langue de la page
    const adresse = "https://ah6259.github.io/outils-pratiques-tunisie/video/?lang=ar";
    check(`${p} : sans navigator.share, « Partager » ouvre wa.me avec la page vidéo + l'adresse du site et compte le clic`, !wx.navigator.share && ouverts.length === 1
      && ouverts[0][0].startsWith("https://wa.me/?text=") && decodeURIComponent(ouverts[0][0].slice(20)).endsWith(" " + adresse)
      && decodeURIComponent(ouverts[0][0]).includes("https://ah6259.github.io/outils-pratiques-tunisie/?lang=ar") && ouverts[0][1] === "_blank"
      && comptes.length === 1 && comptes[0].path.startsWith("partage/") && comptes[0].event === true);
  }
}

console.log(erreurs ? `\n${erreurs} PROBLÈME(S)` : "\nTOUT PASSE");
process.exit(erreurs ? 1 : 0);
