/* Outils pratiques Tunisie — retenue à la source (montant brut ⇄ net payé ⇄ retenue).
   Tout est calculé dans le navigateur : aucune donnée n'est envoyée. Ce site ne fabrique AUCUN certificat :
   depuis le 1er janvier 2026, le certificat de retenue à la source s'établit sur la plateforme officielle TEJ.
   Taux = tableau officiel des opérations du cahier des charges TEJ de la Direction générale des impôts (septembre 2026),
   qui reprend l'article 52 du Code de l'IRPP et de l'IS. Règle de calcul officielle : retenue = montant TTC × taux ;
   net servi = TTC − retenue − retenue sur la TVA. */

const REGLES_RS = {
  verifie: "05/10/2026",
  source: "https://jibaya.tn/blog/plateforme-de-transfert-et-echange-des-donnees-fiscales-tej/",   // cahier des charges RS TEJ, 09/2026
  tej: "https://tej.finances.gov.tn",
  seuilAchats: 1000,           // DT, TVA comprise : achats de biens et services (codes RS7_000001 à 3)
  tauxTVA: [0, 7, 13, 19],     // taux de TVA du cahier des charges TEJ
  rsTVA: [0, 25, 100],         // retenue sur la TVA : 25 % (RSTVA25) ; 100 % = opérations avec des non-résidents (RSTVA100)
  amende: { taux: 0.30, minimum: 50 },   // certificat délivré hors plateforme : 30 % de la retenue, au moins 50 DT par attestation
  // id, code TEJ, taux %, seuil (achats ≥ 1 000 DT TTC), tva (la TVA peut-elle s'appliquer), libellés FR / AR
  operations: [
    ["loyer", "RS1_000002", 10, false, true, "Loyers versés à un résident", "معينات الكراء المدفوعة لمقيم"],
    ["hotel", "RS1_000001", 5, false, true, "Loyers d'hôtels", "معينات كراء النزل"],
    ["hon-reel", "RS2_000002", 3, false, true, "Honoraires — prestataire au régime réel", "أتعاب — مسدي خدمات خاضع للنظام الحقيقي"],
    ["hon-forfait", "RS2_000001", 10, false, true, "Honoraires, commissions, courtages — prestataire au forfait", "أتعاب وعمولات وسمسرة — مسدي خدمات خاضع للنظام التقديري"],
    ["performance", "RS2_000003", 10, false, true, "Rémunérations de performance", "المكافآت مقابل الأداء"],
    ["artistes", "RS2_000004", 5, false, true, "Artistes, créateurs, droits d'auteur", "الفنانون والمبدعون وحقوق المؤلف"],
    ["achats", "RS7_000001", 1.5, true, true, "Achats de biens et services ≥ 1 000 DT (cas général)", "شراءات سلع وخدمات ≥ 1000 دينار (الحالة العامة)"],
    ["achats-is15", "RS7_000002", 1, true, true, "Achats ≥ 1 000 DT — fournisseur à l'IS au taux de 15 %", "شراءات ≥ 1000 دينار — مزوّد خاضع للضريبة على الشركات بنسبة 15 %"],
    ["achats-is10", "RS7_000003", 0.5, true, true, "Achats ≥ 1 000 DT — fournisseur à l'IS 10 % ou déduction des 2/3", "شراءات ≥ 1000 دينار — مزوّد بنسبة 10 % أو بطرح الثلثين"],
    ["telecom-pp", "RS7_000004", 1.5, false, true, "Commissions des distributeurs agréés télécom (personne physique)", "عمولات الموزعين المعتمدين للاتصالات (شخص طبيعي)"],
    ["telecom-pm", "RS7_000005", 1, false, true, "Commissions des distributeurs agréés télécom (société)", "عمولات الموزعين المعتمدين للاتصالات (شخص معنوي)"],
    ["livraison", "RS7_000007", 3, false, true, "Sommes versées par les sociétés de livraison aux vendeurs en ligne", "مبالغ تدفعها شركات التوصيل للبائعين عبر الإنترنت"],
    ["occasionnel", "RS10_000004", 15, false, false, "Travail occasionnel hors activité principale", "عمل عرضي خارج النشاط الأصلي"],
    ["jetons", "RS8_000001", 20, false, false, "Jetons de présence (résidents)", "منح الحضور (مقيمون)"],
    ["non-resident", "RS9_000001", 15, false, true, "Rémunérations à un non-résident non établi", "أجور مدفوعة لغير مقيم وغير مستقر"],
    ["immeuble", "RS6_000002", 2.5, false, false, "Vente d'un immeuble (vendeur résident)", "التفويت في عقار (بائع مقيم)"],
    ["dividendes", "RS5_000001", 10, false, false, "Dividendes (personne physique résidente)", "مرابيح الأسهم (شخص طبيعي مقيم)"],
    ["interets", "RS3_000001", 20, false, false, "Intérêts et revenus de capitaux mobiliers (résident)", "فوائد ومداخيل رؤوس الأموال المنقولة (مقيم)"]
  ].map(([id, code, taux, seuil, tva, fr, ar]) => ({ id, code, taux, seuil, tva, fr, ar }))
};

const mil = v => Math.round(v * 1000 + (v >= 0 ? 1e-7 : -1e-7)) / 1000;
const operationRS = id => REGLES_RS.operations.find(o => o.id === id) || REGLES_RS.operations[0];

/* Calcul à partir du montant hors taxe */
function depuisHT(ht, op, tva, rsTva) {
  const v = op.tva ? (tva || 0) : 0, rt = op.tva && v ? (rsTva || 0) : 0;
  ht = mil(Math.max(0, ht || 0));
  const mTVA = mil(ht * v / 100), ttc = mil(ht + mTVA);
  const sousSeuil = op.seuil && ttc < REGLES_RS.seuilAchats;
  const rs = sousSeuil ? 0 : mil(ttc * op.taux / 100);
  const retTVA = mil(mTVA * rt / 100);
  return { op, ht, tva: v, montantTVA: mTVA, ttc, taux: sousSeuil ? 0 : op.taux, sousSeuil, rs, rsTva: rt, retenueTVA: retTVA,
           net: mil(ttc - rs - retTVA), certificat: mil(rs + retTVA) };
}

/* sens = "ht" | "ttc" | "net" : quel montant l'utilisateur connaît */
function calculRetenue({ montant = 0, sens = "ht", operation = "loyer", tva = 0, rsTva = 0 } = {}) {
  const op = operationRS(operation);
  const m = Math.max(0, +montant || 0);
  const v = op.tva ? (+tva || 0) : 0, rt = op.tva && v ? (+rsTva || 0) : 0;
  if (sens === "ttc") return depuisHT(m / (1 + v / 100), op, v, rt);
  if (sens === "net") {
    // net = HT × [(1 + v)(1 − t) − v × rt]  ->  HT = net / [...]
    const coef = t => (1 + v / 100) * (1 - t / 100) - (v / 100) * (rt / 100);
    let r = depuisHT(m / coef(op.taux), op, v, rt);
    if (op.seuil && r.sousSeuil) r = depuisHT(m / coef(0), op, v, rt);   // sous le seuil : pas de retenue
    // ajuste au millime près pour retomber exactement sur le net demandé
    for (const pas of [0.001, -0.001, 0.002, -0.002]) {
      if (r.net === mil(m)) break;
      const essai = depuisHT(r.ht + pas, op, v, rt);
      if (Math.abs(essai.net - m) < Math.abs(r.net - m)) r = essai;
    }
    return r;
  }
  return depuisHT(m, op, v, rt);
}

if (typeof module !== "undefined") module.exports = { REGLES_RS, operationRS, calculRetenue, depuisHT };
