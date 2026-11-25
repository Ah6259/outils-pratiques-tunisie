/* Réglage d'Outils pratiques Tunisie pour le parcours commun du Pass (assets/pass-commun.js, copie du module de projets-ahmed :
   « outils communs/pass-commun/ » ; NE PAS modifier pass-commun.js ici, voir son LISEZMOI.md). Page pass/ (FR) et ar/pass/ (AR),
   chargé après assets/pass.js (codes d'accès, Pass Journée ouvert) dont il reprend PASS, T, isoP, activerCode, cacherCommande…
   Ici seulement ce qui est PROPRE à ce site : nom, formule unique (Pass Journée), format du code (8 caractères sans O/0/I/1, affiché
   ABCD-EF23 : celui des codes déjà vendus, PASS.alphabet / PASS.longueur), textes de ce site, ligne « pour_activer » du bouton « pass »
   du dépôt privé outils-pass, bandeau du retour. Fichier externe : aucun script en ligne (CSP). */
(function () {
  var PC = window.PassCommun;
  if (!PC) return;
  var FORMULE = "Pass Journée - 7 DT - 24 heures";
  function nomFormule(f) {
    return /Pass/i.test(f || "") || !f ? T("Pass Journée (7 DT, 24 heures)", "باقة اليوم (" + isoP("7") + " د، " + isoP("24") + " ساعة)") : f;
  }
  PC.brancher({
    site: "outils",                                 // clé du site dans email-clients/sites.json (e-mail automatique)
    type: "pass-code",                              // code tapé sur le site (« J'ai un code »)
    langues: ["fr", "ar"],
    nomSite: { fr: "Outils pratiques Tunisie", ar: "أدوات عملية تونس" },
    // E-mail automatique (A.17) EN SERVICE depuis le 25 novembre 2026 ; false = phrases [data-email-auto] cachées et rien envoyé
    emailAuto: true,
    ids: { form: "pass-form", statut: "pass-status", apres: "apres-pass", attente: "commande-attente", nouvelle: "nouvelle-commande" },
    code: { alphabet: PASS.alphabet, longueur: PASS.longueur, affiche: function (brut) { return joliCode(brut); } },
    // formule du message WhatsApp (sans caractères d'isolement)
    formules: { "Pass Journée - 7 DT - 24 heures": { fr: "Pass Journée (7 DT, 24 heures)", ar: "باقة اليوم (7 د، 24 ساعة)" } },
    formuleDefaut: FORMULE,                         // formule unique (champ caché « formule »)
    etapes: ["nom", "telephone", "email", "conditions"],
    selecteurWa: "#pass-preuve, #pass-preuve-apres",
    textes: {
      emailInvalide: { fr: "E-mail invalide : vérifiez-le, par exemple nom@exemple.com.", ar: "البريد الإلكتروني غير صحيح: تثبّت منه، مثال " + isoP("nom@exemple.com") + "." },
      conditions: { fr: "Cochez « J'accepte les conditions du Pass Journée ».", ar: "يجب الموافقة على شروط باقة اليوم." },
      merci: { fr: "Merci ! Votre demande a bien été envoyée.", ar: "شكرًا! تم إرسال طلبك." },
      echecReessayer: { fr: "Échec de l'envoi — vérifiez votre connexion et réessayez, ou écrivez-nous sur WhatsApp au 24 321 390.",
                        ar: "تعذّر الإرسال — تحقّق من الاتصال وأعد المحاولة، أو راسلنا عبر واتساب على " + isoP("24 321 390") + "." },
      verification: { fr: "Vérification de votre code…", ar: "جارٍ التثبت من رمزك…" },
      attentePaiement: { fr: "En attente de votre paiement : dès qu'il est reçu, ce code est activé et le Pass s'ouvre ici.", ar: "في انتظار دفعتك: بمجرد استلامها يُفعَّل هذا الرمز وتُفتح الباقة هنا." },
      attenteImpossible: { fr: "Vérification impossible pour le moment (connexion) : revenez un peu plus tard.", ar: "تعذّر التثبت الآن (الاتصال): عد بعد قليل." }
    },
    classesEtat: { attentePaiement: "attente", attenteImpossible: "err" },
    apresAuRetour: true,                            // au retour : bandeau en haut ET la « Dernière étape » (paiement, WhatsApp)
    // bandeau du retour : « Votre commande en attente : code ABCD-EF23 — Pass Journée (7 DT, 24 heures) »
    auRetour: function (x) {
      var titre = document.getElementById("commande-titre");
      if (titre) titre.innerHTML = T("<b>Votre commande en attente :</b> code ", "<b>طلبك المعلّق:</b> الرمز ") +
        '<b dir="ltr" class="code-court">' + x.code + "</b> — " + nomFormule(x.cmd.formule);
    },
    formspree: function (d, c) {
      d.set("email", c.email);
      d.set("code", c.code);
      d.set("_subject", "Pass Journée — Outils pratiques Tunisie — code " + c.code);
    },
    // ligne prête à recopier dans le bouton GitHub « pass » (dépôt privé outils-pass) : action, nom, téléphone, CODE
    pourActiver: function (c) { return "action: paye ; nom: " + c.nom + " ; telephone: " + c.tel + " ; code: " + c.code; },
    // la commande en attente n'est regardée qu'APRÈS la revérification du Pass déjà gardé (window.PASS_PRET de pass.js), comme avant
    attendreRetour: function () {
      return new Promise(function (ok) {
        function suite() { Promise.resolve(window.PASS_PRET).then(ok, ok); }
        if (window.PASS_PRET || document.readyState === "complete") suite(); else document.addEventListener("DOMContentLoaded", suite);
      });
    },
    // même vérification que « J'ai un code »
    essayerCode: function (code) { return activerCode(code); },
    passOuvert: function () { cacherCommande(); },  // activé (Pass ouvert par activerCode) ou expiré : retour au formulaire
    nouvelle: function (p) { cacherCommande(); try { p.form.scrollIntoView({ block: "start" }); } catch (x) {} }
  });
})();
