/* Script de la page salaire-net (sorti de la page pour la politique de sécurité CSP) */
function famille(){ return { chef: document.getElementById("chef").checked, enfants: +document.getElementById("enfants").value }; }
function lignes(rows){ return rows.map(([a,b,cl]) => `<tr${cl?` class="${cl}"`:""}><td>${a}</td><td${cl==="m"?' class="moins"':""}>${b}</td></tr>`).join(""); }
function calculer(){
  const m = Math.max(0, parseFloat(document.getElementById("montant").value) || 0);
  const sens = choixValeur("sens");
  const r = sens === "net" ? netVersBrut(m, famille()) : brutVersNet(m, famille());
  document.getElementById("titre-res").textContent = sens === "net" ? T("Salaire brut nécessaire par mois","الأجر الخام الضروري شهريًا") : T("Votre salaire net par mois","أجرك الصافي شهريًا");
  document.getElementById("grand").textContent = dt(sens === "net" ? r.brut : r.net);
  const pc = v => r.brut > 0 ? (v / r.brut * 100) : 0;
  const parts = [["b-net", r.net, T("Net","الصافي")], ["b-cnss", r.cnss, "CNSS"], ["b-irpp", r.irpp, T("Impôt","الضريبة")], ["b-css", r.css, "CSS"]];
  document.getElementById("barre").innerHTML = parts.map(([c, v]) => `<span class="${c}" style="width:${pc(v)}%"></span>`).join("");
  document.getElementById("legende").innerHTML = parts.map(([c, v, n]) =>
    `<span><i class="${c}"></i>${n} ${iso(pc(v).toFixed(1).replace(".", ",") + " %")}</span>`).join("");
  document.getElementById("tableau").innerHTML = lignes([
    [T("Salaire brut","الأجر الخام"), dt(r.brut)],
    [T("CNSS (9,68 %)","الضمان الاجتماعي (9,68 %)"), "− " + dt(r.cnss), "m"],
    [T("Impôt sur le revenu (IRPP)","الضريبة على الدخل"), "− " + dt(r.irpp), "m"],
    [T("Contribution sociale (CSS)","المساهمة الاجتماعية التضامنية"), "− " + dt(r.css), "m"],
    [T("Salaire net","الأجر الصافي"), dt(r.net), "total"]
  ]);
  const a = r.an;
  document.getElementById("detail").innerHTML = lignes([
    [T("Brut annuel","الخام السنوي"), dt(a.brut)],
    [T("− CNSS","− الضمان الاجتماعي"), dt(a.cnss)],
    [T("− Frais professionnels","− المصاريف المهنية"), dt(a.fraisPro)],
    [T("− Déductions famille","− طرح العائلة"), dt(a.deductions)],
    [T("Revenu imposable annuel","الدخل السنوي الخاضع للضريبة"), dt(a.imposable), "total"],
    ...r.tranches.map(t => [T("Tranche ","شريحة ") + iso(ent(t.de) + " → " + ent(t.a) + " DT · " + Math.round(t.taux*100) + " %"), dt(t.impot)]),
    [T("Impôt annuel","الضريبة السنوية"), dt(a.irpp), "total"],
    [T("CSS annuelle","المساهمة السنوية"), dt(a.css)]
  ]);
  const p = document.getElementById("partage");
  p.innerHTML = ICONE_WHATSAPP + T("Partager sur WhatsApp", "شارك على واتساب");
  p.href = lienWhatsApp(
    T(`Salaire brut ${dt(r.brut)} = net ${dt(r.net)} par mois en Tunisie (2026). Calculez le vôtre :`,
      `أجر خام ${dt(r.brut)} = صافي ${dt(r.net)} شهريًا في تونس (2026). احسب أجرك:`));
  lienPro(m > 0);
}
["montant","chef","enfants"].forEach(id => document.getElementById(id).addEventListener("input", calculer));
document.getElementById("chef").addEventListener("change", calculer);
document.addEventListener("recalcul", calculer);
document.addEventListener("langue", calculer);
