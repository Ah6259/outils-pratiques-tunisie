/* Outils pratiques Tunisie — calculs (loi de finances 2025, applicable en 2026).
   Tout est calculé dans le navigateur : aucune donnée n'est envoyée. */

const REGLES = {
  annee: 2026,
  cnssSalarie: 0.0968,        // 9,18 % CNSS + 0,50 % perte d'emploi
  fraisProTaux: 0.10,         // 10 % du revenu après CNSS
  fraisProPlafond: 2000,      // DT par an
  chefFamille: 300,           // DT par an
  parEnfant: 100,             // DT par an et par enfant
  enfantsMax: 4,
  cssTaux: 0.005,             // contribution sociale de solidarité
  cssSeuil: 5000,             // pas de CSS si revenu imposable annuel <= 5 000 DT
  bareme: [                   // [plafond annuel de la tranche, taux]
    [5000, 0], [10000, 0.15], [20000, 0.25], [30000, 0.30],
    [40000, 0.33], [50000, 0.36], [70000, 0.38], [Infinity, 0.40]
  ]
};

/* Arrondi au millime (3 décimales), le petit ajout corrige les erreurs d'arrondi des nombres à virgule */
const millime = v => Math.round(v * 1000 + 1e-7) / 1000;

/* Impôt annuel (IRPP) selon le barème progressif, avec le détail par tranche */
function irppAnnuel(imposable) {
  let reste = Math.max(0, imposable), bas = 0, total = 0;
  const detail = [];
  for (const [haut, taux] of REGLES.bareme) {
    if (reste <= 0) break;
    const part = Math.min(reste, haut - bas);
    const impot = part * taux;
    detail.push({ de: bas, a: bas + part, taux, impot });
    total += impot; reste -= part; bas = haut;
  }
  return { total, detail };
}

/* Du revenu annuel avant impôt (brut moins CNSS) au revenu imposable */
function imposableAnnuel(apresCnss, famille) {
  const fraisPro = Math.min(apresCnss * REGLES.fraisProTaux, REGLES.fraisProPlafond);
  const enfants = Math.min(famille.enfants || 0, REGLES.enfantsMax);
  const deductions = (famille.chef ? REGLES.chefFamille : 0) + enfants * REGLES.parEnfant;
  return { fraisPro, deductions, imposable: Math.max(0, apresCnss - fraisPro - deductions) };
}

function cssAnnuelle(imposable) {
  return imposable > REGLES.cssSeuil ? imposable * REGLES.cssTaux : 0;
}

/* Salaire mensuel brut -> net (12 salaires égaux par an) */
function brutVersNet(brutMensuel, famille) {
  const brutAn = brutMensuel * 12;
  const cnssAn = brutAn * REGLES.cnssSalarie;
  const imp = imposableAnnuel(brutAn - cnssAn, famille);
  const irpp = irppAnnuel(imp.imposable);
  const css = cssAnnuelle(imp.imposable);
  const netAn = brutAn - cnssAn - irpp.total - css;
  // comme sur une fiche de paie : chaque retenue mensuelle est arrondie au millime, puis on soustrait
  const ligne = { cnss: millime(cnssAn / 12), irpp: millime(irpp.total / 12), css: millime(css / 12) };
  return {
    brut: brutMensuel, ...ligne, net: millime(millime(brutMensuel) - ligne.cnss - ligne.irpp - ligne.css),
    an: { brut: brutAn, cnss: cnssAn, fraisPro: imp.fraisPro, deductions: imp.deductions,
          imposable: imp.imposable, irpp: irpp.total, css, net: netAn },
    tranches: irpp.detail
  };
}

/* Net mensuel souhaité -> brut nécessaire (recherche par dichotomie) */
function netVersBrut(netMensuel, famille) {
  let bas = 0, haut = Math.max(1000, netMensuel * 3);
  while (brutVersNet(haut, famille).net < netMensuel) haut *= 2;
  for (let i = 0; i < 60; i++) {
    const milieu = (bas + haut) / 2;
    if (brutVersNet(milieu, famille).net < netMensuel) bas = milieu; else haut = milieu;
  }
  // plusieurs bruts donnent le même net au millime : on préfère le plus rond (2 500 plutôt que 2 499,999)
  const vise = millime(netMensuel);
  for (const pas of [1, 0.1, 0.01, 0.001]) {
    const rond = millime(Math.round(haut / pas) * pas);
    if (brutVersNet(rond, famille).net === vise) return brutVersNet(rond, famille);
  }
  return brutVersNet(millime(haut), famille);
}

/* Isolé (U+2066…U+2069) pour rester lisible au milieu d'un texte arabe */
const iso = t => "⁦" + t + "⁩";

/* Montant en dinars avec 3 décimales (millimes), format tunisien : 1 234,567 */
function dt(v) {
  const [e, d] = (Math.round(v * 1000) / 1000).toFixed(3).split(".");
  return "⁦" + e.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + d + " DT⁩";
}

/* Nombre entier avec espaces : 10 000 */
const ent = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

if (typeof module !== "undefined") module.exports = { REGLES, irppAnnuel, imposableAnnuel, cssAnnuelle, brutVersNet, netVersBrut, dt };
