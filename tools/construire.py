# -*- coding: utf-8 -*-
"""UNE ADRESSE PAR LANGUE (21/11/2026, règle commune § 8 point 9 ; même méthode que Code de la route, tools/construire.py).

Les pages sont écrites à la main, en français ET en arabe (spans data-l="fr" / data-l="ar"), dans tools/sources/<chemin>/index.html.
Ce programme fabrique, pour chaque source :
  - <chemin>/index.html      : la page FRANÇAISE seule (textes arabes retirés), lang="fr", data-langue-fixe="fr" ;
  - ar/<chemin>/index.html   : la page ARABE seule (textes français retirés), lang="ar" dir="rtl", titre et description en arabe
                               (tools/sources/textes-ar.json), adresse officielle
                               (canonical, og:url) ar/…, og:locale ar_AR, fichiers (style, scripts, images) pris à la racine du site ;
  - les deux pages se citent (hreflang fr / ar / x-default = fr) ; assets/page.js lit data-langue-fixe : la langue est celle de
    l'adresse, le bouton de langue mène à l'autre adresse (data-autre-langue).
Page qui garde une seule adresse (?lang=ar) : video/ (fabriquée par tools/page_video.mjs à partir de tools/sources/a-propos/).
Le plan du site (sitemap.xml) est refait : pages françaises + pages arabes + video/.

  python tools/construire.py            (aussi lancé par le robot surveillance.yml après un changement d'année)
  python tools/construire.py --verifier (n'écrit rien ; code 1 si une page fabriquée n'est pas à jour : robot « tests »)
Toute modification d'une page se fait dans tools/sources/, jamais dans <chemin>/index.html ni ar/ (refaits ici).
"""
import html as H
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
SOURCES = os.path.join(ICI, "sources")
URL_SITE = "https://outils.clicvia.com/"
NOM_AR = "أدوات عملية تونس"

BALISE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(/?)>", re.S)
VIDES = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
# textes d'attributs écrits seulement en français dans la source (bloc commun « Paiement ») : leur arabe sur la page arabe
ATTRIBUTS_AR = {
    'title="Voir comment faire" aria-label="Voir comment faire"': 'title="كيف أقوم بذلك؟" aria-label="كيف أقوم بذلك؟"',
    'alt="Exemple D17 : Transfert rapide, numéro 24 321 390, montant, Envoyer"': 'alt="مثال D17: التحويل السريع، الرقم 24 321 390، المبلغ، إرسال"',
    'alt="Exemple IZI : Transfert, montant, numéro 24 321 390, Suivant"': 'alt="مثال IZI: تحويل، المبلغ، الرقم 24 321 390، التالي"',
}
HTML_SOURCE = re.compile(r'<html lang="fr" dir="ltr" translate="no" data-racine="([^"]*)">')


def titre_seo(t, maxi=70):
    """Titre <= 70 caractères : coupe à un séparateur s'il reste au moins 38 caractères, sinon au dernier mot + « … »."""
    t = " ".join(str(t).split())
    if len(t) <= maxi:
        return t
    for sep in (" : ", ": ", " — ", " (", " – ", ", ", "، ", " | "):
        i = t.rfind(sep, 0, maxi)
        if i >= 38:
            return t[:i].rstrip(" ,;:—-،")
    return t[:maxi - 1].rsplit(" ", 1)[0].rstrip(" ,;:—-،(") + "…"


def desc_seo(d, maxi=165):
    """Description <= 165 caractères : fin de la dernière phrase entière, sinon dernier mot + « … »."""
    d = " ".join(str(d).split())
    if len(d) <= maxi:
        return d
    coupe = d[:maxi]
    i = max(coupe.rfind(". "), coupe.rfind(" ! "), coupe.rfind(" ? "), coupe.rfind("؟ "))
    if i >= 60:
        return coupe[:i + 1].strip()
    return coupe[:maxi - 1].rsplit(" ", 1)[0].rstrip(" ,;:—-(،") + "…"


def retirer_langue(page, autre):
    """Enlève chaque élément data-l="<autre>" (et tout ce qu'il contient)."""
    sortie, i, saut = [], 0, 0
    for m in BALISE.finditer(page):
        if m.start() < max(i, saut):
            continue
        ferme, nom, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if nom in ("script", "style") and not ferme:          # jamais de balise cherchée dans un script ou un style
            fin = page.find(f"</{nom}", m.end())
            saut = len(page) if fin < 0 else fin
            continue
        if ferme or f'data-l="{autre}"' not in attrs:
            continue
        sortie.append(page[i:m.start()])
        if nom in VIDES or m.group(4):
            i = m.end()
            continue
        prof, j = 1, m.end()                                   # fin de l'élément : même nom de balise, en comptant l'imbrication
        for n in BALISE.finditer(page, m.end()):
            if n.group(2).lower() != nom or n.group(4):
                continue
            prof += -1 if n.group(1) else 1
            if prof == 0:
                j = n.end()
                break
        else:
            j = len(page)
        i = j
    sortie.append(page[i:])
    return re.sub(r"\n[ \t]*\n([ \t]*\n)+", "\n\n", "".join(sortie))     # lignes vides laissées par les retraits


def _resoudre(chemin, rel):
    parts = [x for x in chemin.split("/") if x]
    for x in rel.split("/"):
        if x in ("", "."):
            continue
        if x == "..":
            if parts:
                parts.pop()
        else:
            parts.append(x)
    return "/".join(parts) + ("/" if parts and (rel.endswith("/") or rel in ("", ".", "..")) else "")


def _plus_un_niveau(url, chemin, miroir):
    """Adresse relative vue depuis la page arabe (un dossier plus bas) : une page qui existe aussi en arabe reste dans ar/ ;
    tout le reste (style, scripts, images, données, video/) est pris à la racine du site."""
    if not url or re.match(r"^([a-z][a-z0-9+.-]*:|//|/|#|\?)", url, re.I):
        return url
    p = url.split("#")[0].split("?")[0]
    if p == "" or p.endswith("/") or p in (".", ".."):
        if _resoudre(chemin, p) in miroir:
            return url
    return "../" + url


def _reecrire_liens(page, chemin, miroir):
    def attr(m):
        nom, val = m.group(1), m.group(2)
        if nom == "srcset":
            morceaux = [s.strip() for s in val.split(",")]
            val = ", ".join(" ".join([_plus_un_niveau(s.split()[0], chemin, miroir)] + s.split()[1:]) for s in morceaux if s)
        else:
            val = _plus_un_niveau(val, chemin, miroir)
        return f'{nom}="{val}"'
    return re.sub(r'\b(href|src|srcset|action|poster)="([^"]*)"', attr, page)


def tete_langues(chemin):
    fr, ar = URL_SITE + chemin, URL_SITE + "ar/" + chemin
    return (f'<link rel="alternate" hreflang="fr" href="{fr}">\n<link rel="alternate" hreflang="ar" href="{ar}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{fr}">')


def textes_ar():
    """Titre et description arabes de chaque page : tools/sources/textes-ar.json (l'année y est changée par le robot en janvier)."""
    import json
    return json.load(open(os.path.join(SOURCES, "textes-ar.json"), encoding="utf-8"))


def versions(source, chemin, miroir, textes):
    """source = page bilingue écrite à la main ; chemin = "" (accueil), "credit/", "pass/conditions/"… Renvoie (française, arabe)."""
    m = HTML_SOURCE.search(source)
    if not m:
        raise SystemExit(f"ÉCHEC - {chemin or 'accueil'} : balise <html lang=\"fr\" dir=\"ltr\" translate=\"no\" data-racine=…> attendue")
    racine = m.group(1)                                   # "" pour l'accueil, "../" pour credit/, "../../" pour pass/conditions/
    tx = textes.get(chemin) or {}
    titre_ar, desc_ar = tx.get("titre", "").strip(), tx.get("description", "").strip()
    if not titre_ar or not desc_ar:
        raise SystemExit(f"ÉCHEC - {chemin or 'accueil'} : titre ou description arabe manquant dans tools/sources/textes-ar.json")
    tete = tete_langues(chemin)
    vers_ar = racine + "ar/" + chemin                    # bouton de langue : adresse relative de l'autre version
    vers_fr = "../" + racine + chemin

    fr = retirer_langue(source, "ar")
    fr = fr.replace(m.group(0), f'<html lang="fr" dir="ltr" translate="no" data-racine="{racine}" data-langue-fixe="fr" data-autre-langue="{vers_ar}">', 1)
    fr = fr.replace('<link rel="canonical"', tete + '\n<link rel="canonical"', 1)
    fr = re.sub(r'(<meta property="og:url" content="[^"]*">)', r'\1\n<meta property="og:locale" content="fr_FR">\n<meta property="og:locale:alternate" content="ar_AR">', fr, count=1)

    ar = retirer_langue(source, "fr")
    ar = _reecrire_liens(ar, chemin, miroir)
    ar = re.sub(r'\balt="[^"]*"([^>]*?\sdata-alt-ar="([^"]*)")', r'alt="\2"\1', ar)   # texte des photos en arabe dès le serveur
    for a, b in ATTRIBUTS_AR.items():
        ar = ar.replace(a, b)
    ar = ar.replace(m.group(0), f'<html lang="ar" dir="rtl" translate="no" data-racine="../{racine}" data-site="{racine}" data-langue-fixe="ar" data-autre-langue="{vers_fr}">', 1)
    url_ar = URL_SITE + "ar/" + chemin
    t, d = H.escape(titre_seo(titre_ar), quote=False), H.escape(desc_seo(desc_ar))
    ar = re.sub(r'<link rel="canonical" href="[^"]*">', lambda x: tete + f'\n<link rel="canonical" href="{url_ar}">', ar, count=1)
    ar = re.sub(r'<meta property="og:url" content="[^"]*">',
                lambda x: f'<meta property="og:url" content="{url_ar}">\n<meta property="og:locale" content="ar_AR">\n<meta property="og:locale:alternate" content="fr_FR">', ar, count=1)
    ar = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", ar, flags=re.S)   # FAQ Google écrite en français : pas sur la page arabe
    ar = re.sub(r"<title>.*?</title>", lambda x: f"<title>{t}</title>", ar, count=1, flags=re.S)
    ar = re.sub(r'<meta name="description" content="[^"]*">', lambda x: f'<meta name="description" content="{d}">', ar, count=1)
    ar = re.sub(r'<meta property="og:title" content="[^"]*">', lambda x: f'<meta property="og:title" content="{H.escape(titre_ar.split(" | ")[0])}">', ar, count=1)
    ar = re.sub(r'<meta property="og:description" content="[^"]*">', lambda x: f'<meta property="og:description" content="{d}">', ar, count=1)
    ar = ar.replace('<meta name="apple-mobile-web-app-title" content="Outils TN">', '<meta name="apple-mobile-web-app-title" content="أدوات تونس">', 1)
    return fr, ar


def pages_sources():
    chemins = []
    for dossier, _, fichiers in os.walk(SOURCES):
        if "index.html" in fichiers:
            rel = os.path.relpath(dossier, SOURCES).replace(os.sep, "/")
            chemins.append("" if rel == "." else rel + "/")
    return sorted(chemins)


def sitemap(chemins, anciennes_dates, changes, aujourd_hui):
    lignes = []
    for c in chemins + [("ar/" + c) for c in chemins] + ["video/"]:
        loc = URL_SITE + c
        date = aujourd_hui if (c in changes or not anciennes_dates.get(loc)) else anciennes_dates[loc]
        lignes.append(f"  <url><loc>{loc}</loc><lastmod>{date}</lastmod></url>")
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(lignes) + "\n</urlset>\n"


def fabriquer():
    """Renvoie {fichier relatif: contenu} de toutes les pages fabriquées, et la liste des chemins."""
    chemins = pages_sources()
    miroir = set(chemins)
    textes = textes_ar()
    fichiers = {}
    for chemin in chemins:
        source = open(os.path.join(SOURCES, chemin, "index.html"), encoding="utf-8").read()
        fr, ar = versions(source, chemin, miroir, textes)
        fichiers[chemin + "index.html"] = fr
        fichiers["ar/" + chemin + "index.html"] = ar
    return fichiers, chemins


def lire(rel):
    p = os.path.join(RACINE, rel)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else None


def main(argv):
    import datetime as dt
    fichiers, chemins = fabriquer()
    differents = [f for f, c in fichiers.items() if lire(f) != c]
    base = os.path.join(RACINE, "ar")
    orphelines = []                                      # page arabe sans source = à retirer (page supprimée)
    if os.path.isdir(base):
        for dossier, _, fs in os.walk(base):
            if "index.html" in fs:
                rel = "ar/" + os.path.relpath(os.path.join(dossier, "index.html"), base).replace(os.sep, "/")
                if rel not in fichiers:
                    orphelines.append(rel)
    sm = lire("sitemap.xml") or ""
    dates = {loc: d for loc, d in re.findall(r"<loc>([^<]+)</loc>(?:<lastmod>([^<]*)</lastmod>)?", sm)}
    changes = {f[:-len("index.html")] for f in differents}
    plan = sitemap(chemins, dates, changes, dt.date.today().isoformat())
    if "--verifier" in argv:
        manque = differents + orphelines + ([] if all(URL_SITE + c in dates for c in chemins + ["ar/" + c for c in chemins] + ["video/"]) else ["sitemap.xml"])
        if manque:
            print("ÉCHEC - pages fabriquées pas à jour (modifier tools/sources/ puis lancer python tools/construire.py) : " + ", ".join(manque))
            return 1
        print(f"OK - {len(fichiers)} pages fabriquées à jour ({len(chemins)} en français + {len(chemins)} en arabe)")
        return 0
    for f in differents:
        dest = os.path.join(RACINE, f)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, "w", encoding="utf-8", newline="\n").write(fichiers[f])
    for f in orphelines:
        os.remove(os.path.join(RACINE, f))
    if os.path.isdir(base):
        for dossier, _, _ in sorted(os.walk(base), key=lambda x: -len(x[0])):
            if dossier != base and not os.listdir(dossier):
                os.rmdir(dossier)
    if plan != sm:
        open(os.path.join(RACINE, "sitemap.xml"), "w", encoding="utf-8", newline="\n").write(plan)
    print(f"{len(chemins)} page(s) : français + arabe (ar/) ; {len(differents)} fichier(s) refait(s) ; plan du site à jour")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
