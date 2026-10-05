# -*- coding: utf-8 -*-
"""Surveillance des règles de paie (lancé par .github/workflows/surveillance.yml).

1. Interroge un simulateur de paie de référence (adresse : secret GitHub REF_URL, ou fichier local tools/.reference)
   avec 5 cas de référence (lentement).
2. Compare avec nos calculs (assets/calcul.js, via Node).
3. Tout est identique -> met à jour la date « Règles vérifiées le … » (MAJ dans assets/page.js) ;
   en janvier, si l'année affichée est dépassée, passe tout le site à la nouvelle année
   (les règles restent valables puisqu'elles donnent toujours les mêmes résultats).
4. Différence -> code de sortie 2 : les règles ont changé (nouvelle loi de finances) -> le robot ouvre une alerte.
   Simulateur injoignable -> code de sortie 3 : on ne change rien, alerte si ça dure.
   Année au-delà de la CSS réduite votée -> code 4 : alerte « vérifier la loi de finances » (rien ne change).
5. Page Crédit : lit le TMM affiché sur la page d'accueil de la Banque centrale (une seule page, une fois par mois,
   User-Agent honnête ; conditions BCT sauvegardées le 05/10/2026 : citation exacte + source citée).
   TMM différent de REGLES_CREDIT.tmm (assets/calcul-credit.js), ou mois à rafraîchir avant que la page n'affiche
   « à vérifier » aux visiteurs -> code 5 : alerte « TMM à mettre à jour ». BCT illisible -> code 6.
   Dans les deux cas le TMM du site n'est JAMAIS modifié (la date de vérification de la paie, elle, est publiée).

Usage : python tools/verifier_regles.py [--sans-reseau]   (--sans-reseau : seulement le contrôle de cohérence)
"""
import datetime as dt
import html
import http.cookiejar
import json
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAS = [(2500, False, 0), (1500, False, 0), (1500, True, 2), (800, False, 0), (5000, True, 3)]
import os
URL = os.environ.get("REF_URL") or ((ROOT / "tools" / ".reference").read_text(encoding="utf-8").strip()
                                    if (ROOT / "tools" / ".reference").exists() else "")
P = "ctl00$MainContent$ctl00$ctl02$ctl06$ctl04$"
CHEF, ENF, BRUT, NET = P + "ctl07$CheckBox", P + "ctl08$NumericInput", P + "ctl09$NumericInput", P + "ctl10$NumericInput"
TOLERANCE = 0.002   # DT
FICHIERS_ANNEE = ["index.html", "salaire-net/index.html", "impot-revenu/index.html", "a-propos/index.html", "assets/calcul.js",
                  "assets/page.js", "README.md"]
# Volontairement ABSENTS : credit/ (aucune année écrite ; le mois du TMM vient de calcul-credit.js), auto-entrepreneur/ et
# retenue-source/ (dates fixes à ne jamais changer : « Depuis le 1er janvier 2026 », « septembre 2026 », « 2e trimestre 2026 »).
# Leurs titres « (2026) » restent donc tels quels en janvier : à revoir à la main avec la loi de finances.


# ---------- nos calculs ----------
def nos_nets():
    code = ("const c=require(%s);console.log(JSON.stringify(%s.map(([b,ch,e])=>c.brutVersNet(b,{chef:ch,enfants:e}).net.toFixed(3))))"
            % (json.dumps(str(ROOT / "assets" / "calcul.js")), json.dumps(CAS)))
    return json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)


# ---------- simulateur de référence (formulaire ASP.NET) ----------
def _ouvreur():
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
                                     urllib.request.HTTPSHandler(context=ctx))
    op.addheaders = [("User-Agent", "Mozilla/5.0 (compatible; outils-pratiques-tunisie; verification mensuelle)")]
    return op

def _champs(page):
    d = {}
    for m in re.finditer(r'<input([^>]*)>', page):
        a = m.group(1)
        n = re.search(r'name="([^"]+)"', a)
        if not n:
            continue
        t = (re.search(r'type="([^"]+)"', a) or [None, "text"])[1]
        v = re.search(r'value="([^"]*)"', a)
        if t in ("submit", "button", "image") or (t == "checkbox" and "checked" not in a):
            continue
        d[html.unescape(n.group(1))] = html.unescape(v.group(1)) if v else "on"
    return d

def _poster(op, page, cible, maj):
    d = _champs(page); d.update(maj); d["__EVENTTARGET"] = cible; d["__EVENTARGUMENT"] = ""
    return op.open(URL, urllib.parse.urlencode(d).encode(), timeout=60).read().decode("utf-8", "ignore")

def leurs_nets():
    nets = []
    for brut, chef, enfants in CAS:
        op = _ouvreur()
        page = op.open(URL, timeout=60).read().decode("utf-8", "ignore")
        if chef:
            page = _poster(op, page, CHEF, {CHEF: "on"}); time.sleep(2)
        if enfants:
            page = _poster(op, page, ENF, {ENF: str(enfants)}); time.sleep(2)
        page = _poster(op, page, BRUT, {BRUT: str(brut)})
        m = re.search(r'name="' + re.escape(NET) + r'"[^>]*value="([^"]*)"', page)
        if not m or not re.fullmatch(r"\d+(\.\d+)?", m.group(1)):
            raise RuntimeError(f"net introuvable pour {brut} (format du simulateur changé ?)")
        nets.append(f"{float(m.group(1)):.3f}")
        time.sleep(3)
    return nets


# ---------- TMM de la Banque centrale (page Crédit) ----------
BCT_URL = "https://www.bct.gov.tn/"
MOIS_FR = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]
TMM_VALABLE_JOURS = 75   # comme tmmValableJours dans assets/calcul-credit.js (au-delà, la page dit « à vérifier »)

def extraire_tmm(octets):
    """« Taux moyen du marché monétaire (TMM) du mois de Septembre 2026: <b>7,00000</b> % » -> (7.0, "2026-09")."""
    try:
        texte = octets.decode("utf-8")
    except UnicodeDecodeError:
        texte = octets.decode("cp1252", "replace")   # la page de la BCT est en Latin-1
    texte = html.unescape(texte)
    m = re.search(r"\(TMM\)\s*du\s+mois\s+d[e']\s*([^\d<]{3,12}?)\s+(\d{4})\s*:\s*<b>\s*([\d.,]+)\s*</b>", texte, re.I)
    if not m:
        raise RuntimeError("TMM introuvable sur la page de la BCT (format changé ?)")
    nom = "".join(c for c in unicodedata.normalize("NFKD", m.group(1).strip().lower()) if c.isalpha())
    mois = next((i + 1 for i, x in enumerate(MOIS_FR) if nom == x), None)
    if mois is None:
        raise RuntimeError(f"mois du TMM illisible : {m.group(1)!r}")
    taux = float(m.group(3).replace(",", "."))
    if not 0 < taux < 50:
        raise RuntimeError(f"TMM absurde : {taux}")
    return taux, f"{m.group(2)}-{mois:02d}"

def lire_tmm_bct():
    return extraire_tmm(_ouvreur().open(BCT_URL, timeout=60).read())

def lire_tmm_site():
    js = (ROOT / "assets" / "calcul-credit.js").read_text(encoding="utf-8")
    m = re.search(r'tmm:\s*\{\s*taux:\s*([\d.]+),\s*mois:\s*"(\d{4}-\d{2})"', js)
    return float(m.group(1)), m.group(2)

def verifier_tmm(aujourd_hui):
    """Renvoie (code, message) : 0 = à jour, 5 = TMM à mettre à jour, 6 = BCT illisible. Ne modifie rien."""
    taux_site, mois_site = lire_tmm_site()
    try:
        taux_bct, mois_bct = lire_tmm_bct()
    except Exception as e:
        return 6, f"Lecture du TMM sur {BCT_URL} impossible : {e}"
    print(f"TMM BCT   : {taux_bct:.5f} % ({mois_bct}) ; site : {taux_site:.5f} % ({mois_site})")
    if abs(taux_bct - taux_site) > 1e-6:
        return 5, (f"Le TMM publié par la BCT ({mois_bct}) est de {taux_bct:.2f} % ; la page Crédit affiche {taux_site:.2f} % "
                   f"({mois_site}). Mettre à jour REGLES_CREDIT.tmm dans assets/calcul-credit.js.")
    a, mo = map(int, mois_site.split("-"))
    fin_mois = dt.date(a + mo // 12, mo % 12 + 1, 1) - dt.timedelta(days=1)
    if mois_bct > mois_site and (aujourd_hui + dt.timedelta(days=31) - fin_mois).days > TMM_VALABLE_JOURS:
        return 5, (f"Le TMM est inchangé ({taux_bct:.2f} %) mais la page Crédit cite encore le mois {mois_site} ; la BCT publie "
                   f"{mois_bct}. Mettre à jour le mois dans REGLES_CREDIT.tmm avant que la page n'affiche « à vérifier ».")
    return 0, "TMM à jour"


# ---------- dates et année ----------
def lire_constantes():
    js = (ROOT / "assets" / "page.js").read_text(encoding="utf-8")
    return re.search(r'const MAJ = "([^"]+)"', js).group(1), int(re.search(r'const ANNEE = (\d{4})', js).group(1))

def ecrire_maj(date_fr):
    p = ROOT / "assets" / "page.js"
    js = p.read_text(encoding="utf-8")
    p.write_text(re.sub(r'const MAJ = "[^"]+"', f'const MAJ = "{date_fr}"', js), encoding="utf-8")

def changer_annee(ancienne, nouvelle):
    """Remplace l'année seule (pas les dates jj/mm/aaaa ni aaaa-mm-jj, pas « loi de finances 2025 »)."""
    motif = re.compile(r"(?<![\d/\-])" + str(ancienne) + r"(?![\d/\-])")
    for f in FICHIERS_ANNEE:
        p = ROOT / f
        if p.exists():
            p.write_text(motif.sub(str(nouvelle), p.read_text(encoding="utf-8")), encoding="utf-8")


def main():
    aujourd_hui = dt.date.today()
    nous = nos_nets()
    if "--sans-reseau" in sys.argv:
        print("nos nets :", nous); return 0
    try:
        eux = leurs_nets()
    except Exception as e:
        print(f"ÉCHEC : simulateur de référence injoignable ou modifié : {e}")
        return 3
    print("cas       :", CAS); print("nous      :", nous); print("référence:", eux)
    # le simulateur de référence varie lui-même d'un millime selon les fois (arrondis) ; un changement de loi fait bouger
    # le net de plusieurs dinars : on tolère donc 2 millimes d'écart
    ecarts = [f"{b} brut (chef={c}, enfants={e}) : nous {n} / référence {x}"
              for (b, c, e), n, x in zip(CAS, nous, eux) if abs(float(n) - float(x)) > TOLERANCE]
    if ecarts:
        Path(ROOT / "ecarts.txt").write_text("\n".join(ecarts), encoding="utf-8")
        print("RÈGLES CHANGÉES :\n" + "\n".join(ecarts))
        return 2
    ecrire_maj(aujourd_hui.strftime("%d/%m/%Y"))
    _, annee = lire_constantes()
    # en janvier (après le 15, quand la loi de finances est appliquée par les logiciels de paie)
    css_jusqua = int(re.search(r"cssReduiteJusqua: (\d{4})", (ROOT / "assets" / "calcul.js").read_text(encoding="utf-8")).group(1))
    if aujourd_hui.year > css_jusqua:
        # le taux réduit de la CSS n'est voté que jusqu'à css_jusqua : ne pas passer à la nouvelle année sans
        # confirmation (prolongation ou retour à 1 %) -> alerte, même si la référence n'a pas encore changé
        (ROOT / "ecarts.txt").write_text(f"Le taux réduit de la CSS (0,5 %) n'était voté que jusqu'à {css_jusqua}. "
                                         "Vérifier la loi de finances : prolongation ou retour à 1 %.", encoding="utf-8")
        print(f"ATTENTION : CSS réduite votée jusqu'à {css_jusqua} seulement -> vérification humaine")
        return 4
    if aujourd_hui.year > annee and (aujourd_hui.month > 1 or aujourd_hui.day >= 15):
        changer_annee(annee, aujourd_hui.year)
        print(f"Année du site : {annee} -> {aujourd_hui.year}")
    print("OK : règles identiques, date de vérification mise à jour.")
    # TMM de la page Crédit : alerte seulement, le site n'est pas modifié (la date de paie ci-dessus est publiée quand même)
    code_tmm, message = verifier_tmm(aujourd_hui)
    if code_tmm:
        (ROOT / "ecarts.txt").write_text(message, encoding="utf-8")
        print(("TMM À METTRE À JOUR : " if code_tmm == 5 else "ÉCHEC TMM : ") + message)
    return code_tmm


if __name__ == "__main__":
    sys.exit(main())
