/* Langue (français / arabe), en-tête et pied de page communs, petites fonctions */
const MAJ = "05/10/2026";   // date de la dernière vérification des règles (afficher partout la même)

(function () {
  const html = document.documentElement;
  const racine = html.dataset.racine || "";
  let langue = "fr";
  try { langue = localStorage.getItem("langue") || (navigator.language || "").startsWith("ar") && "ar" || "fr"; } catch (e) {}
  const demande = new URLSearchParams(location.search).get("lang");
  if (demande === "ar" || demande === "fr") langue = demande;

  window.T = (fr, ar) => html.lang === "ar" ? ar : fr;

  function cadre() {
    const e = document.getElementById("entete");
    if (e) e.innerHTML = `
      <div class="wrap">
        <a class="logo" href="${racine || "./"}">
          <img class="logo-mark" src="${racine}assets/logo.svg" alt="" width="34" height="34">
          <span class="logo-nom">${T("Outils pratiques Tunisie", "أدوات عملية تونس")}
            <small>${T("Calculs gratuits · règles 2026", "حسابات مجانية · قواعد 2026")}</small></span>
        </a>
        <button class="langue" type="button">${T("العربية", "Français")}</button>
      </div>`;
    const p = document.getElementById("pied");
    if (p) p.innerHTML = `
      <div class="wrap">
        <div class="pied-logo"><img src="${racine}assets/logo.svg" alt="" width="24" height="24"> ${T("Outils pratiques Tunisie", "أدوات عملية تونس")}</div>
        <nav>
          <a href="${racine}salaire-net/">${T("Salaire brut ⇄ net", "الأجر الخام ⇄ الصافي")}</a>
          <a href="${racine}impot-revenu/">${T("Impôt sur le revenu", "الضريبة على الدخل")}</a>
          <a href="${racine}a-propos/">${T("À propos et méthode", "من نحن والمنهجية")}</a>
        </nav>
        <p>${T(`Règles vérifiées le ${MAJ} : loi de finances 2025 (barème de l'impôt), taux de la CNSS 2026.`,
               `قواعد تم التثبت منها في ${MAJ}: قانون المالية 2025 (جدول الضريبة)، نسب الضمان الاجتماعي 2026.`)}</p>
        <p>${T("Résultats indicatifs : ce site n'est pas un service officiel. Les calculs se font dans votre téléphone, aucune donnée n'est envoyée.",
               "نتائج تقريبية: هذا الموقع ليس خدمة رسمية. الحساب يتم في هاتفك، لا تُرسل أي معطيات.")}</p>
        <p>© 2026 Outils pratiques Tunisie — ${T("tous droits réservés.", "جميع الحقوق محفوظة.")}</p>
      </div>`;
    document.querySelectorAll(".langue").forEach(b =>
      b.addEventListener("click", () => appliquer(html.lang === "ar" ? "fr" : "ar")));
    document.querySelectorAll("[data-maj]").forEach(x => x.textContent = MAJ);
  }

  function appliquer(l) {
    html.lang = l; html.dir = l === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("langue", l); } catch (e) {}
    cadre();
    document.dispatchEvent(new Event("langue"));
  }
  document.addEventListener("DOMContentLoaded", () => appliquer(langue));
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
