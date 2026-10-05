/* Outils pratiques Tunisie — régime de l'auto-entrepreneur : éligibilité et contribution unique.
   Tout est calculé dans le navigateur : aucune donnée n'est envoyée.
   Chaque montant vient d'une source OFFICIELLE (voir « sources ») ; ce qui n'est pas confirmé n'est pas calculé. */

const REGLES_AE = {
  verifie: "05/10/2026",
  texte: "Décret-loi n° 2020-33 du 10 juin 2020 relatif au régime de l'auto-entrepreneur, article 7 modifié par la loi de finances 2023",
  sources: {
    dgi: "https://jibaya.tn/questions-frequemment-posees/",   // Direction générale des impôts : « Quel est le régime fiscal de l'auto-entrepreneur ? »
    cnssTns: "https://www.cnss.tn/web/non-salarie/non_sal_asset_services/-/asset_publisher/w1WU/content/non_sal-secteur_-non_agr1_cotisations?convention=false&categorie=1&secteur=1&champAppli=1&servActif=2",
    cnssArtisans: "https://www.cnss.tn/web/non-salarie/non_sal_asset_services/-/asset_publisher/w1WU/content/non_sal-secteur_-non_agr5_cotisation?convention=false&categorie=1&secteur=1&champAppli=5&servActif=2",
    portail: "https://www.autoentrepreneur.tn/"
  },
  plafondCA: 75000,                 // DT par an (DGI)
  dureeAns: 4, renouvellementAns: 3, // 4 ans, renouvelable une seule fois 3 ans (DGI)
  premiereAnneeExoneree: true,       // exonéré de la contribution au titre de la 1re année d'inscription (DGI)
  impot: { communal: 200, autre: 100, partTCL: 0.20 },   // DT par an ; comprend la TCL (20 % de cet impôt) (DGI)
  // Cotisation sociale « première tranche » des travailleurs non salariés (CNSS, montants à partir du 2e trimestre 2026),
  // 14,71 % de la base trimestrielle. [coefficient du SMIG, base trimestrielle, cotisation trimestrielle]
  cnssTns: { taux: 0.1471, depuis: "2e trimestre 2026", tranches: [
    [1, 1600.200, 235.389], [1.5, 2400.300, 353.084], [2, 3200.400, 470.779], [3, 4800.600, 706.168], [4, 6400.800, 941.558],
    [6, 9601.200, 1412.337], [9, 14401.800, 2118.505], [12, 19202.400, 2824.673], [15, 24003.000, 3530.841], [18, 28803.600, 4237.010]
  ] },
  // Métiers et activités artisanales : régime de la loi n° 2002-32 (CNSS, montant publié « à partir de janvier 2026 »),
  // 7,5 % des 2/3 du SMIG mensuel.
  cnssArtisans: { taux: 0.075, baseMois: 338.666, mois: 25.400, depuis: "janvier 2026" }
};

/* Activités : d'après la DGI, « industrie, artisanat, métiers, commerce ou services autres que les professions non commerciales » */
const ACTIVITES_AE = {
  commerce: "oui", industrie: "oui", artisanat: "oui", services: "oui",
  liberale: "non",          // professions non commerciales (médecin, avocat, ingénieur-conseil…) : exclues
  agriculture: "verifier"   // non citée par la DGI : à vérifier sur le portail officiel
};

/* « Suis-je éligible ? » -> { statut: "oui" | "non" | "verifier", raisons: [codes] } */
function eligibiliteAE({ tunisien, seul, activite, ca, dejaDeclare } = {}) {
  const non = [], verifier = [];
  if (tunisien === false) non.push("nationalite");
  if (seul === false) non.push("individuel");
  const a = ACTIVITES_AE[activite];
  if (a === "non") non.push("activite");
  else if (a === "verifier" || a === undefined) verifier.push("activite");
  const c = +ca;
  if (!(c >= 0) || !isFinite(c)) verifier.push("ca");
  else if (c > REGLES_AE.plafondCA) non.push("plafond");
  if (dejaDeclare === true) non.push("existence");
  return { statut: non.length ? "non" : verifier.length ? "verifier" : "oui", raisons: non.length ? non : verifier };
}

/* « Combien vais-je payer ? » pour une année d'inscription donnée (1 = première année) */
function contributionAE({ annee = 2, zone = "communal", regime = "tns", tranche = 1 } = {}) {
  const exo = REGLES_AE.premiereAnneeExoneree && annee <= 1;
  const impot = exo ? 0 : (zone === "autre" ? REGLES_AE.impot.autre : REGLES_AE.impot.communal);
  let socialAn = 0, periode = 0, parPeriode = "trimestre";
  if (regime === "artisan") {
    periode = REGLES_AE.cnssArtisans.mois; parPeriode = "mois"; socialAn = Math.round(periode * 12 * 1000) / 1000;
  } else {
    const t = REGLES_AE.cnssTns.tranches[Math.min(Math.max(1, tranche | 0), REGLES_AE.cnssTns.tranches.length) - 1];
    periode = t[2]; socialAn = Math.round(periode * 4 * 1000) / 1000;
  }
  const social = exo ? 0 : socialAn;
  return { exoneree: exo, impot, social, periode: exo ? 0 : periode, parPeriode, total: Math.round((impot + social) * 1000) / 1000,
           totalSansExoneration: Math.round(((zone === "autre" ? REGLES_AE.impot.autre : REGLES_AE.impot.communal) + socialAn) * 1000) / 1000 };
}

if (typeof module !== "undefined") module.exports = { REGLES_AE, ACTIVITES_AE, eligibiliteAE, contributionAE };
