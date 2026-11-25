/* Pass Journée (partie payante, accord écrit d'Ahmed du 06/10/2026) — chargé juste après page.js
   par les 5 calculateurs et les pages pass/ et pass/conditions/.

   Gratuit pour toujours :
   - l'EXEMPLE affiché à l'ouverture de chaque calculateur (valeurs d'origine de la page) ;
   - 1 calcul personnel par jour et par appareil, tous calculateurs confondus (compté dans localStorage, toujours dans un try).
     Un « calcul personnel » = le visiteur change un chiffre ou un choix. Pendant 10 minutes, sur le même calculateur,
     il peut encore corriger ses chiffres (taper « 2500 » = 4 frappes) : c'est toujours le même calcul gratuit.
   Au calcul personnel suivant du même jour : le résultat est masqué par l'écran « Vous avez utilisé votre calcul gratuit du jour »
   → Pass Journée 7 DT (tous les calculs pendant 24 heures) ou « Revenez demain ».

   Code d'accès (site statique, pas de serveur) :
   - Ahmed active un client depuis l'application GitHub (dépôt PRIVÉ Ah6259/outils-pass, bouton « pass »).
     Le robot publie ici, dans donnees/pass.json, SEULEMENT l'empreinte du code (PBKDF2-SHA-256 salée) et l'heure de fin
     (24 heures après l'activation, en temps universel). Aucun nom, aucun téléphone dans ce dépôt public.
   - Le visiteur tape son code UNE fois : le navigateur calcule l'empreinte (crypto.subtle), la cherche dans pass.json,
     vérifie l'heure de fin, puis garde le code sur l'appareil.
   - Revérification au plus une fois par heure (seulement si un code est gardé) : code arrêté ou expiré = effacé ;
     pas de réseau = gardé jusqu'à l'heure de fin connue. Rien n'est demandé au réseau si aucun code n'est gardé. */
const PASS = {
  prix: 7,                                     // DT
  heures: 24,                                  // durée du Pass Journée, à partir de l'activation du code
  minutesCorrection: 10,                       // temps pour corriger ses chiffres pendant le calcul gratuit
  donnees: "donnees/pass.json",
  cle: "opt-pass-v1",                          // code gardé sur l'appareil
  cleGratuit: "opt-calcul-gratuit-v1",         // { jour, calc, debut } du calcul gratuit du jour
  alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",  // sans O/0 ni I/1 (faciles à confondre)
  longueur: 8,
  whatsapp: "21624321390",
  cleCommande: "pass-commande",               // commande en attente : { code, formule, date } SEULEMENT (règle commune § 70)
  joursCommande: 60
};
const isoP = s => "⁦" + s + "⁩";
/* ---- dates ---- */
function aujourdhui(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// heure de fin lisible, à l'heure du téléphone : « 07/10/2026 à 14h32 »
function finLisible(isoFin, ar) {
  const d = new Date(isoFin);
  if (isNaN(d)) return "";
  const j = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");
  return ar ? isoP(j) + " على الساعة " + isoP(h) : j + " à " + h;
}

/* ---- code gardé sur l'appareil ---- */
function normaliserCode(s) { return String(s || "").toUpperCase().replace(/[\s\-_.]/g, ""); }
function formeCodeOk(c) { return c.length === PASS.longueur && [...c].every(x => PASS.alphabet.includes(x)); }
function lirePass() {
  try {
    const p = JSON.parse(localStorage.getItem(PASS.cle) || "null");
    if (p && typeof p.code === "string" && !isNaN(Date.parse(p.fin))) return p;
  } catch (e) {}
  return null;
}
function ecrirePass(p) {
  try { if (p) localStorage.setItem(PASS.cle, JSON.stringify(p)); else localStorage.removeItem(PASS.cle); } catch (e) {}
}
function passActif() { const p = lirePass(); return !!p && Date.parse(p.fin) > Date.now(); }
function finPass() { const p = lirePass(); return p ? p.fin : ""; }

/* ---- 1 calcul personnel gratuit par jour (tous calculateurs confondus) ---- */
// "gratuit" = autorisé (calcul gratuit du jour) ; "bloque" = déjà utilisé aujourd'hui
function calculGratuit(nom) {
  try {
    const maintenant = Date.now(), jour = aujourdhui();
    const g = JSON.parse(localStorage.getItem(PASS.cleGratuit) || "null");
    if (!g || g.jour !== jour) {
      localStorage.setItem(PASS.cleGratuit, JSON.stringify({ jour, calc: nom, debut: maintenant }));
      return "gratuit";
    }
    if (g.calc === nom && maintenant - g.debut >= 0 && maintenant - g.debut < PASS.minutesCorrection * 60000) return "gratuit";
    return "bloque";
  } catch (e) { return "gratuit"; }          // stockage impossible : on laisse calculer
}

/* ---- l'exemple affiché à l'ouverture (toujours gratuit) ---- */
function champsCalcul() {
  return [...document.querySelectorAll("main input, main select")].filter(e => !e.closest("form") && e.type !== "hidden");
}
function etatFormulaire() {
  return JSON.stringify([
    ...champsCalcul().map(e => e.type === "checkbox" || e.type === "radio" ? e.checked : e.value),
    ...[...document.querySelectorAll("main .choix[data-nom]")].map(c => { const b = c.querySelector("button.on"); return b ? b.dataset.v : ""; })
  ]);
}
let EXEMPLE = null, EXEMPLE_VALEURS = null, BLOCAGE_COMPTE = false;
function memoriserExemple() {
  EXEMPLE = etatFormulaire();
  EXEMPLE_VALEURS = {
    champs: champsCalcul().map(e => [e, e.type === "checkbox" || e.type === "radio" ? e.checked : e.value]),
    choix: [...document.querySelectorAll("main .choix[data-nom]")].map(c => { const b = c.querySelector("button.on"); return [c, b ? b.dataset.v : ""]; })
  };
}
// « Revoir l'exemple » : remet les chiffres d'origine de la page (résultat gratuit)
function revoirExemple() {
  if (!EXEMPLE_VALEURS) return;
  EXEMPLE_VALEURS.champs.forEach(([e, v]) => { if (typeof v === "boolean") e.checked = v; else e.value = v; });
  EXEMPLE_VALEURS.choix.forEach(([c, v]) => c.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === v)));
  EXEMPLE_VALEURS.champs.forEach(([e]) => { e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); });
  document.dispatchEvent(new Event("recalcul"));
}

/* ---- la porte : appelée au début de chaque calcul. true = on calcule ; false = résultat masqué ---- */
function porteCalcul(nom) {
  const etat = etatFormulaire();
  if (EXEMPLE === null) memoriserExemple();
  let mode = "exemple";
  if (passActif()) mode = "pass";
  else if (etat !== EXEMPLE) mode = calculGratuit(nom);
  afficherVerrou(mode === "bloque", nom);
  noteResultat(mode);
  return mode !== "bloque";
}

const ICONE_TICKET = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 7v12"/></svg>';
function racineSite() { return document.documentElement.dataset.racine || ""; }   // fichiers (données du Pass)
// pages : dossier de la langue (ar/… sur une page arabe, une adresse par langue depuis le 21/11/2026)
function racinePagesPass() { return window.racinePages ? window.racinePages() : racineSite(); }
function htmlBoutonPass(id) {
  return `<a class="btn-pass-grand" id="${id}" href="${racinePagesPass()}pass/">${ICONE_TICKET}<span>${T("Pass Journée : 7 DT", "باقة اليوم: " + isoP("7") + " د")}<small>${T("Tous les calculs pendant 24 heures, sur les 5 calculateurs", "كل الحسابات طيلة " + isoP("24") + " ساعة، في الحاسبات الخمس")}</small></span></a>`;
}

// écran « Vous avez utilisé votre calcul gratuit du jour », à la place du résultat
function afficherVerrou(bloque, nom) {
  const res = document.querySelector(".resultat");
  if (!res) return;
  let b = document.getElementById("pass-bloque");
  if (bloque && !b) {
    b = document.createElement("div");
    b.className = "pass-bloque"; b.id = "pass-bloque";
    res.insertBefore(b, res.firstChild);
  }
  document.body.toggleAttribute("data-verrou", bloque);
  if (!b) return;
  b.hidden = !bloque;
  if (!bloque) return;
  const r = racinePagesPass();
  b.innerHTML = `<h2>${T("Vous avez utilisé votre calcul gratuit du jour", "استعملت حسابك المجاني لهذا اليوم")}</h2>
    <p>${T("Avec le <b>Pass Journée à 7 DT</b>, faites tous vos calculs pendant 24 heures, sur les 5 calculateurs.",
           "مع <b>باقة اليوم بـ" + isoP("7") + " د</b>، قم بكل حساباتك طيلة " + isoP("24") + " ساعة، في الحاسبات الخمس.")}</p>
    ${htmlBoutonPass("pass-bloque-bouton")}
    <p class="demain">${T("Sinon, revenez demain : un nouveau calcul gratuit vous attend.", "وإلا، عد غدًا: ينتظرك حساب مجاني جديد.")}</p>
    <p class="pass-liens"><a href="${r}pass/#code-acces">${T("J'ai déjà un code", "لدي رمز")}</a>
      <button type="button" class="lien-bouton" id="revoir-exemple">${T("Revoir l'exemple (gratuit)", "إعادة عرض المثال (مجاني)")}</button></p>`;
  b.querySelector("#revoir-exemple").addEventListener("click", revoirExemple);
  if (!BLOCAGE_COMPTE) {                         // statistique anonyme, une fois par page
    BLOCAGE_COMPTE = true;
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "pass-bloque/" + nom, title: "Calcul gratuit du jour déjà utilisé", event: true }); } catch (e) {}
  }
}

// petite ligne sous le résultat : exemple / calcul gratuit / Pass actif, et bouton « Pass Journée » près du résultat
function noteResultat(mode) {
  const res = document.querySelector(".resultat");
  if (!res) return;
  let n = document.getElementById("pass-note");
  if (!n) { n = document.createElement("p"); n.id = "pass-note"; n.className = "pass-note"; res.appendChild(n); }
  n.hidden = mode === "bloque";
  const lien = `<a class="btn-pass-petit" href="${racinePagesPass()}pass/">${T("Pass Journée 7 DT", "باقة اليوم " + isoP("7") + " د")}</a>`;
  if (mode === "pass") {
    n.className = "pass-note actif";
    n.innerHTML = T(`<b>Pass Journée actif</b> jusqu'au ${finLisible(finPass())} : calculs illimités.`,
                    `<b>باقة اليوم مفعّلة</b> إلى غاية ${finLisible(finPass(), true)}: حسابات بلا حدود.`);
  } else if (mode === "gratuit") {
    n.className = "pass-note";
    n.innerHTML = `<span>${T(`Votre calcul gratuit du jour : vous pouvez corriger vos chiffres pendant ${PASS.minutesCorrection} minutes.`,
      `حسابك المجاني لهذا اليوم: يمكنك تصحيح أرقامك طيلة ${isoP(PASS.minutesCorrection)} دقائق.`)}</span>${lien}`;
  } else {
    n.className = "pass-note";
    n.innerHTML = `<span>${T("Exemple. Tapez vos chiffres : 1 calcul gratuit par jour.", "مثال. اكتب أرقامك: حساب مجاني واحد كل يوم.")}</span>${lien}`;
  }
}

/* ---- vérification d'un code ---- */
async function empreinteCode(code, sel, tours) {
  const enc = new TextEncoder();
  const cle = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(sel), iterations: tours }, cle, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
async function chargerListePass() {
  const r = await fetch(racineSite() + PASS.donnees, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  if (!d || typeof d.sel !== "string" || !Array.isArray(d.codes) || !(d.tours > 0)) throw new Error("liste illisible");
  return d;
}
// résultat : { etat: "ok" | "expire" | "inconnu" | "forme" | "reseau" | "impossible", fin, code }
async function verifierCode(saisie) {
  const code = normaliserCode(saisie);
  if (!formeCodeOk(code)) return { etat: "forme", code };
  if (!(window.crypto && window.crypto.subtle) || typeof fetch !== "function") return { etat: "impossible", code };
  let liste, h;
  try { liste = await chargerListePass(); } catch (e) { return { etat: "reseau", code }; }
  try { h = await empreinteCode(code, liste.sel, liste.tours); } catch (e) { return { etat: "impossible", code }; }
  const trouve = liste.codes.find(c => c && c.h === h);
  if (!trouve) return { etat: "inconnu", code };
  if (!(Date.parse(trouve.fin) > Date.now())) return { etat: "expire", fin: trouve.fin, code };
  return { etat: "ok", fin: trouve.fin, code };
}
function annoncerPass() { document.dispatchEvent(new Event("pass")); }
async function activerCode(saisie) {
  const r = await verifierCode(saisie);
  if (r.etat === "ok") { ecrirePass({ code: r.code, fin: r.fin, verifie: Date.now() }); finCommande(r.code); annoncerPass(); }
  return r;
}
// Code déjà gardé : revérifié au plus une fois par heure (ou s'il semble expiré : il a peut-être été prolongé)
async function reverifierPass() {
  const p = lirePass();
  if (!p) return;
  if (Date.now() - (+p.verifie || 0) < 3600000 && Date.parse(p.fin) > Date.now()) return;
  const avant = passActif();
  const r = await verifierCode(p.code);
  if (r.etat === "ok") ecrirePass({ code: p.code, fin: r.fin, verifie: Date.now() });
  else if (r.etat === "inconnu" || r.etat === "expire" || r.etat === "forme") ecrirePass(null);   // arrêté, expiré : nettoyé
  // "reseau" / "impossible" : on garde le code jusqu'à son heure de fin connue
  if (avant !== passActif() || r.etat === "ok" && r.fin !== p.fin) annoncerPass();
}

/* ---- CODE DE COMMANDE ----
   Depuis le 25 novembre 2026 (PASS.1, règle commune § 70.8) : le parcours d'achat (vérifications, code de commande créé au formulaire,
   Formspree, e-mail automatique, « Dernière étape », mémoire « pass-commande », code essayé tout seul au retour, « Nouvelle commande »)
   est fait par le MODULE COMMUN assets/pass-commun.js (copie exacte de projets-ahmed, ne pas la modifier ici) avec le réglage de ce site
   assets/pass-reglages.js (chargés seulement par pass/). Ici restent les liens WhatsApp de départ et la fin d'une commande activée. */
function joliCode(c) { return c.slice(0, 4) + "-" + c.slice(4); }
// message WhatsApp de la preuve SANS commande (bouton de l'offre) ; avec une commande, le module met code + nom + formule
function lienPreuve() {
  const site = T("Outils pratiques Tunisie", "أدوات عملية تونس");
  return "https://wa.me/" + PASS.whatsapp + "?text=" + encodeURIComponent(T("Voici ma preuve de paiement — " + site + " — Pass Journée", "هذا وصل الدفع — " + site + " — باقة اليوم"));
}
function majLiensPreuve() {
  document.querySelectorAll("#pass-preuve, #pass-preuve-apres").forEach(a => a.setAttribute("href", lienPreuve()));
}
function cacherCommande() {
  const form = document.getElementById("pass-form"), apres = document.getElementById("apres-pass"), b = document.getElementById("commande-attente");
  if (apres) apres.hidden = true;
  if (b) b.hidden = true;
  if (form) form.hidden = false;
  majLiensPreuve();
}
// code activé (tapé ou essayé tout seul) : la commande en attente est terminée
function finCommande(code) {
  const c = window.PASS_COMMANDE && window.PASS_COMMANDE.relire();   // commande gardée par le module commun
  if (c && c.code === code) { try { localStorage.removeItem(PASS.cleCommande); } catch (e) {} cacherCommande(); }
}
function brancherCodeAcces() {
  const form = document.getElementById("code-form");
  if (!form || form.dataset.branche) return;
  form.dataset.branche = "1";
  const statut = document.getElementById("code-status"), bouton = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (bouton.disabled) return;
    const champ = form.querySelector("input[name=code]");
    bouton.disabled = true;
    statut.className = ""; statut.textContent = T("Vérification…", "جارٍ التثبت…");
    const r = await activerCode(champ.value);
    bouton.disabled = false;
    const M = {
      ok: ["Code accepté : votre Pass Journée est actif sur ce téléphone jusqu'au " + finLisible(r.fin) + ". Tous les calculs sont débloqués.",
           "تم قبول الرمز: باقة اليوم مفعّلة على هذا الهاتف إلى غاية " + finLisible(r.fin, true) + ". كل الحسابات متاحة."],
      forme: ["Le code a 8 caractères (lettres et chiffres), par exemple ABCD-EF23.", "الرمز يتكون من " + isoP("8") + " حروف وأرقام، مثال " + isoP("ABCD-EF23") + "."],
      inconnu: ["Code non reconnu. Vérifiez-le ; si vous venez de le recevoir, réessayez dans 10 minutes.", "رمز غير معروف. تثبّت منه؛ إن وصلك للتو، أعد المحاولة بعد " + isoP("10") + " دقائق."],
      expire: ["Ce code a expiré le " + finLisible(r.fin) + ". Pour continuer, demandez un nouveau Pass Journée ci-dessous.", "انتهت صلاحية هذا الرمز في " + finLisible(r.fin, true) + ". للمواصلة، اطلب باقة يوم جديدة أسفله."],
      reseau: ["Pas de connexion : vérifiez Internet et réessayez.", "لا يوجد اتصال: تحقّق من الإنترنت وأعد المحاولة."],
      impossible: ["Votre navigateur ne peut pas vérifier le code : mettez-le à jour ou essayez Chrome.", "متصفحك لا يستطيع التثبت من الرمز: حدّثه أو جرّب ⁨Chrome⁩."]
    }[r.etat];
    statut.className = r.etat === "ok" ? "ok" : "err";
    statut.textContent = T(M[0], M[1]);
    if (r.etat === "ok") champ.value = "";
  });
}
// carte « Votre Pass Journée est actif » en haut de la page pass/
function majEtatPass() {
  const e = document.getElementById("pass-etat");
  if (e) {
    e.hidden = !passActif();
    if (passActif()) e.innerHTML = `<b>${T("Votre Pass Journée est actif", "باقة اليوم مفعّلة")}</b> ${T("sur ce téléphone jusqu'au " + finLisible(finPass()) + " : tous les calculs sont débloqués.",
      "على هذا الهاتف إلى غاية " + finLisible(finPass(), true) + ": كل الحسابات متاحة.")}`;
  }
  document.querySelectorAll(".entete-pass").forEach(a => a.classList.toggle("actif", passActif()));
}
/* ---- rappel de fin du Pass (demande d'Ahmed, octobre 2026) ----
   Pas de Telegram ni d'e-mail : la page elle-même remercie le client et lui rappelle la fin.
   - Pass valide qui finit bientôt : 7 jours ou moins ; un Pass Journée (24 heures, début connu) : son dernier quart,
     donc les 6 dernières heures -> petit bandeau, au plus une fois par jour.
   - Pass terminé (au plus 30 jours après la fin) -> message « Votre Pass Journée est terminé — merci ! », une seule fois.
   Mémoire sur l'appareil : PASS.cleRappel = { fin, vu (jour du dernier bandeau), finVu (message de fin montré) }. */
PASS.cleRappel = "opt-pass-rappel-v1";
function lireRappel() { try { const r = JSON.parse(localStorage.getItem(PASS.cleRappel) || "null"); return r && typeof r === "object" ? r : {}; } catch (e) { return {}; } }
function ecrireRappel(r) { try { localStorage.setItem(PASS.cleRappel, JSON.stringify(r)); } catch (e) {} }
// note l'heure de fin AVANT la revérification (qui efface un code expiré) : le message de fin reste possible
function noterFinPass() {
  const p = lirePass(), r = lireRappel();
  if (p && p.fin !== r.fin) ecrireRappel({ fin: p.fin, vu: r.vu || "", finVu: false });
}
// { type: "proche" | "fini", fin } ou null
function etatRappel() {
  const r = lireRappel(), maintenant = Date.now();
  if (passActif()) {
    const fin = lirePass().fin, reste = Date.parse(fin) - maintenant, duree = PASS.heures * 36e5;   // début = fin - 24 heures
    const proche = duree < 30 * 864e5 ? reste <= duree / 4 : reste <= 7 * 864e5;
    return proche && r.vu !== aujourdhui() ? { type: "proche", fin } : null;
  }
  const t = Date.parse(r.fin);
  if (t > 0 && t <= maintenant && !r.finVu && maintenant - t <= 30 * 864e5) return { type: "fini", fin: r.fin };
  return null;
}
let rappelMontre = null;
function dessinerRappel() {
  const ancien = document.getElementById("rappel-zone");
  if (ancien) ancien.remove();
  const e = rappelMontre, main = document.querySelector("main");
  if (!e || !main) return;
  const racine = racinePagesPass();
  const b = document.createElement("aside");
  b.className = "rappel-pass" + (e.type === "fini" ? " fini" : "");
  b.id = "rappel-pass";
  b.setAttribute("role", "status");
  b.innerHTML = '<button type="button" class="rappel-fermer" aria-label="' + T("Fermer", "إغلاق") + '">×</button>' +
    (e.type === "proche"
      ? "<p><b>" + T("Merci pour votre inscription !", "شكرًا على اشتراكك!") + "</b> " +
        T("Votre Pass Journée se termine le " + finLisible(e.fin) + ".", "تنتهي باقة اليوم في " + finLisible(e.fin, true) + ".") + "</p>"
      : "<p><b>" + T("Votre Pass Journée est terminé — merci !", "انتهت باقة اليوم — شكرًا لك!") + "</b> " +
        T("Il a pris fin le " + finLisible(e.fin) + ".", "انتهت في " + finLisible(e.fin, true) + ".") + "</p>") +
    '<p class="rappel-actions"><a class="btn-pro rappel-renouveler" href="' + racine + 'pass/#offre">' + T("Renouveler mon Pass", "جدّد باقتي") + "</a>" +
    '<a class="rappel-avis" href="' + racine + '#avis">' + T("Donner mon avis", "أعطِ رأيك") + "</a></p>";
  // tout en haut, sous l'en-tête (avant le grand bandeau de la page) : vu sans faire défiler
  const zone = document.createElement("div");
  zone.className = "wrap rappel-zone";
  zone.id = "rappel-zone";
  zone.appendChild(b);
  b.querySelector(".rappel-fermer").addEventListener("click", () => { rappelMontre = null; zone.remove(); });
  const avant = document.querySelector("body > .hero") || main;
  avant.parentNode.insertBefore(zone, avant);
}
function afficherRappel() {
  const e = etatRappel();
  if (!e) return;
  const r = lireRappel();
  if (e.type === "proche") r.vu = aujourdhui(); else r.finVu = true;
  ecrireRappel(r);
  rappelMontre = e;
  dessinerRappel();
}
document.addEventListener("langue", () => { if (rappelMontre) dessinerRappel(); });

document.addEventListener("pass", () => { majEtatPass(); document.dispatchEvent(new Event("recalcul")); });
document.addEventListener("langue", majEtatPass);
document.addEventListener("DOMContentLoaded", () => {
  brancherCodeAcces();
  if (document.getElementById("pass-form")) majLiensPreuve();
  majEtatPass();
  noterFinPass();
  // la commande en attente est essayée APRÈS la revérification du Pass gardé (module commun : crochet essayerCode de pass-reglages.js)
  window.PASS_PRET = reverifierPass().catch(() => {}).then(() => { noterFinPass(); afficherRappel(); }).catch(() => {});
});
