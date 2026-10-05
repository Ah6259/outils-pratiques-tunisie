/* Outils pratiques Tunisie — crédit immobilier et auto (mensualité, coût total, tableau d'amortissement).
   Tout est calculé dans le navigateur : aucune donnée n'est envoyée.
   Formule classique des prêts à échéances constantes : M = C × r / (1 − (1 + r)^−n), r = taux annuel / 12. */

const REGLES_CREDIT = {
  verifie: "05/10/2026",
  // Taux moyen du marché monétaire (TMM) publié par la Banque centrale de Tunisie (page d'accueil, « Principaux taux »).
  // Relevé à la main le 05/10/2026 : « Taux moyen du marché monétaire (TMM) du mois de Septembre 2026 : 7,00000 % ».
  // Conditions BCT : citation exacte + site cité comme source + lien qui s'ouvre dans une nouvelle fenêtre.
  tmm: { taux: 7.00, mois: "2026-09", source: "https://www.bct.gov.tn/" },
  tmmValableJours: 75,        // au-delà (date du visiteur), la page invite à vérifier le dernier TMM publié
  dureeMaxMois: 600           // garde-fou de saisie (50 ans)
};

const millimeC = v => Math.round(v * 1000 + (v >= 0 ? 1e-7 : -1e-7)) / 1000;

/* Mensualité hors assurance (non arrondie) */
function mensualiteCredit(capital, tauxAnnuelPct, nMois) {
  if (!(capital > 0) || !(nMois > 0)) return 0;
  const r = tauxAnnuelPct / 100 / 12;
  if (r <= 0) return capital / nMois;
  return capital * r / (1 - Math.pow(1 + r, -nMois));
}

/* Taux annuel retenu : fixe, ou TMM + marge (taux variable supposé constant) */
function tauxCredit(mode, tauxFixe, marge, tmm) {
  const t = mode === "tmm" ? (tmm ?? REGLES_CREDIT.tmm.taux) + (marge || 0) : (tauxFixe || 0);
  return Math.max(0, t);
}

/* Tableau d'amortissement : chaque ligne arrondie au millime, la dernière solde exactement le capital restant */
function amortissement(capital, tauxAnnuelPct, nMois, assuranceMois = 0) {
  const lignes = [];
  if (!(capital > 0) || !(nMois > 0)) return lignes;
  const r = tauxAnnuelPct / 100 / 12;
  const m = millimeC(mensualiteCredit(capital, tauxAnnuelPct, nMois));
  let reste = millimeC(capital);
  for (let k = 1; k <= nMois; k++) {
    const interets = millimeC(reste * r);
    let part = millimeC(m - interets);
    if (k === nMois || part > reste) part = reste;
    reste = millimeC(reste - part);
    lignes.push({ mois: k, interets, capital: part, assurance: assuranceMois, echeance: millimeC(interets + part + assuranceMois), reste });
  }
  return lignes;
}

/* Calcul complet. prix = montant du bien ; apport = argent personnel ; assurancePct = % par an du capital emprunté */
function calculCredit({ prix = 0, apport = 0, duree = 0, unite = "ans", mode = "fixe", tauxFixe = 0, marge = 0, tmm, assurancePct = 0 } = {}) {
  const capital = millimeC(Math.max(0, (+prix || 0) - Math.max(0, +apport || 0)));
  let n = Math.round(Math.max(0, +duree || 0) * (unite === "ans" ? 12 : 1));
  n = Math.min(n, REGLES_CREDIT.dureeMaxMois);
  const taux = tauxCredit(mode, +tauxFixe, +marge, tmm);
  const assuranceMois = n > 0 ? millimeC(capital * Math.max(0, +assurancePct || 0) / 100 / 12) : 0;   // pas de durée = pas d'assurance
  const lignes = amortissement(capital, taux, n, assuranceMois);
  const mensualite = lignes.length ? lignes[0].interets + lignes[0].capital : 0;
  const interets = millimeC(lignes.reduce((s, l) => s + l.interets, 0));
  const assurance = millimeC(assuranceMois * lignes.length);
  return {
    capital, mois: n, taux,
    mensualite: millimeC(mensualite), assuranceMois, mensualiteTotale: millimeC(mensualite + assuranceMois),
    interets, assurance, cout: millimeC(interets + assurance),
    totalRembourse: millimeC(capital + interets + assurance),
    lignes
  };
}

/* Le TMM affiché est-il encore récent pour le visiteur ? (fin du mois de référence + tmmValableJours) */
function tmmRecent(aujourdhui = new Date()) {
  const [a, m] = REGLES_CREDIT.tmm.mois.split("-").map(Number);
  const finMois = new Date(a, m, 0);           // dernier jour du mois de référence
  return (aujourdhui - finMois) / 864e5 <= REGLES_CREDIT.tmmValableJours;
}

if (typeof module !== "undefined") module.exports = { REGLES_CREDIT, mensualiteCredit, tauxCredit, amortissement, calculCredit, tmmRecent };
