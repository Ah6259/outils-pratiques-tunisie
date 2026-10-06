/* Script de la page credit (sorti de la page pour la politique de sécurité CSP) */
(function () {
  const $ = id => document.getElementById(id);
  const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MOIS_AR = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const pct = v => iso((Math.round(v * 100) / 100).toFixed(2).replace(".", ",") + " %");
  const nombre = id => { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; };
  $("tmm").value = REGLES_CREDIT.tmm.taux.toFixed(2);

  function moisTMM() {
    const [a, m] = REGLES_CREDIT.tmm.mois.split("-").map(Number);
    return T(`${MOIS_FR[m - 1]} ${a}`, `${MOIS_AR[m - 1]} ${iso(a)}`);
  }
  function lignes(rows) {
    return rows.map(([a, b, cl]) => `<tr${cl ? ` class="${cl}"` : ""}><td>${a}</td><td${cl === "m" ? ' class="moins"' : ""}>${b}</td></tr>`).join("");
  }
  function duree(n) {
    const a = Math.floor(n / 12), m = n % 12;
    const fr = [a ? `${a} an${a > 1 ? "s" : ""}` : "", m ? `${m} mois` : ""].filter(Boolean).join(" et ") || "0 mois";
    const ar = [a ? `${iso(a)} ${a > 2 && a < 11 ? "سنوات" : "سنة"}` : "", m ? `${iso(m)} ${m > 2 && m < 11 ? "أشهر" : "شهر"}` : ""].filter(Boolean).join(" و") || iso(0) + " شهر";
    return T(fr, ar);
  }

  function calculer() {
    const mode = choixValeur("mode");
    $("bloc-fixe").classList.toggle("cache", mode === "tmm");
    $("bloc-tmm").classList.toggle("cache", mode !== "tmm");
    $("tmm-info").innerHTML = T(
      `<b>TMM de ${moisTMM()} : ${pct(REGLES_CREDIT.tmm.taux)}</b>, publié par la Banque centrale de Tunisie (<a href="${REGLES_CREDIT.tmm.source}" target="_blank" rel="noopener">bct.gov.tn</a>), relevé le ${REGLES_CREDIT.verifie}. Vous pouvez le modifier.`,
      `<b>TMM لشهر ${moisTMM()}: ${pct(REGLES_CREDIT.tmm.taux)}</b>، نشره البنك المركزي التونسي (<a href="${REGLES_CREDIT.tmm.source}" target="_blank" rel="noopener">bct.gov.tn</a>)، تم الاطلاع عليه في ${iso(REGLES_CREDIT.verifie)}. يمكنك تغييره.`);
    const vieux = !tmmRecent(new Date());
    $("tmm-vieux").classList.toggle("cache", !vieux);
    if (vieux) $("tmm-vieux").innerHTML = T(
      `Le TMM change chaque mois : vérifiez la dernière valeur publiée sur <a href="${REGLES_CREDIT.tmm.source}" target="_blank" rel="noopener">bct.gov.tn</a> et corrigez-la ci-dessus.`,
      `يتغير TMM كل شهر: تحقق من آخر قيمة منشورة على <a href="${REGLES_CREDIT.tmm.source}" target="_blank" rel="noopener">bct.gov.tn</a> وصحّحها أعلاه.`);

    if (window.porteCalcul && !porteCalcul("credit")) return;   // Pass Journée : exemple + 1 calcul gratuit par jour (assets/pass.js)
    const r = calculCredit({
      prix: Math.max(0, nombre("prix")), apport: Math.max(0, nombre("apport")),
      duree: Math.max(0, nombre("duree")), unite: choixValeur("unite"), mode,
      tauxFixe: Math.max(0, nombre("taux")), marge: Math.max(0, nombre("marge")), tmm: Math.max(0, nombre("tmm")),
      assurancePct: Math.max(0, nombre("assurance"))
    });

    $("grand").textContent = dt(r.mensualiteTotale);
    $("resume").innerHTML = r.mois && r.capital
      ? T(`<span>Emprunt <b>${dt(r.capital)}</b></span><span>sur <b>${duree(r.mois)}</b></span><span>à <b>${pct(r.taux)}</b> par an</span>`,
          `<span>قرض <b>${dt(r.capital)}</b></span><span>على <b>${duree(r.mois)}</b></span><span>بنسبة <b>${pct(r.taux)}</b> سنويًا</span>`)
      : T("<span>Indiquez un montant à emprunter (prix supérieur à l'apport) et une durée.</span>",
          "<span>أدخل مبلغًا للاقتراض (ثمن أكبر من التمويل الذاتي) ومدة.</span>");

    const total = r.totalRembourse || 0;
    const part = v => total > 0 ? v / total * 100 : 0;
    const parts = [["b-cap", r.capital, T("Capital", "رأس المال")], ["b-int", r.interets, T("Intérêts", "الفوائد")]];
    if (r.assurance > 0) parts.push(["b-ass", r.assurance, T("Assurance", "التأمين")]);
    $("barre").innerHTML = total > 0 ? parts.map(([c, v]) => `<span class="${c}" style="width:${part(v)}%"></span>`).join("") : "";
    $("legende").innerHTML = total > 0 ? parts.map(([c, v, n]) => `<span><i class="${c}"></i>${n} ${iso(part(v).toFixed(1).replace(".", ",") + " %")}</span>`).join("") : "";

    const rows = [
      [T("Mensualité hors assurance", "القسط دون تأمين"), dt(r.mensualite)],
    ];
    if (r.assuranceMois > 0) rows.push([T("Assurance par mois", "التأمين شهريًا"), dt(r.assuranceMois)]);
    rows.push(
      [T("Montant emprunté", "المبلغ المقترض"), dt(r.capital)],
      [T("Total des intérêts", "مجموع الفوائد"), dt(r.interets), "m"]);
    if (r.assurance > 0) rows.push([T("Total de l'assurance", "مجموع التأمين"), dt(r.assurance), "m"]);
    rows.push([T("Coût total du crédit", "الكلفة الجملية للقرض"), dt(r.cout), "m"],
              [T("Total remboursé", "المجموع المسدَّد"), dt(r.totalRembourse), "total"]);
    $("tableau").innerHTML = lignes(rows);

    // tableau d'amortissement, avec une ligne de total à la fin de chaque année
    const ass = r.assuranceMois > 0;
    let h = `<thead><tr><th>${T("Mois", "الشهر")}</th><th>${T("Échéance", "القسط")}</th><th>${T("Intérêts", "الفوائد")}</th><th>${T("Capital", "رأس المال")}</th>${ass ? `<th>${T("Assurance", "التأمين")}</th>` : ""}<th>${T("Restant dû", "المتبقي")}</th></tr></thead><tbody>`;
    let annee = { e: 0, i: 0, c: 0 };
    r.lignes.forEach((l, k) => {
      h += `<tr><td>${iso(l.mois)}</td><td>${dt(l.echeance)}</td><td>${dt(l.interets)}</td><td>${dt(l.capital)}</td>${ass ? `<td>${dt(l.assurance)}</td>` : ""}<td>${dt(l.reste)}</td></tr>`;
      annee.e += l.echeance; annee.i += l.interets; annee.c += l.capital;
      if (l.mois % 12 === 0 || k === r.lignes.length - 1) {
        h += `<tr class="annee"><td>${T("Année ", "السنة ")}${iso(Math.ceil(l.mois / 12))}</td><td>${dt(annee.e)}</td><td>${dt(annee.i)}</td><td>${dt(annee.c)}</td>${ass ? "<td></td>" : ""}<td>${dt(l.reste)}</td></tr>`;
        annee = { e: 0, i: 0, c: 0 };
      }
    });
    $("amort").innerHTML = h + "</tbody>";

    const p = $("partage");
    p.innerHTML = ICONE_WHATSAPP + T("Partager sur WhatsApp", "شارك على واتساب");
    p.href = lienWhatsApp(T(
      `Crédit de ${dt(r.capital)} sur ${duree(r.mois)} à ${pct(r.taux)} : ${dt(r.mensualiteTotale)} par mois. Calculez le vôtre :`,
      `قرض بـ ${dt(r.capital)} على ${duree(r.mois)} بنسبة ${pct(r.taux)}: ${dt(r.mensualiteTotale)} شهريًا. احسب قرضك:`));
    lienPro(r.mensualiteTotale > 0);
  }

  ["prix", "apport", "duree", "taux", "tmm", "marge", "assurance"].forEach(id => $(id).addEventListener("input", calculer));
  document.addEventListener("recalcul", calculer);
  document.addEventListener("langue", calculer);
})();
