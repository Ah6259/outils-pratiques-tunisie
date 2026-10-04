/* Langue (français / arabe) et petites fonctions communes */
(function () {
  const html = document.documentElement;
  let langue = "fr";
  try { langue = localStorage.getItem("langue") || (navigator.language || "").startsWith("ar") && "ar" || "fr"; } catch (e) {}
  const demande = new URLSearchParams(location.search).get("lang");
  if (demande === "ar" || demande === "fr") langue = demande;
  function appliquer(l) {
    html.lang = l; html.dir = l === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("langue", l); } catch (e) {}
    document.querySelectorAll(".langue").forEach(b => b.textContent = l === "ar" ? "Français" : "العربية");
    document.dispatchEvent(new Event("langue"));
  }
  window.T = (fr, ar) => html.lang === "ar" ? ar : fr;
  document.addEventListener("DOMContentLoaded", () => {
    appliquer(langue);
    document.querySelectorAll(".langue").forEach(b =>
      b.addEventListener("click", () => appliquer(html.lang === "ar" ? "fr" : "ar")));
  });
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
  return "https://wa.me/?text=" + encodeURIComponent(texte + " " + location.href);
}
