/* Script de la page auto-entrepreneur (sorti de la page pour la politique de sécurité CSP) */
(function () {
  const $ = id => document.getElementById(id);
  const ACT = [
    ["commerce", "Commerce", "التجارة"],
    ["services", "Services (hors professions libérales)", "الخدمات (باستثناء المهن الحرة)"],
    ["artisanat", "Artisanat, métiers", "الصناعات التقليدية والحرف"],
    ["industrie", "Petite industrie, fabrication", "الصناعة الصغرى والتصنيع"],
    ["liberale", "Profession libérale (médecin, avocat, consultant…)", "مهنة حرة (طبيب، محامٍ، مستشار…)"],
    ["agriculture", "Agriculture, pêche", "الفلاحة والصيد البحري"]
  ];
  const RAISONS = {
    nationalite: ["Le régime est réservé aux personnes de nationalité tunisienne.", "النظام مخصص للأشخاص من ذوي الجنسية التونسية."],
    individuel: ["L'activité doit être exercée seul(e), en personne physique (pas en société).", "يجب ممارسة النشاط بصفة فردية، كشخص طبيعي (لا في شكل شركة)."],
    activite: ["Les professions non commerciales (professions libérales) sont exclues.", "المهن غير التجارية (المهن الحرة) مستثناة."],
    plafond: [`Le chiffre d'affaires annuel ne doit pas dépasser ${dt(REGLES_AE.plafondCA)}.`, `يجب ألا يتجاوز رقم المعاملات السنوي ${dt(REGLES_AE.plafondCA)}.`],
    existence: ["Le régime vise les personnes qui n'ont pas déposé de déclaration d'existence avant l'inscription.", "النظام موجّه للأشخاص الذين لم يقدّموا تصريحًا في الوجود قبل التسجيل."],
    activiteV: ["L'agriculture et la pêche ne sont pas citées par la Direction générale des impôts : vérifiez sur le portail officiel.", "الفلاحة والصيد البحري غير مذكورة من قبل الإدارة العامة للأداءات: تحقق في البوابة الرسمية."],
    caV: ["Indiquez votre chiffre d'affaires annuel prévu.", "أدخل رقم المعاملات السنوي المتوقع."]
  };
  const ICONES = {
    oui: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>',
    non: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
    verifier: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5v.5"/></svg>'
  };

  function remplirListes() {
    const a = $("activite").value || "commerce", t = $("tranche").value || "1";
    $("activite").innerHTML = ACT.map(([v, fr, ar]) => `<option value="${v}">${T(fr, ar)}</option>`).join("");
    $("activite").value = a;
    $("tranche").innerHTML = REGLES_AE.cnssTns.tranches.map(([coef, , cot], i) =>
      `<option value="${i + 1}">${T(`Tranche ${i + 1} : ${dt(cot)} / trimestre`, `الشريحة ${iso(i + 1)}: ${dt(cot)} / ثلاثية`)}</option>`).join("");
    $("tranche").value = t;
  }

  function calculer() {
    // 1. éligibilité
    const e = eligibiliteAE({
      tunisien: choixValeur("tunisien") === "oui", seul: choixValeur("seul") === "oui",
      dejaDeclare: choixValeur("declare") === "oui", activite: $("activite").value,
      ca: $("ca").value === "" ? NaN : parseFloat($("ca").value)
    });
    const titres = {
      oui: T("Vous semblez éligible", "يبدو أنك معني بهذا النظام"),
      non: T("Vous n'êtes pas éligible", "لست معنيًا بهذا النظام"),
      verifier: T("À vérifier", "للتثبت")
    };
    const items = e.raisons.map(r => {
      const k = e.statut === "verifier" ? r + "V" : r;
      const t = RAISONS[k] || RAISONS[r];
      return `<li>${T(t[0], t[1])}</li>`;
    }).join("");
    const v = $("verdict");
    v.className = "verdict " + e.statut;
    v.innerHTML = ICONES[e.statut] + `<div><b>${titres[e.statut]}</b>` +
      (e.statut === "oui"
        ? T(`Conditions remplies d'après vos réponses. Confirmez sur le portail officiel <a href="${REGLES_AE.sources.portail}" target="_blank" rel="noopener">autoentrepreneur.tn</a>.`,
            `الشروط متوفرة حسب إجاباتك. تأكد في البوابة الرسمية <a href="${REGLES_AE.sources.portail}" target="_blank" rel="noopener">autoentrepreneur.tn</a>.`)
        : `<ul>${items}</ul>`) + "</div>";

    // 2. contribution
    const regime = choixValeur("regime");
    $("bloc-tranche").classList.toggle("cache", regime === "artisan");
    const c = contributionAE({ annee: +choixValeur("annee"), zone: choixValeur("zone"), regime, tranche: +$("tranche").value || 1 });
    $("grand").textContent = dt(c.total);
    $("resume").innerHTML = c.exoneree
      ? T(`<span><b>1re année : rien à payer.</b> Ensuite : ${dt(c.totalSansExoneration)} par an.</span>`,
          `<span><b>السنة الأولى: لا شيء للدفع.</b> بعدها: ${dt(c.totalSansExoneration)} سنويًا.</span>`)
      : (c.parPeriode === "mois"
        ? T(`<span>soit <b>${dt(c.total / 12)}</b> par mois</span><span>CNSS : <b>${dt(c.periode)}</b> par mois</span>`,
            `<span>أي <b>${dt(c.total / 12)}</b> شهريًا</span><span>الضمان الاجتماعي: <b>${dt(c.periode)}</b> شهريًا</span>`)
        : T(`<span>soit <b>${dt(c.total / 12)}</b> par mois</span><span>CNSS : <b>${dt(c.periode)}</b> par trimestre</span>`,
            `<span>أي <b>${dt(c.total / 12)}</b> شهريًا</span><span>الضمان الاجتماعي: <b>${dt(c.periode)}</b> في الثلاثية</span>`));
    const tot = c.total;
    const parts = [["b-impot", c.impot, T("Impôt", "الضريبة")], ["b-cnss", c.social, "CNSS"]];
    $("barre").innerHTML = tot > 0 ? parts.map(([cl, x]) => `<span class="${cl}" style="width:${x / tot * 100}%"></span>`).join("") : "";
    $("legende").innerHTML = tot > 0 ? parts.map(([cl, x, n]) => `<span><i class="${cl}"></i>${n} ${iso((x / tot * 100).toFixed(1).replace(".", ",") + " %")}</span>`).join("") : "";
    $("tableau").innerHTML = [
      [T("Impôt sur le revenu (forfait, TCL comprise)", "الضريبة على الدخل (جزافية، تشمل المعلوم على المؤسسات)"), dt(c.impot)],
      [T("Cotisation sociale CNSS", "مساهمة الضمان الاجتماعي"), dt(c.social)],
      [T("Contribution unique par an", "المساهمة الموحدة سنويًا"), dt(c.total), "total"]
    ].map(([a, b, cl]) => `<tr${cl ? ` class="${cl}"` : ""}><td>${a}</td><td>${b}</td></tr>`).join("");

    const p = $("partage");
    p.innerHTML = ICONE_WHATSAPP + T("Partager sur WhatsApp", "شارك على واتساب");
    p.href = lienWhatsApp(T(
      `Auto-entrepreneur en Tunisie : 1re année gratuite, puis ${dt(c.totalSansExoneration)} par an (impôt + CNSS). Vérifiez si vous êtes éligible :`,
      `المبادر الذاتي في تونس: السنة الأولى مجانية، ثم ${dt(c.totalSansExoneration)} سنويًا (ضريبة + ضمان اجتماعي). تحقق إن كنت معنيًا:`));
    lienPro(true);
  }

  $("ca").addEventListener("input", calculer);
  $("activite").addEventListener("change", calculer);
  $("tranche").addEventListener("change", calculer);
  document.addEventListener("recalcul", calculer);
  document.addEventListener("langue", () => { remplirListes(); calculer(); });
})();
