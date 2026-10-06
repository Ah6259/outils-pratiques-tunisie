/* Langue (français / arabe), en-tête (bouton doré « Pass Journée » sur les calculateurs, voir pass.js) et pied de page communs, petites fonctions */
const MAJ = "05/10/2026";   // date de la dernière vérification des règles (mise à jour par le robot surveillance.yml)
const ANNEE = 2026;          // année des règles affichée sur le site (changée par le robot en janvier)
// Site « Documents Tunisie » : laisser vide tant qu'il n'est pas en ligne (la carte de l'accueil reste « bientôt »).
// Quand il sera publié : const URL_DOCUMENTS = "https://ah6259.github.io/documents-tunisie/";
const URL_DOCUMENTS = "https://ah6259.github.io/documents-tunisie/";
// Menu de l'en-tête (toutes les pages) : les 5 calculateurs + notre annuaire des comptables (demande d'Ahmed, 06/10/2026 :
// « améliorer les liens entre site et moteur »). Lien externe = bouton à bordure dorée avec le logo de l'annuaire
// (copie locale assets/logo-comptables.svg : la CSP n'autorise que les images du site). Clic compté : « lien-site/comptables ».
const MENU_SITE = [
  ["https://ah6259.github.io/comptables-tunisie/", "Trouver un comptable", "ابحث عن محاسب", "assets/logo-comptables.svg"],  // en premier : visible sur les petits écrans
  ["salaire-net/", "Salaire net", "الأجر الصافي"],
  ["impot-revenu/", "Impôt", "الضريبة"],
  ["credit/", "Crédit", "القرض"],
  ["auto-entrepreneur/", "Auto-entrepreneur", "المبادر الذاتي"],
  ["retenue-source/", "Retenue à la source", "الخصم من المورد"]
];

(function () {
  const html = document.documentElement;
  const racine = html.dataset.racine || "";
  let langue = "fr";
  try { langue = localStorage.getItem("langue") || (navigator.language || "").startsWith("ar") && "ar" || "fr"; } catch (e) {}
  const demande = new URLSearchParams(location.search).get("lang");
  if (demande === "ar" || demande === "fr") langue = demande;

  window.T = (fr, ar) => html.lang === "ar" ? ar : fr;

  function cadre() {
    // bouton doré « Pass Journée » : SEULEMENT sur les calculateurs et les pages du Pass (<body data-pass>),
    // jamais sur l'accueil (décision d'Ahmed, 06/10/2026 : le visiteur partirait). Voir assets/pass.js.
    const passIci = !!document.body && document.body.hasAttribute("data-pass");
    const e = document.getElementById("entete");
    if (e) e.innerHTML = `
      <div class="wrap">
        <a class="logo" href="${racine || "./"}">
          <img class="logo-mark" src="${racine}assets/logo.svg" alt="" width="34" height="34">
          <span class="logo-nom">${T("Outils pratiques Tunisie", "أدوات عملية تونس")}
            <small>${T("1 calcul gratuit par jour · règles 2026", "حساب مجاني كل يوم · قواعد 2026")}</small></span>
        </a>
        <div class="entete-boutons">
          ${passIci ? `<a class="entete-pass${typeof passActif === "function" && passActif() ? " actif" : ""}" href="${racine}pass/"><span class="long">${T("Pass Journée", "باقة اليوم")}</span><span class="court">${T("Pass", "الباقة")}</span></a>` : ""}
          <button class="partager" type="button" aria-label="${T("Partager cette page", "شارك هذه الصفحة")}" title="${T("Partager", "شارك")}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg></button>
          <button class="langue" type="button">${T("العربية", "Français")}</button>
        </div>
      </div>
      <nav class="menu" aria-label="${T("Calculateurs", "الحاسبات")}"><div class="wrap">${MENU_SITE.map(([h, fr, ar, ico]) => /^https:/.test(h)
        ? `<a class="menu-annuaire" href="${h}" target="_blank" rel="noopener" data-compteur="lien-site/comptables">${ico ? `<img src="${racine}${ico}" alt="" width="20" height="20">` : ""}${T(fr, ar)}</a>`
        : `<a href="${racine}${h}"${location.pathname.endsWith("/" + h) ? ' aria-current="page"' : ""}>${T(fr, ar)}</a>`).join("")}</div></nav>`;
    const p = document.getElementById("pied");
    if (p) p.innerHTML = `
      <div class="wrap">
        <div class="pied-logo"><img src="${racine}assets/logo.svg" alt="" width="24" height="24"> ${T("Outils pratiques Tunisie", "أدوات عملية تونس")}</div>
        <nav>
          <a href="${racine}salaire-net/">${T("Salaire brut ⇄ net", "الأجر الخام ⇄ الصافي")}</a>
          <a href="${racine}impot-revenu/">${T("Impôt sur le revenu", "الضريبة على الدخل")}</a>
          <a href="${racine}credit/">${T("Crédit immobilier et auto", "القرض العقاري والسيارة")}</a>
          <a href="${racine}auto-entrepreneur/">${T("Auto-entrepreneur", "المبادر الذاتي")}</a>
          <a href="${racine}retenue-source/">${T("Retenue à la source", "الخصم من المورد")}</a>
          <a href="${racine}a-propos/">${T("À propos et méthode", "من نحن والمنهجية")}</a>
          ${racine ? `<a href="${racine}pass/">${T("Pass Journée", "باقة اليوم")}</a>` : ""}
          <a href="${racine}#avis">${T("Votre avis", "رأيك")}</a>
        </nav>
        <p>${T(`Règles vérifiées le ${MAJ} : loi de finances 2025 (barème de l'impôt), taux de la CNSS 2026.`,
               `قواعد تم التثبت منها في ${MAJ}: قانون المالية 2025 (جدول الضريبة)، نسب الضمان الاجتماعي 2026.`)}</p>
        <p>${T("Résultats indicatifs : ce site n'est pas un service officiel. Les calculs se font dans votre téléphone, aucune donnée n'est envoyée.",
               "نتائج تقريبية: هذا الموقع ليس خدمة رسمية. الحساب يتم في هاتفك، لا تُرسل أي معطيات.")}</p>
        <p>${T("Photos : Wikimedia Commons, licences libres —", "الصور: ويكيميديا كومنز، رخص حرة —")} <a href="${racine}a-propos/#photos">${T("auteurs et licences", "المؤلفون والرخص")}</a>.</p>
        <p>© 2026 Outils pratiques Tunisie — ${T("tous droits réservés.", "جميع الحقوق محفوظة.")}</p>
      </div>`;
    document.querySelectorAll(".langue").forEach(b =>
      b.addEventListener("click", () => appliquer(html.lang === "ar" ? "fr" : "ar")));
    // bouton Partager (demande d'Ahmed) : menu de partage du téléphone, sinon WhatsApp avec le lien de la page
    document.querySelectorAll(".partager").forEach(b => b.addEventListener("click", async () => {
      const url = location.href.split("#")[0].replace(/[?&]lang=(fr|ar)/, ""), titre = document.title.split(" | ")[0];
      try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "partage" + location.pathname.replace("/outils-pratiques-tunisie/", "/"), title: "Partage", event: true }); } catch (e) {}
      return window.partagerLien();
    }));
    document.querySelectorAll("[data-maj]").forEach(x => x.textContent = MAJ);
    // texte de remplacement des photos dans la langue choisie
    document.querySelectorAll("img[data-alt-ar]").forEach(i => {
      if (!i.dataset.altFr) i.dataset.altFr = i.alt;
      i.alt = html.lang === "ar" ? i.dataset.altAr : i.dataset.altFr;
    });
  }

  function appliquer(l) {
    html.lang = l; html.dir = l === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("langue", l); } catch (e) {}
    cadre();
    document.dispatchEvent(new Event("langue"));
  }
  // carte « Documents prêts à remplir » de l'accueil : devient un lien quand URL_DOCUMENTS est rempli
  function carteDocuments() {
    const c = document.getElementById("carte-documents");
    if (!URL_DOCUMENTS || !c || c.tagName === "A") return;
    const a = document.createElement("a");
    a.className = "carte outil"; a.id = c.id; a.href = URL_DOCUMENTS; a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = c.innerHTML;
    const badge = a.querySelector(".badge"); if (badge) badge.remove();
    a.insertAdjacentHTML("beforeend", '<span class="fleche">→</span>');
    c.replaceWith(a);
  }
  document.addEventListener("DOMContentLoaded", () => { carteDocuments(); appliquer(langue); });
})();

/* Boutons de choix (un seul actif) : <div class="choix" data-nom="x"><button data-v="..."> */
function choixValeur(nom) {
  const b = document.querySelector(`.choix[data-nom="${nom}"] button.on`);
  return b ? b.dataset.v : null;
}
document.addEventListener("click", e => {
  const b = e.target.closest(".choix button");
  if (!b) return;
  b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  document.dispatchEvent(new Event("recalcul"));
});

function lienWhatsApp(texte) {
  return "https://wa.me/?text=" + encodeURIComponent(texte + " " + location.href.split("?")[0]);
}
const ICONE_WHATSAPP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>';

/* ---- Protection légère contre la copie (consigne d'Ahmed, 05/10/2026) ----
   Photos : pas de clic droit ni de glisser. Textes de valeur (.protege) : non sélectionnables (CSS) et,
   si on les copie quand même, la source est ajoutée. Restent copiables : montants calculés (.resultat),
   champs de formulaire et liens. Ce qu'on voit peut toujours être capturé : la vraie protection = licence + ©. */
const ZONE_COPIABLE = ".resultat, input, select, textarea, a";
const ZONE_PROTEGEE = ".hero, main .carte";
document.addEventListener("contextmenu", e => { if (e.target.closest("img, .illus")) e.preventDefault(); });
document.addEventListener("dragstart", e => { if (e.target.closest("img")) e.preventDefault(); });
document.addEventListener("copy", e => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !e.clipboardData) return;
  const n = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  if (!n || n.closest(ZONE_COPIABLE) || !n.closest(ZONE_PROTEGEE)) return;
  e.clipboardData.setData("text/plain", sel.toString() + "\n\nSource : " + location.href.split("?")[0] + " — © tous droits réservés");
  e.preventDefault();
});
/* Pas d'affichage dans le cadre (iframe) d'un autre site */
(function () {
  if (window.top === window.self || location.protocol === "file:") return;
  let memeSite = false;
  try { memeSite = window.top.location.hostname === location.hostname; } catch (e) { memeSite = false; }
  if (!memeSite) { try { window.top.location.href = location.href; } catch (e) { document.documentElement.style.display = "none"; } }
})();

/* Installation sur le téléphone : service worker PRUDENT (sw.js : réseau d'abord pour les pages et les données).
   Seulement en https (jamais en file: pendant les tests locaux). */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    try { navigator.serviceWorker.register("/outils-pratiques-tunisie/sw.js", { scope: "/outils-pratiques-tunisie/" }).catch(() => {}); } catch (e) { /* rien : le site marche sans */ }
  });
}

/* Lien discret vers l'annuaire gratuit des comptables, sous chaque résultat (décision d'Ahmed, 05/10/2026).
   Le cadre (#lien-pro) est caché dans la page (attribut hidden) ; chaque calculateur appelle lienPro(true)
   seulement quand un résultat est calculé. Clic compté (anonyme) dans GoatCounter : événement « lien-comptables/<calculateur> ». */
function lienPro(visible) {
  const b = document.getElementById("lien-pro");
  if (b) b.hidden = !visible;
}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[data-compteur]");
  if (!a) return;
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: a.dataset.compteur, title: a.dataset.compteur.startsWith("lien-site/") ? "Bouton Trouver un comptable" : "Clic vers l'annuaire des comptables", event: true }); } catch (x) { /* rien : le lien marche sans */ }
});

/* >>> vidéo de présentation : page video/ partagée par le bouton « Partager » (outil vidéos d'Ahmed) */
window.VIDEO_SITE = {"base": "/outils-pratiques-tunisie/", "defaut": "fr", "nom": {"fr": "Outils pratiques Tunisie", "ar": "أدوات عملية تونس"}};
/* Bouton « Partager » (demande d'Ahmed, octobre 2026) : partage un LIEN vers la page vidéo du site (qui montre la vidéo
   de présentation, avec un gros bouton « Ouvrir le site ») + l'adresse du site dans le texte. WhatsApp et Facebook
   affichent l'aperçu de la page vidéo (grande image, vidéo lisible sur Facebook). Menu de partage du téléphone, sinon WhatsApp.
   Espace professionnels des annuaires : page « video-pro/ ». Réglages : window.VIDEO_SITE (juste au-dessus). */
(function () {
  var S = window.VIDEO_SITE, ORIGINE = "https://ah6259.github.io";
  function langue() { return document.documentElement.lang || S.defaut; }
  function M(o) { return o[langue()] || o[S.defaut] || o.fr; }
  // page vidéo à partager (et page du site correspondante) selon la page où l'on est
  window.pageVideo = function () {
    var chemin = location.pathname, pro = false;
    for (var i = 0; i < (S.pro || []).length; i++) if (chemin.indexOf(S.base + S.pro[i]) === 0) pro = true;
    var l = langue(), q = l !== S.defaut ? "?lang=" + l : "";
    return { page: ORIGINE + S.base + (pro ? "video-pro/" : "video/") + q, site: ORIGINE + S.base + (pro ? S.site_pro : "") + q + (pro ? (S.ancre_pro || "") : ""),
             titre: M(pro ? S.titre_pro : S.nom) };
  };
  window.partagerLien = function (titre, site) {
    var v = window.pageVideo(), t = titre || v.titre;
    if (site) v.site = site;
    var texte = t + "\n" + M({ fr: "Le site : ", ar: "الموقع: ", en: "The website: " }) + v.site + "\n" + M({ fr: "Regardez la vidéo :", ar: "شاهد الفيديو:", en: "Watch the video:" });
    function whatsapp() { window.open("https://wa.me/?text=" + encodeURIComponent(texte + " " + v.page), "_blank", "noopener"); return "whatsapp"; }
    if (navigator.share) {
      return navigator.share({ title: t, text: texte, url: v.page }).then(function () { return "lien"; }, function (e) {
        return e && e.name === "AbortError" ? "annule" : whatsapp();
      });
    }
    return Promise.resolve(whatsapp());
  };
  // page vidéo : textes dans la langue de la page (data-vfr / data-var / data-ven), vidéo de la langue (data-src-fr…)
  function traduire() {
    var l = langue();
    var el = document.querySelectorAll("[data-vfr]");
    for (var i = 0; i < el.length; i++) { var t = el[i].getAttribute("data-v" + l) || el[i].getAttribute("data-v" + S.defaut); if (t && el[i].textContent !== t) el[i].textContent = t; }
    var v = document.querySelector(".video-lecteur");
    if (v) {
      var s = v.getAttribute("data-src-" + l) || v.getAttribute("data-src-defaut") || v.getAttribute("src");
      if (!v.getAttribute("data-src-defaut")) v.setAttribute("data-src-defaut", v.getAttribute("src"));
      if (v.getAttribute("src") !== s) v.setAttribute("src", s);
      if (!v.getAttribute("data-poster-defaut")) v.setAttribute("data-poster-defaut", v.getAttribute("poster"));
      var po = v.getAttribute("data-poster-" + l) || v.getAttribute("data-poster-defaut");
      if (v.getAttribute("poster") !== po) v.setAttribute("poster", po);
    }
    // lien discret « Vidéo de présentation » en bas de l'accueil et de À propos -> la page vidéo
    var p = location.pathname.replace(/index\.html$/, "");
    if (p === S.base || p === S.base + "a-propos/") {
      var b = document.getElementById("lien-video");
      if (!b) {
        b = document.createElement("p"); b.id = "lien-video"; b.className = "lien-video"; b.appendChild(document.createElement("a"));
        var m = document.querySelector("main"); if (m) m.insertAdjacentElement("afterend", b); else document.body.appendChild(b);
      }
      b.firstChild.href = S.base + "video/" + (l !== S.defaut ? "?lang=" + l : "");
      b.firstChild.textContent = M({ fr: "Vidéo de présentation", ar: "الفيديو التقديمي", en: "Presentation video" });
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-partager-video]");
    if (!b) return;
    e.preventDefault();
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "partage" + location.pathname.replace(S.base, "/"), title: "Partage", event: true }); } catch (x) {}
    window.partagerLien();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(traduire, 0); }); else setTimeout(traduire, 0);
  document.addEventListener("langue", function () { setTimeout(traduire, 0); });
  try { new MutationObserver(function () { setTimeout(traduire, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); } catch (x) {}
})();
/* <<< vidéo de présentation */
