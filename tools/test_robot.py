# -*- coding: utf-8 -*-
"""Scénarios du robot de surveillance (verifier_regles.py), sur une COPIE du site.
Usage : python tools/test_robot.py   (à relancer après toute modification du robot)"""
import datetime as dt
import shutil
import sys
import tempfile
from pathlib import Path

ICI = Path(__file__).resolve().parent.parent
ok_total = 0
echecs = 0

def check(desc, cond):
    global ok_total, echecs
    print(("OK   " if cond else "FAIL ") + desc)
    if cond: ok_total += 1
    else: echecs += 1

def copie():
    d = Path(tempfile.mkdtemp())
    for f in ["index.html", "salaire-net", "impot-revenu", "a-propos", "credit", "auto-entrepreneur", "retenue-source",
              "assets", "tools", "README.md"]:
        s = ICI / f
        (shutil.copytree if s.is_dir() else shutil.copy)(s, d / f)
    return d

def charger(racine):
    import importlib.util
    spec = importlib.util.spec_from_file_location("vr", racine / "tools" / "verifier_regles.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

class FausseDate(dt.date):
    jour = dt.date(2026, 11, 1)
    @classmethod
    def today(cls): return cls.jour

def lancer(racine, leurs, jour, tmm=None):
    m = charger(racine)
    FausseDate.jour = jour
    m.dt = type("dt", (), {"date": FausseDate, "timedelta": dt.timedelta})
    m.leurs_nets = leurs
    # jamais de réseau dans les tests : par défaut, la BCT affiche le même TMM que le site
    m.lire_tmm_bct = tmm or m.lire_tmm_site
    import sys as _s
    argv = _s.argv; _s.argv = ["x"]
    try: return m.main(), m
    finally: _s.argv = argv

identique = lambda: charger(ICI).nos_nets()

# 1. règles identiques un mois ordinaire : date mise à jour, année inchangée
d = copie()
code, m = lancer(d, identique, dt.date(2026, 11, 1))
maj, annee = m.lire_constantes()
check("règles identiques -> code 0", code == 0)
check("date de vérification mise à jour (01/11/2026)", maj == "01/11/2026")
check("année inchangée en novembre", annee == 2026)

# 1 bis. un écart d'un millime chez le simulateur de référence (ses arrondis varient) n'est PAS une alerte
def un_millime():
    n = identique(); n[3] = f"{float(n[3]) - 0.001:.3f}"; return n
code, m = lancer(d, un_millime, dt.date(2026, 11, 2))
check("écart d'1 millime toléré -> code 0", code == 0)

# 2. le 3 janvier : pas encore de changement d'année (on attend le 15)
code, m = lancer(d, identique, dt.date(2027, 1, 3))
check("début janvier : année pas encore changée", m.lire_constantes()[1] == 2026)

# 2 bis. 16 janvier 2027 : la CSS réduite n'est votée que pour 2026 -> alerte (code 4), rien ne change
code, m = lancer(d, identique, dt.date(2027, 1, 16))
check("2027 sans confirmation de la CSS -> code 4 (alerte)", code == 4)
check("2027 sans confirmation de la CSS : année inchangée", m.lire_constantes()[1] == 2026)

# 3. loi de finances 2027 vérifiée (CSS confirmée pour 2027), règles identiques : tout le site passe en 2027
calc = d / "assets" / "calcul.js"
calc.write_text(calc.read_text(encoding="utf-8").replace("cssReduiteJusqua: 2026", "cssReduiteJusqua: 2027"), encoding="utf-8")
code, m = lancer(d, identique, dt.date(2027, 1, 16))
check("16 janvier : ANNEE = 2027", m.lire_constantes()[1] == 2027)
s = (d / "salaire-net" / "index.html").read_text(encoding="utf-8")
check("titre de la page salaire en 2027", "Salaire brut ⇄ net en Tunisie (2027)" in s)
check("« loi de finances 2025 » non modifiée", "loi de finances pour 2025" in s)
VERSION = __import__("re").search(r"\?v=\w+", (ICI / "salaire-net" / "index.html").read_text(encoding="utf-8")).group(0)  # version actuelle du site
check("numéros de version ?v= non modifiés", VERSION in s)
check("aucun « 2026 » isolé restant dans les pages",
      all(__import__("re").search(r"(?<![\d/\-])2026(?![\d/\-])", (d / f).read_text(encoding="utf-8")) is None
          for f in ["index.html", "salaire-net/index.html", "impot-revenu/index.html", "a-propos/index.html"]))
shutil.rmtree(d)

# 4. résultats différents : alerte (code 2), rien de modifié
d = copie()
avant = (d / "assets" / "page.js").read_text(encoding="utf-8")
def differents():
    n = identique(); n[1] = "1150.000"; return n
code, m = lancer(d, differents, dt.date(2027, 1, 20))
check("règles changées -> code 2 (alerte)", code == 2)
check("règles changées : date et année NON modifiées", (d / "assets" / "page.js").read_text(encoding="utf-8") == avant)
check("règles changées : écarts écrits pour l'alerte", (d / "ecarts.txt").exists() and "1500 brut" in (d / "ecarts.txt").read_text(encoding="utf-8"))

# 5. simulateur injoignable : code 3, rien de modifié
def panne(): raise RuntimeError("réseau")
code, m = lancer(d, panne, dt.date(2027, 1, 20))
check("simulateur en panne -> code 3", code == 3)
check("simulateur en panne : rien de modifié", (d / "assets" / "page.js").read_text(encoding="utf-8") == avant)
shutil.rmtree(d)

# 6. passage à 2027 : les pages Crédit, Auto-entrepreneur et Retenue ne sont PAS touchées (dates fixes protégées)
d = copie()
avant_nouv = {f: (d / f).read_text(encoding="utf-8") for f in ["credit/index.html", "auto-entrepreneur/index.html", "retenue-source/index.html",
                                                              "assets/calcul-credit.js", "assets/calcul-auto.js", "assets/calcul-retenue.js"]}
calc = d / "assets" / "calcul.js"
calc.write_text(calc.read_text(encoding="utf-8").replace("cssReduiteJusqua: 2026", "cssReduiteJusqua: 2027"), encoding="utf-8")
code, m = lancer(d, identique, dt.date(2027, 1, 16))
check("passage à 2027 : pages crédit / auto-entrepreneur / retenue et leurs règles inchangées",
      code == 0 and m.lire_constantes()[1] == 2027 and all((d / f).read_text(encoding="utf-8") == t for f, t in avant_nouv.items()))
r = (d / "retenue-source" / "index.html").read_text(encoding="utf-8")
check("passage à 2027 : « Depuis le 1er janvier 2026 » (TEJ) conservé", "Depuis le 1er janvier 2026" in r)
shutil.rmtree(d)

# 7. TMM (page Crédit) : lecture de la page de la BCT (extrait réel, encodage Latin-1 comme sur le site de la BCT)
m = charger(ICI)
extrait = "<span>Taux moyen du march\xe9 mon\xe9taire (TMM) du mois de Septembre 2026: <b>7,00000</b> %</span>".encode("cp1252")
check("TMM : lecture de l'extrait BCT -> 7,00 % (2026-09)", m.extraire_tmm(extrait) == (7.0, "2026-09"))
check("TMM : mois accentué (Février, en UTF-8) -> 2027-02", m.extraire_tmm("(TMM) du mois de Février 2027 : <b>7,25000</b> %".encode()) == (7.25, "2027-02"))
def leve(octets):
    try:
        m.extraire_tmm(octets); return False
    except RuntimeError:
        return True
check("TMM : page changée ou valeur absurde -> erreur (pas de faux chiffre)",
      leve(b"<html>maintenance</html>") and leve(b"(TMM) du mois de Septembre 2026: <b>0</b>") and leve(b"(TMM) du mois de Brumaire 2026: <b>7</b>"))
preuve = ICI.parent / "preuves conditions d'utilisation" / "2026-10-05" / "sources-officielles-credit-autoentrepreneur-retenue" / "bct-accueil-TMM-septembre-2026.html"
if preuve.exists():
    check("TMM : page BCT sauvegardée le 05/10/2026 -> même TMM que le site", m.extraire_tmm(preuve.read_bytes()) == m.lire_tmm_site())
else:
    print("SAUTÉ page BCT sauvegardée (dossier des preuves absent, normal sur GitHub)")

d = copie()
credit_avant = (d / "assets" / "calcul-credit.js").read_text(encoding="utf-8")
code, m = lancer(d, identique, dt.date(2026, 11, 1), tmm=lambda: (7.0, "2026-10"))
check("TMM identique, mois suivant publié (1er novembre) -> code 0, pas d'alerte", code == 0)
code, m = lancer(d, identique, dt.date(2026, 11, 1), tmm=lambda: (7.25, "2026-10"))
txt = (d / "ecarts.txt").read_text(encoding="utf-8")
check("TMM différent (7,25 %) -> code 5 (alerte)", code == 5)
check("TMM différent : message clair pour l'alerte", "7.25 %" in txt and "calcul-credit.js" in txt)
check("TMM différent : TMM du site NON modifié", (d / "assets" / "calcul-credit.js").read_text(encoding="utf-8") == credit_avant)
check("TMM différent : la date de vérification de la paie est quand même mise à jour", m.lire_constantes()[0] == "01/11/2026")
code, m = lancer(d, identique, dt.date(2026, 12, 1), tmm=lambda: (7.0, "2026-11"))
check("TMM identique mais mois de septembre bientôt périmé (1er décembre) -> code 5", code == 5 and "2026-09" in (d / "ecarts.txt").read_text(encoding="utf-8"))
def bct_panne(): raise OSError("HTTP 503")
code, m = lancer(d, identique, dt.date(2026, 11, 2), tmm=bct_panne)
check("BCT injoignable -> code 6, rien de modifié", code == 6 and (d / "assets" / "calcul-credit.js").read_text(encoding="utf-8") == credit_avant)
code, m = lancer(d, lambda: [f"{float(x) + 5:.3f}" for x in identique()], dt.date(2026, 11, 3), tmm=lambda: (9.0, "2026-10"))
check("paie changée ET TMM changé -> code 2 (la paie d'abord)", code == 2)
shutil.rmtree(d)

print(f"\n{ok_total}/{ok_total + echecs} scénarios réussis")
sys.exit(1 if echecs else 0)
