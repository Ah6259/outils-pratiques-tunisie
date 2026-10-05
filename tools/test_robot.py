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
    for f in ["index.html", "salaire-net", "impot-revenu", "a-propos", "assets", "tools", "README.md"]:
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

def lancer(racine, leurs, jour):
    m = charger(racine)
    FausseDate.jour = jour
    m.dt = type("dt", (), {"date": FausseDate})
    m.leurs_nets = leurs
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
check("numéros de version ?v= non modifiés", "?v=20261005" in s)
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

print(f"\n{ok_total}/{ok_total + echecs} scénarios réussis")
sys.exit(1 if echecs else 0)
