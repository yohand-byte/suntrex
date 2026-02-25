#!/usr/bin/env python3
"""Extract technical specs from solar product datasheets (PDF → JSON)."""

import fitz  # pymupdf
import json
import re
import os
import datetime
from pathlib import Path

DATASHEETS_DIR = "public/datasheets"
SPECS_DIR = "public/specs"
os.makedirs(SPECS_DIR, exist_ok=True)

# ── Patterns regex universels pour specs PV ──────────────────────────
PATTERNS = {
    # Puissance
    "power_w":        r'(\d{1,5})\s*(?:W|Watt|Wc|Wp)(?:\s|$|,|\.)',
    "power_kw":       r'(\d{1,3}(?:\.\d)?)\s*kW(?:\s|$|,|\.)',
    # Rendement
    "efficiency_pct": r'(?:efficiency|rendement|wirkungsgrad|max\.?\s*efficiency)[^\d]*(\d{2}(?:\.\d{1,2})?)\s*%',
    # Phases
    "phases":         r'(?:single.phase|monophas|einphasig|1.phase)',
    "phases_3":       r'(?:three.phase|triphas|dreiphasig|3.phase)',
    # MPPT
    "mppt_count":     r'(\d)\s*(?:MPPT|mppt)',
    "mppt_voltage":   r'(?:MPPT|mppt)[^\d]*(\d{2,4})\s*V',
    # Dimensions
    "dimensions":     r'(\d{3,4})\s*[×xX\*]\s*(\d{2,4})\s*[×xX\*]\s*(\d{2,4})\s*(?:mm)?',
    # Poids
    "weight_kg":      r'(\d{1,3}(?:\.\d)?)\s*kg',
    # IP Rating
    "ip_rating":      r'IP\s*(\d{2})',
    # Température
    "temp_range":     r'(-\d{1,2})\s*°?C?\s*(?:to|à|bis|~|\.\.\.)\s*\+?(\d{2,3})\s*°?C',
    # Garantie
    "warranty":       r'(\d{1,2})\s*(?:year|ans|jahre|yr)(?:s)?\s*(?:warranty|garantie)',
    # Capacité batterie
    "capacity_kwh":   r'(\d{1,3}(?:\.\d{1,2})?)\s*kWh',
    "capacity_ah":    r'(\d{2,4})\s*Ah',
    # Tension
    "voltage_v":      r'(\d{2,4})\s*V(?:DC|AC)?',
    # Certifications
    "certifications": r'(CE|IEC\s*\d+|UL\s*\d+|VDE|G98|G99|RD1699|EN\s*\d+)',
}


def extract_text(pdf_path):
    """Extract all text from a PDF file."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text


def parse_specs(text, filename):
    """Parse technical specs from extracted text using regex patterns."""
    specs = {}

    # Puissance kW — try specific patterns first
    kw_specific = re.search(
        r'(?:rated|max|nominal|ac)\s*(?:output\s*)?power[^\d]*(\d{1,3}(?:\.\d)?)\s*kW',
        text, re.IGNORECASE
    )
    kw_generic = re.search(PATTERNS["power_kw"], text, re.IGNORECASE)
    if kw_specific:
        specs["power_kw"] = float(kw_specific.group(1))
    elif kw_generic:
        specs["power_kw"] = float(kw_generic.group(1))

    # Puissance W (fallback)
    if "power_kw" not in specs:
        w_match = re.search(PATTERNS["power_w"], text)
        if w_match:
            val = int(w_match.group(1))
            if val > 100:  # Ignore small values
                specs["power_w"] = val
                specs["power_kw"] = round(val / 1000, 2)

    # Rendement
    eff = re.search(PATTERNS["efficiency_pct"], text, re.IGNORECASE)
    if eff:
        val = float(eff.group(1))
        if 80 <= val <= 100:
            specs["efficiency_pct"] = val

    # Phases
    if re.search(PATTERNS["phases_3"], text, re.IGNORECASE):
        specs["phases"] = 3
    elif re.search(PATTERNS["phases"], text, re.IGNORECASE):
        specs["phases"] = 1

    # MPPT
    mppt = re.search(PATTERNS["mppt_count"], text, re.IGNORECASE)
    if mppt:
        specs["mppt_count"] = int(mppt.group(1))

    # Dimensions
    dims = re.search(PATTERNS["dimensions"], text)
    if dims:
        d = [dims.group(1), dims.group(2), dims.group(3)]
        specs["dimensions_mm"] = "x".join(d)

    # Poids – prend le plus petit poids plausible
    weights = re.findall(r'(\d{1,3}(?:\.\d)?)\s*kg', text)
    if weights:
        valid = [float(w) for w in weights if 1 < float(w) < 500]
        if valid:
            specs["weight_kg"] = min(valid)

    # IP Rating
    ip = re.search(PATTERNS["ip_rating"], text)
    if ip:
        specs["ip_rating"] = f"IP{ip.group(1)}"

    # Température de fonctionnement
    temp = re.search(PATTERNS["temp_range"], text)
    if temp:
        specs["operating_temp"] = f"{temp.group(1)}°C to +{temp.group(2)}°C"

    # Garantie
    warranty = re.search(PATTERNS["warranty"], text, re.IGNORECASE)
    if warranty:
        specs["warranty_years"] = int(warranty.group(1))

    # Capacité (batteries)
    kwh = re.search(PATTERNS["capacity_kwh"], text, re.IGNORECASE)
    if kwh:
        specs["capacity_kwh"] = float(kwh.group(1))

    ah = re.search(PATTERNS["capacity_ah"], text)
    if ah and "capacity_kwh" not in specs:
        specs["capacity_ah"] = int(ah.group(1))

    # Certifications
    certs = list(set(re.findall(PATTERNS["certifications"], text)))
    if certs:
        specs["certifications"] = sorted(certs)

    return specs


def infer_category(filename, text_snippet, specs):
    """Infer product category from filename, text content, and specs."""
    fn = filename.lower()
    txt = text_snippet.lower()[:2000] if text_snippet else ""
    if any(x in fn for x in ["battery", "batt", "luna", "bos", "storage", "lfe"]):
        return "battery"
    if any(x in fn for x in ["panel", "module", "solar-panel", "jam", "flash", "ds-flash"]):
        return "panel"
    if any(x in fn for x in ["hms", "hmt", "iq8", "micro"]):
        return "microinverter"
    if any(x in fn for x in ["optimizer", "p1300", "merc", "optimiseur"]):
        return "optimizer"
    if any(x in fn for x in ["envoy", "dtu", "dongle", "gateway", "smartlogger"]):
        return "monitoring"
    if any(x in fn for x in ["guard", "smartps"]):
        return "accessory"
    if any(x in fn for x in ["scharger"]):
        return "ev-charger"
    if any(x in fn for x in ["sun2000", "sun-", "hybrid", "inverter", "onduleur", "ktl", "sg0"]):
        return "inverter"
    # Fallback: check text content
    if "hybrid inverter" in txt or "wechselrichter" in txt or "onduleur" in txt:
        return "inverter"
    if "battery" in txt or "batterie" in txt:
        return "battery"
    return "accessory"


def slug_to_info(filepath):
    """Extract brand and model from filepath."""
    parts = Path(filepath).parts
    brand = parts[-2] if len(parts) >= 2 else "unknown"
    stem = Path(filepath).stem.replace("-datasheet", "").replace("-specs", "")
    return brand.upper(), stem.upper().replace("-", " ")


# ── MAIN ─────────────────────────────────────────────────────────────
results = []
errors = []

pdf_files = list(Path(DATASHEETS_DIR).rglob("*.pdf"))
print(f"\n{'='*60}")
print(f"  EXTRACTION SPECS TECHNIQUES — {len(pdf_files)} PDFs")
print(f"{'='*60}\n")

for pdf_path in sorted(pdf_files):
    try:
        print(f"  → {pdf_path.name}")
        text = extract_text(str(pdf_path))

        if len(text.strip()) < 50:
            print(f"     ⚠️  Texte trop court ({len(text)} chars), PDF scanné ?")
            errors.append({"file": str(pdf_path), "error": "Text too short (scanned PDF?)"})
            continue

        specs = parse_specs(text, pdf_path.name)
        brand, model = slug_to_info(str(pdf_path))
        category = infer_category(pdf_path.name, text, specs)

        # SKU depuis le nom de fichier
        sku = pdf_path.stem.replace("-datasheet", "").replace("-specs", "").upper()

        # Chemin image correspondant
        img_slug = pdf_path.stem.replace("-datasheet", "").replace("-specs", "")
        img_path = f"/products/{brand.lower()}/{img_slug}.jpg"

        output = {
            "sku": sku,
            "brand": brand,
            "model": model,
            "category": category,
            "specs": specs,
            "datasheet_url": f"/datasheets/{'/'.join(pdf_path.parts[-2:])}",
            "image_url": img_path,
            "extracted_at": datetime.datetime.now().isoformat()
        }

        # Sauvegarder JSON individuel
        out_file = Path(SPECS_DIR) / brand.lower() / f"{img_slug}.json"
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        results.append(output)
        specs_count = len([k for k in specs if k != "certifications"])
        print(f"     ✅ {specs_count} specs → {out_file}")

    except Exception as e:
        errors.append({"file": str(pdf_path), "error": str(e)})
        print(f"     ❌ Erreur : {e}")

# ── Fichier index global ──────────────────────────────────────────────
index_path = Path(SPECS_DIR) / "index.json"
with open(index_path, "w", encoding="utf-8") as f:
    json.dump({
        "generated_at": datetime.datetime.now().isoformat(),
        "total": len(results),
        "errors": len(errors),
        "products": results
    }, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"  ✅ Specs extraites : {len(results)}/{len(pdf_files)} PDFs")
print(f"  ❌ Erreurs : {len(errors)}")
print(f"  📁 Index global : {index_path}")
print(f"{'='*60}\n")

if errors:
    print("  Fichiers en erreur :")
    for e in errors:
        print(f"    - {e['file']}: {e['error']}")
