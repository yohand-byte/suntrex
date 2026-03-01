#!/usr/bin/env python3
"""
enrich-datasheets.py — Populate datasheet URLs in zoho-products.json
based on brand-specific product page patterns.

Usage: python3 scripts/enrich-datasheets.py
"""

import json
import re
import os

ZOHO_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "data", "zoho-products.json")

# Brand → base datasheet/product-page URL
BRAND_URLS = {
    "HUAWEI": "https://solar.huawei.com/fr/professionals/all-products",
    "DEYE": "https://www.deyeinverter.com/product/",
    "HOYMILES": "https://www.hoymiles.com/products/",
    "ENPHASE": "https://enphase.com/installers/microinverters",
    "PYTES": "https://www.pfrenchmenergy.com/products",
    "ESDEC": "https://esdec.com/products/",
    "K2 SYSTEMS": "https://k2-systems.com/downloads",
    "BYD": "https://www.bydbatterybox.com/",
    "AP SYSTEMS": "https://apsystems.com/products/",
    "SOLAREDGE": "https://www.solaredge.com/en/products",
    "DUALSUN": "https://dualsun.com/en/products/",
    "TRINASOLAR": "https://www.trinasolar.com/en/product",
    "JA SOLAR": "https://www.jasolar.com/html/en/products/",
    "SUNPOWER": "https://sunpower.maxeon.com/int/solar-panels",
    "SUNGROW": "https://en.sungrowpower.com/productCenter",
}


def slugify(text):
    """Convert product name/sku to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def build_datasheet_url(product):
    """Build a datasheet URL based on brand-specific patterns."""
    brand = (product.get("brand") or "").upper()
    name = product.get("name") or ""
    sku = product.get("sku") or ""

    base = BRAND_URLS.get(brand)
    if not base:
        return None

    if brand == "HUAWEI":
        # Extract model from SKU like "HUA/SUN2000-8K-LC0" → "SUN2000-8K-LC0"
        model = sku.split("/")[-1] if "/" in sku else sku
        if model:
            return f"{base}/{model}"
        return base

    if brand == "DEYE":
        # Extract model from SKU like "DEY/SUN-20K-SG05LP3-EU-SM2"
        model = sku.split("/")[-1] if "/" in sku else sku
        slug = slugify(model)
        if slug:
            return f"{base}{slug}"
        return base

    if brand == "HOYMILES":
        model = sku.split("/")[-1] if "/" in sku else sku
        slug = slugify(model)
        if slug:
            return f"{base}{slug}"
        return base

    if brand == "AP SYSTEMS":
        model = sku.split("/")[-1] if "/" in sku else sku
        slug = slugify(model)
        if slug:
            return f"{base}{slug}"
        return base

    # For brands without model-specific URLs, use the general products page
    return base


def main():
    with open(ZOHO_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    enriched = 0
    skipped = 0

    for p in products:
        if p.get("datasheet"):
            skipped += 1
            continue

        url = build_datasheet_url(p)
        if url:
            p["datasheet"] = url
            enriched += 1

    with open(ZOHO_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"Enriched {enriched} products with datasheet URLs")
    print(f"Skipped {skipped} products (already had datasheets)")
    print(f"Remaining without datasheet: {len([p for p in products if not p.get('datasheet')])}")


if __name__ == "__main__":
    main()
