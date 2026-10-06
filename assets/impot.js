/* Script de la page impot-revenu (sorti de la page pour la politique de sécurité CSP) */
function calculer(){
  if (window.porteCalcul && !porteCalcul("impot-revenu")) return;   // Pass Journée : exemple + 1 calcul gratuit par jour (assets/pass.js)
  const rev = Math.max(0, parseFloat(document.getElementById("revenu").value) || 0);
  const r = irppAnnuel(rev), css = cssAnnuelle(rev);
  document.getElementById("grand").textContent = dt(r.total);
  const taux = rev > 0 ? (r.total / rev * 100).toFixed(1).replace(".", ",") : "0";
  document.getElementById("sous").textContent =
    T(`soit ${dt(r.total / 12)} par mois · taux moyen ${iso(taux + " %")} · + CSS ${dt(css)}`,
      `أي ${dt(r.total / 12)} شهريًا · النسبة المتوسطة ${iso(taux + " %")} · + المساهمة ${dt(css)}`);
  document.getElementById("tableau").innerHTML = r.detail.map(t =>
    `<tr><td>${iso(ent(t.de) + " → " + ent(t.a) + " DT · " + Math.round(t.taux*100) + " %")}</td><td>${dt(t.impot)}</td></tr>`).join("") +
    `<tr class="total"><td>${T("Total","المجموع")}</td><td>${dt(r.total)}</td></tr>`;
  const p = document.getElementById("partage");
  p.innerHTML = ICONE_WHATSAPP + T("Partager sur WhatsApp", "شارك على واتساب");
  p.href = lienWhatsApp(
    T(`Impôt sur le revenu en Tunisie pour ${dt(rev)} par an : ${dt(r.total)}. Calculez le vôtre :`,
      `الضريبة على الدخل في تونس لدخل ${dt(rev)} سنويًا: ${dt(r.total)}. احسب ضريبتك:`));
  lienPro(rev > 0);
}
document.getElementById("revenu").addEventListener("input", calculer);
document.addEventListener("langue", calculer);
