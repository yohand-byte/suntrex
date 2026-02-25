#!/usr/bin/env python3
"""
SUNTREX — Product Image Scraper
Downloads product images from manufacturer websites.
Groups variants by model family (many SKUs share the same photo).

Usage:
  cd ~/Downloads/suntrex
  python3 scripts/scrape-product-images.py

Output:
  public/products/{brand}/{sku-slug}.webp
  public/products/image-map.json  (SKU → image path mapping)

Requirements:
  pip3 install requests beautifulsoup4 Pillow
"""

import os
import re
import json
import time
import hashlib
import requests
from pathlib import Path
from urllib.parse import quote_plus
from io import BytesIO

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("⚠️  Pillow not installed. Images won't be resized. Run: pip3 install Pillow")

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("⚠️  BeautifulSoup not installed. Run: pip3 install beautifulsoup4")

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════

PROJECT_DIR = Path.home() / "Downloads" / "suntrex"
OUTPUT_DIR = PROJECT_DIR / "public" / "products"
CATALOG_FILE = PROJECT_DIR / "suntrex-catalog.json"
IMAGE_MAP_FILE = OUTPUT_DIR / "image-map.json"
MAX_SIZE = (600, 600)  # Max image dimensions
QUALITY = 85
DELAY = 1.5  # Seconds between requests (be polite)
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# ═══════════════════════════════════════════════════════════════
# MODEL FAMILIES — Group SKUs that share the same product photo
# ═══════════════════════════════════════════════════════════════

MODEL_FAMILIES = {
    # HUAWEI — Onduleurs hybrides monophasés L1
    "huawei-sun2000-ktl-l1": {
        "pattern": r"HUA/SUN2000-\d+\.?\d*KTL-L1",
        "search": "Huawei SUN2000 KTL-L1 hybrid inverter product photo",
        "urls": [
            "https://solar.huawei.com/-/media/Solar/attachment/pdf/eu/datasheet/SUN2000-2-6KTL-L1.pdf",
        ],
    },
    # HUAWEI — Onduleurs hybrides monophasés LC0 (nouvelle gamme)
    "huawei-sun2000-lc0": {
        "pattern": r"HUA/SUN2000-\d+K-LC0",
        "search": "Huawei SUN2000 LC0 hybrid inverter",
        "urls": [
            "https://solar.huawei.com/en/professionals/all-products",
        ],
    },
    # HUAWEI — Onduleurs hybrides triphasés M1
    "huawei-sun2000-ktl-m1": {
        "pattern": r"HUA/SUN2000-\d+KTL-M1",
        "search": "Huawei SUN2000 KTL-M1 three phase hybrid inverter",
    },
    # HUAWEI — Onduleurs triphasés MAP0
    "huawei-sun2000-map0": {
        "pattern": r"HUA/SUN2000-\d+K-MAP0",
        "search": "Huawei SUN2000 MAP0 inverter product",
    },
    # HUAWEI — Onduleurs triphasés MB0
    "huawei-sun2000-mb0": {
        "pattern": r"HUA/SUN2000-\d+K-MB0",
        "search": "Huawei SUN2000 MB0 three phase inverter",
    },
    # HUAWEI — Onduleurs triphasés M3 (30-50kW)
    "huawei-sun2000-ktl-m3": {
        "pattern": r"HUA/OND-\d+KTL-M3",
        "search": "Huawei SUN2000 50KTL-M3 commercial inverter",
    },
    # HUAWEI — Onduleurs triphasés M5 (15-20kW)
    "huawei-sun2000-ktl-m5": {
        "pattern": r"HUA/OND-\d+KTL-M5",
        "search": "Huawei SUN2000 KTL-M5 inverter",
    },
    # HUAWEI — Batterie LUNA2000 module
    "huawei-luna2000-module": {
        "pattern": r"HUA/BAT-LUNA2000",
        "search": "Huawei LUNA2000 5 E0 battery module product",
    },
    # HUAWEI — Batterie LUNA contrôleur DC
    "huawei-luna2000-dc": {
        "pattern": r"HUA/BAT-DC-LUNA",
        "search": "Huawei LUNA2000 5KW-C0 power module",
    },
    # HUAWEI — Back-up box
    "huawei-backup-box": {
        "pattern": r"HUA/BAT-BACK",
        "search": "Huawei backup box B1 solar battery",
    },
    # HUAWEI — Optimiseurs
    "huawei-optimizer-p450": {
        "pattern": r"HUA/P450",
        "search": "Huawei SUN2000 P450 optimizer",
    },
    "huawei-optimizer-p600": {
        "pattern": r"HUA/P600",
        "search": "Huawei P600 optimizer solar",
    },
    "huawei-optimizer-p1300": {
        "pattern": r"HUA/P1300",
        "search": "Huawei P1300 optimizer solar",
    },
    # HUAWEI — Smart Dongle
    "huawei-smart-dongle": {
        "pattern": r"HUA/(WLAN|Smart dongle|SDongle)",
        "search": "Huawei Smart Dongle WLAN FE SDongleA",
    },
    # HUAWEI — Smart Power Sensor
    "huawei-smart-sensor": {
        "pattern": r"HUA/(SMART-|DTSU|SmartPS)",
        "search": "Huawei DTSU666-H smart power sensor",
    },
    # HUAWEI — EMMA
    "huawei-emma": {
        "pattern": r"HUA/EMMA",
        "search": "Huawei EMMA A02 energy management",
    },
    # HUAWEI — SmartLogger
    "huawei-smartlogger": {
        "pattern": r"HUA/SMLOG",
        "search": "Huawei SmartLogger 3000A solar",
    },
    # HUAWEI — SCharger (EV)
    "huawei-scharger": {
        "pattern": r"HUA/SCharger",
        "search": "Huawei SCharger 7KS EV charger solar",
    },
    # HUAWEI — SmartGuard
    "huawei-smartguard": {
        "pattern": r"HUA/SmartGuard",
        "search": "Huawei SmartGuard 63A solar",
    },
    # HUAWEI — 100KTL
    "huawei-100ktl": {
        "pattern": r"HUA/SUN2000-100KTL",
        "search": "Huawei SUN2000 100KTL-M2 commercial inverter",
    },

    # DEYE — Hybrides monophasés LP1 (SG03)
    "deye-mono-sg03lp1": {
        "pattern": r"DEY/SUN-\d+\.?\d*K-SG03LP1",
        "search": "Deye SUN SG03LP1 hybrid inverter monophase",
    },
    # DEYE — Hybrides monophasés LP1 (SG04)
    "deye-mono-sg04lp1": {
        "pattern": r"DEY/SUN-\d+K-SG04LP1",
        "search": "Deye SUN-6K-SG04LP1-EU hybrid inverter",
    },
    # DEYE — Hybrides monophasés LP1 (SG01)
    "deye-mono-sg01lp1": {
        "pattern": r"DEY/SUN-\d+K-SG01LP1",
        "search": "Deye SUN-8K-SG01LP1-EU hybrid inverter",
    },
    # DEYE — Hybrides triphasés LP3 (basse tension)
    "deye-tri-sg04lp3": {
        "pattern": r"DEY/SUN-\d+K-SG04LP3",
        "search": "Deye SUN-12K-SG04LP3-EU hybrid three phase inverter",
    },
    # DEYE — Hybrides triphasés LP3 (SG05)
    "deye-tri-sg05lp3": {
        "pattern": r"DEY/SUN-\d+K-SG05LP3",
        "search": "Deye SUN-20K-SG05LP3-EU hybrid inverter",
    },
    # DEYE — Hybrides triphasés HP3 (haute tension)
    "deye-tri-hp3": {
        "pattern": r"DEY/SUN-\d+K-SG01HP3",
        "search": "Deye SUN SG01HP3-EU high voltage hybrid inverter",
    },
    # DEYE — Onduleurs tertiaires
    "deye-commercial": {
        "pattern": r"DEY/SUN-\d+K-G0[34]",
        "search": "Deye SUN-50K commercial string inverter",
    },
    # DEYE — Onduleurs centraux
    "deye-central": {
        "pattern": r"DEY/SUN-\d+K-G06P3",
        "search": "Deye SUN-6K-G06P3-EU central inverter",
    },
    # DEYE — Batterie SE-G5.1 Pro
    "deye-battery-se-g5": {
        "pattern": r"DEY/SE-G5",
        "search": "Deye SE-G5.1 Pro-B LiFePO4 battery",
    },
    # DEYE — Batterie BOS-GM5.1
    "deye-battery-bos": {
        "pattern": r"DEY/BOS-GM",
        "search": "Deye BOS-GM5.1 high voltage battery module",
    },
    # DEYE — BMS HV
    "deye-bms": {
        "pattern": r"DEY/HVB750",
        "search": "Deye HVB750V BMS high voltage battery",
    },
    # DEYE — Rack
    "deye-rack": {
        "pattern": r"DEY/3U",
        "search": "Deye battery rack cabinet 13U",
    },
    # DEYE — Optimiseur
    "deye-optimizer": {
        "pattern": r"DEY/SUN-XL",
        "search": "Deye SUN-XL02-A optimizer",
    },
    # DEYE — Smart sensors
    "deye-smart": {
        "pattern": r"DEY/SUN-SMART",
        "search": "Deye SUN-SMART-CT01 current sensor",
    },

    # PYTES — V5 battery
    "pytes-v5": {
        "pattern": r"PYT/V5[°a]?$|PYT/V5°$",
        "search": "Pytes V5 alpha LiFePO4 battery 5.12kWh",
    },
    # PYTES — E-Box
    "pytes-ebox": {
        "pattern": r"PYT/E-Box",
        "search": "Pytes E-Box 48100R battery",
    },
    # PYTES — V-Box cabinet
    "pytes-vbox": {
        "pattern": r"PYT/V-Box",
        "search": "Pytes V-Box IC indoor cabinet battery",
    },
    # PYTES — Cables & accessories
    "pytes-cables": {
        "pattern": r"PYT/(BTI|BUSTI|C3500|EXT|BRACKETS|CONSOLE|LSW|Busbar)",
        "search": "Pytes battery cable accessories",
    },
    # PYTES — Kits
    "pytes-kits": {
        "pattern": r"PYT/.*KIT",
        "search": "Pytes battery kit 5kWh installation",
    },

    # HOYMILES — Micro-onduleurs HMS
    "hoymiles-hms": {
        "pattern": r"HM[YS]/(HMS|HMT)",
        "search": "Hoymiles HMS micro inverter product photo",
    },
    # HOYMILES — DTU
    "hoymiles-dtu": {
        "pattern": r"HM[YS]/DTU",
        "search": "Hoymiles DTU monitoring gateway",
    },

    # ENPHASE — IQ8 micro-inverters
    "enphase-iq8": {
        "pattern": r"ENP.*IQ8",
        "search": "Enphase IQ8 micro inverter product",
    },
    # ENPHASE — IQ Battery
    "enphase-battery": {
        "pattern": r"ENP.*(battery|batt)",
        "search": "Enphase IQ Battery 5P product",
    },

    # ESDEC — ClickFit EVO rails
    "esdec-clickfit-rail": {
        "pattern": r"(ESD/)?10081[3-4]\d",
        "search": "Esdec ClickFit EVO mounting rail solar",
    },
    # ESDEC — ClickFit EVO hooks
    "esdec-clickfit-hook": {
        "pattern": r"(ESD/)?10080[4]\d",
        "search": "Esdec ClickFit EVO roof hook solar",
    },
    # ESDEC — ClickFit EVO coupler
    "esdec-clickfit-coupler": {
        "pattern": r"ESD/1008061",
        "search": "Esdec ClickFit EVO rail coupler",
    },
    # ESDEC — FlatFix
    "esdec-flatfix": {
        "pattern": r"(ESD/)?100[47]\d{3}|FlatFix",
        "search": "Esdec FlatFix Fusion flat roof solar mounting",
    },

    # K2 SYSTEMS
    "k2-systems": {
        "pattern": r"K2S/",
        "search": "K2 Systems solar mounting structure roof",
    },

    # AP SYSTEMS
    "apsystems-micro": {
        "pattern": r"APS/",
        "search": "APsystems DS3 QT2 micro inverter product",
    },

    # SOLAREDGE
    "solaredge": {
        "pattern": r"SE/",
        "search": "SolarEdge inverter optimizer product photo",
    },
}

# ═══════════════════════════════════════════════════════════════
# KNOWN DIRECT IMAGE URLS (most reliable)
# ═══════════════════════════════════════════════════════════════

KNOWN_IMAGES = {
    "huawei-luna2000-module": "https://solar.huawei.com/-/media/Solar/Product/Residential/SmartESS/LUNA2000/LUNA2000-5-15-S1.png",
    "huawei-luna2000-dc": "https://solar.huawei.com/-/media/Solar/Product/Residential/SmartESS/LUNA2000/LUNA2000-5-15-S1.png",
    "huawei-sun2000-ktl-l1": "https://solar.huawei.com/-/media/Solar/Product/Residential/Inverter/SUN2000-2-6KTL-L1/SUN2000-2-6KTL-L1-Front.png",
}

# ═══════════════════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def slugify(text):
    """Convert text to filesystem-safe slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text[:80]


def download_image(url, save_path, resize=True):
    """Download image from URL and optionally resize."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, stream=True)
        resp.raise_for_status()
        
        content_type = resp.headers.get('content-type', '')
        if 'image' not in content_type and 'octet-stream' not in content_type:
            return False
        
        if HAS_PIL and resize:
            img = Image.open(BytesIO(resp.content))
            # Convert to RGB if needed (for WebP output)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGBA')
                # White background for transparency
                bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
                bg.paste(img, mask=img.split()[3])
                img = bg.convert('RGB')
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            img.thumbnail(MAX_SIZE, Image.LANCZOS)
            img.save(save_path, 'WEBP', quality=QUALITY)
        else:
            with open(save_path, 'wb') as f:
                f.write(resp.content)
        
        return True
    except Exception as e:
        print(f"    ❌ Download failed: {e}")
        return False


def search_google_images(query, num=3):
    """Search Google Images and return image URLs (scraping approach)."""
    if not HAS_BS4:
        return []
    
    search_url = f"https://www.google.com/search?tbm=isch&q={quote_plus(query)}"
    try:
        resp = requests.get(search_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Extract image URLs from Google results
        img_urls = []
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src.startswith('http') and 'google' not in src and 'gstatic' not in src:
                img_urls.append(src)
            if len(img_urls) >= num:
                break
        
        return img_urls
    except Exception:
        return []


def search_bing_images(query, num=3):
    """Search Bing Images as fallback."""
    search_url = f"https://www.bing.com/images/search?q={quote_plus(query)}&first=1"
    try:
        resp = requests.get(search_url, headers=HEADERS, timeout=10)
        # Extract image URLs from thumbnail data attributes
        urls = re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', resp.text)
        return urls[:num]
    except Exception:
        return []


def generate_placeholder_svg(brand, category, sku, save_path):
    """Generate a branded placeholder SVG for products without images."""
    colors = {
        'HUAWEI': ('#e4002b', '#fff'),
        'DEYE': ('#0068b7', '#fff'),
        'PYTES': ('#1a8c37', '#fff'),
        'HOYMILES': ('#ff6600', '#fff'),
        'Enphase': ('#f47920', '#fff'),
        'ESDEC': ('#003da6', '#fff'),
        'K2 SYSTEMS': ('#333', '#fff'),
        'AP Systems': ('#0066cc', '#fff'),
        'SolarEdge': ('#e21e26', '#fff'),
    }
    
    bg, fg = colors.get(brand, ('#666', '#fff'))
    
    icons = {
        'inverters': '⚡', 'batteries': '🔋', 'solar_panels': '☀️',
        'mounting': '🔧', 'cables': '🔌', 'micro_inverters': '⚡',
        'monitoring': '📡', 'optimizers': '📊', 'ev_charging': '🔌',
        'accessories': '🛠️',
    }
    icon = icons.get(category, '📦')
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f8f9fa" rx="12"/>
  <rect x="20" y="20" width="360" height="360" fill="{bg}" opacity="0.08" rx="8"/>
  <text x="200" y="160" text-anchor="middle" font-size="64">{icon}</text>
  <text x="200" y="220" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" fill="{bg}">{brand}</text>
  <text x="200" y="250" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="#64748b">{sku}</text>
  <text x="200" y="340" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#94a3b8">Image bientôt disponible</text>
</svg>'''
    
    with open(save_path, 'w') as f:
        f.write(svg)
    return True


# ═══════════════════════════════════════════════════════════════
# MAIN SCRAPER
# ═══════════════════════════════════════════════════════════════

def main():
    print("🖼️  SUNTREX Product Image Scraper")
    print("=" * 60)
    
    # Load catalog
    if not CATALOG_FILE.exists():
        print(f"❌ Catalog not found: {CATALOG_FILE}")
        print("   Run the catalog parser first or place suntrex-catalog.json in the project root.")
        return
    
    with open(CATALOG_FILE) as f:
        catalog = json.load(f)
    
    print(f"📦 {len(catalog)} products loaded")
    
    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    brands_dirs = set(slugify(p['brand']) for p in catalog)
    for bd in brands_dirs:
        (OUTPUT_DIR / bd).mkdir(exist_ok=True)
    
    # Map each SKU to a model family
    sku_to_family = {}
    for family_id, family in MODEL_FAMILIES.items():
        pattern = re.compile(family['pattern'], re.IGNORECASE)
        for product in catalog:
            if pattern.search(product['sku']):
                sku_to_family[product['sku']] = family_id
    
    # Stats
    matched = len(sku_to_family)
    unmatched = len(catalog) - matched
    print(f"🔗 {matched} SKUs matched to {len(MODEL_FAMILIES)} model families")
    print(f"❓ {unmatched} SKUs unmatched (will get placeholders)")
    print()
    
    # Download one image per family
    image_map = {}  # SKU → relative image path
    family_images = {}  # family_id → image path
    
    downloaded = 0
    placeholders = 0
    failed = 0
    
    # Phase 1: Download family images
    print("━━━ Phase 1: Downloading family images ━━━")
    for family_id, family in MODEL_FAMILIES.items():
        # Find SKUs in this family
        family_skus = [sku for sku, fid in sku_to_family.items() if fid == family_id]
        if not family_skus:
            continue
        
        # Get brand from first matching product
        brand = next((p['brand'] for p in catalog if p['sku'] == family_skus[0]), 'unknown')
        brand_slug = slugify(brand)
        img_filename = f"{family_id}.webp"
        img_path = OUTPUT_DIR / brand_slug / img_filename
        rel_path = f"/products/{brand_slug}/{img_filename}"
        
        if img_path.exists():
            print(f"  ✅ {family_id} — already exists ({len(family_skus)} SKUs)")
            family_images[family_id] = rel_path
            for sku in family_skus:
                image_map[sku] = rel_path
            downloaded += 1
            continue
        
        print(f"  🔍 {family_id} ({len(family_skus)} SKUs) — searching...")
        
        success = False
        
        # Try known direct URLs first
        if family_id in KNOWN_IMAGES:
            print(f"    → Trying known URL...")
            success = download_image(KNOWN_IMAGES[family_id], img_path)
        
        # Try Bing image search
        if not success and family.get('search'):
            print(f"    → Searching: {family['search'][:50]}...")
            urls = search_bing_images(family['search'])
            for url in urls:
                if download_image(url, img_path):
                    success = True
                    break
                time.sleep(0.5)
        
        if success:
            print(f"    ✅ Downloaded!")
            family_images[family_id] = rel_path
            for sku in family_skus:
                image_map[sku] = rel_path
            downloaded += 1
        else:
            # Generate placeholder
            svg_path = OUTPUT_DIR / brand_slug / f"{family_id}.svg"
            category = next((p['category'] for p in catalog if p['sku'] == family_skus[0]), 'accessories')
            generate_placeholder_svg(brand, category, family_skus[0], svg_path)
            svg_rel = f"/products/{brand_slug}/{family_id}.svg"
            family_images[family_id] = svg_rel
            for sku in family_skus:
                image_map[sku] = svg_rel
            placeholders += 1
            print(f"    📎 Placeholder generated")
        
        time.sleep(DELAY)
    
    # Phase 2: Handle unmatched SKUs (placeholder only)
    print(f"\n━━━ Phase 2: Generating placeholders for unmatched SKUs ━━━")
    for product in catalog:
        if product['sku'] not in image_map:
            brand_slug = slugify(product['brand'])
            sku_slug = slugify(product['sku'])
            svg_path = OUTPUT_DIR / brand_slug / f"{sku_slug}.svg"
            
            if not svg_path.exists():
                generate_placeholder_svg(
                    product['brand'], 
                    product['category'], 
                    product['sku'], 
                    svg_path
                )
            
            image_map[product['sku']] = f"/products/{brand_slug}/{sku_slug}.svg"
            placeholders += 1
    
    # Save image map
    with open(IMAGE_MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(image_map, f, ensure_ascii=False, indent=2)
    
    # Summary
    print(f"\n{'=' * 60}")
    print(f"🎉 DONE!")
    print(f"  📸 Downloaded: {downloaded} family images")
    print(f"  📎 Placeholders: {placeholders}")
    print(f"  ❌ Failed: {failed}")
    print(f"  📄 Image map: {IMAGE_MAP_FILE}")
    print(f"\n  Total SKUs mapped: {len(image_map)}/{len(catalog)}")
    
    # Generate report of what needs manual work
    report_path = OUTPUT_DIR / "MANUAL-IMAGES-NEEDED.md"
    with open(report_path, 'w') as f:
        f.write("# Images à télécharger manuellement\n\n")
        f.write("Ces familles de produits n'ont pas pu être scrapées automatiquement.\n")
        f.write("Téléchargez les images depuis les sites fabricants et placez-les dans le bon dossier.\n\n")
        
        for family_id, family in MODEL_FAMILIES.items():
            if family_id in family_images and '.svg' in family_images[family_id]:
                family_skus = [sku for sku, fid in sku_to_family.items() if fid == family_id]
                brand = next((p['brand'] for p in catalog if p['sku'] == family_skus[0]), '?')
                f.write(f"## {brand} — {family_id}\n")
                f.write(f"- Recherche Google: `{family.get('search', 'N/A')}`\n")
                f.write(f"- SKUs concernés: {', '.join(family_skus[:5])}\n")
                f.write(f"- Destination: `public/products/{slugify(brand)}/{family_id}.webp`\n\n")
    
    print(f"  📋 Manual report: {report_path}")


if __name__ == "__main__":
    main()
