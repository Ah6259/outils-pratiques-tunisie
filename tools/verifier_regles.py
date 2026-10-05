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
    print("cas       :", CAS); print("nous      :", nous); print("paie-tun. :", eux)
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
    return 0


if __name__ == "__main__":
    sys.exit(main())
