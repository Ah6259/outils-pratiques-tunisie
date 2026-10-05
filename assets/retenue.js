/* Script de la page retenue-source (sorti de la page pour la politique de sécurité CSP) */
(function () {
  const $ = id => document.getElementById(id);
  const pct = v => iso(String(v).replace(".", ",") + " %");

  function remplirListes() {
    const choix = $("operation").value || "hon-reel";   // par défaut : l'exemple officiel du cahier des charges TEJ
    $("operation").innerHTML = REGLES_RS.operations.map(o =>
      `<option value="${o.id}">${iso(String(o.taux).replace(".", ",") + " %")} · ${T(o.fr, o.ar)}</option>`).join("");
    $("operation").value = choix;
    $("taux-liste").innerHTML = `<thead><tr><th>${T("Opération", "العملية")}</th><th>${T("Taux", "النسبة")}</th><th>${T("Code TEJ", "رمز TEJ")}</th></tr></thead><tbody>` +
      REGLES_RS.operations.map(o => `<tr><td style="white-space:normal">${T(o.fr, o.ar)}</td><td>${pct(o.taux)}</td><td>${iso(o.code)}</td></tr>`).join("") +
      `<tr><td style="white-space:normal">${T("Retenue sur la TVA (cas général / non-résidents)", "الخصم من الأداء على القيمة المضافة (الحالة العامة / غير المقيمين)")}</td><td>${pct(25)} / ${pct(100)}</td><td>${iso("RSTVA25 / RSTVA100")}</td></tr></tbody>`;
  }

  function calculer() {
    const op = operationRS($("operation").value);
    $("bloc-tva").classList.toggle("cache", !op.tva);
    const r = calculRetenue({
      montant: Math.max(0, parseFloat($("montant").value) || 0), sens: choixValeur("sens"), operation: op.id,
      tva: +$("tva").value, rsTva: +$("rstva").value
    });
    $("grand").textContent = dt(r.certificat);
    $("resume").innerHTML = T(
      `<span>Net à payer : <b>${dt(r.net)}</b></span><span>Taux : <b>${pct(r.taux)}</b></span><span>Code TEJ : <b>${iso(op.code)}</b></span>`,
      `<span>الصافي للدفع: <b>${dt(r.net)}</b></span><span>النسبة: <b>${pct(r.taux)}</b></span><span>رمز TEJ: <b>${iso(op.code)}</b></span>`);
    if (r.sousSeuil) $("resume").innerHTML += T(
      `<span>Moins de ${dt(REGLES_RS.seuilAchats)} TVA comprise : <b>pas de retenue</b>.</span>`,
      `<span>أقل من ${dt(REGLES_RS.seuilAchats)} بكل الأداءات: <b>لا خصم</b>.</span>`);

    const part = v => r.ttc > 0 ? v / r.ttc * 100 : 0;
    const parts = [["b-net", r.net, T("Net payé", "الصافي")], ["b-rs", r.rs, T("Retenue", "الخصم")]];
    if (r.retenueTVA > 0) parts.push(["b-rstva", r.retenueTVA, T("Retenue TVA", "خصم الأداء")]);
    $("barre").innerHTML = r.ttc > 0 ? parts.map(([c, v]) => `<span class="${c}" style="width:${part(v)}%"></span>`).join("") : "";
    $("legende").innerHTML = r.ttc > 0 ? parts.map(([c, v, n]) => `<span><i class="${c}"></i>${n} ${iso(part(v).toFixed(1).replace(".", ",") + " %")}</span>`).join("") : "";

    const rows = [[T("Montant hors TVA", "المبلغ دون أداء"), dt(r.ht)]];
    if (op.tva) rows.push([T("TVA ", "الأداء على القيمة المضافة ") + pct(r.tva), dt(r.montantTVA)], [T("Montant TVA comprise", "المبلغ بكل الأداءات"), dt(r.ttc)]);
    rows.push([T("Retenue à la source ", "الخصم من المورد ") + pct(r.taux), iso("− " + dt(r.rs)), "m"]);
    if (r.retenueTVA > 0) rows.push([T("Retenue sur la TVA ", "الخصم من الأداء ") + pct(r.rsTva), iso("− " + dt(r.retenueTVA)), "m"]);
    rows.push([T("Net payé au bénéficiaire", "الصافي المدفوع للمستفيد"), dt(r.net), "total"]);
    $("tableau").innerHTML = rows.map(([a, b, cl]) => `<tr${cl ? ` class="${cl}"` : ""}><td>${a}</td><td${cl === "m" ? ' class="moins"' : ""}>${b}</td></tr>`).join("");

    const p = $("partage");
    p.innerHTML = ICONE_WHATSAPP + T("Partager sur WhatsApp", "شارك على واتساب");
    p.href = lienWhatsApp(T(
      `Retenue à la source (${op.fr}, ${String(r.taux).replace(".", ",")} %) : ${dt(r.certificat)} sur ${dt(r.ttc)}, net payé ${dt(r.net)}. Calculez la vôtre :`,
      `الخصم من المورد (${op.ar}، ${iso(String(r.taux).replace(".", ",") + " %")}): ${dt(r.certificat)} من ${dt(r.ttc)}، الصافي ${dt(r.net)}. احسب الخصم:`));
    lienPro(r.ttc > 0);
  }

  $("montant").addEventListener("input", calculer);
  ["operation", "tva", "rstva"].forEach(id => $(id).addEventListener("change", calculer));
  document.addEventListener("recalcul", calculer);
  document.addEventListener("langue", () => { remplirListes(); calculer(); });
})();
