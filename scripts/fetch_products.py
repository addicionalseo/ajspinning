#!/usr/bin/env python3
# scripts/fetch_products.py
# Descarga productos de AliExpress Affiliate API y guarda en data/products.json

import json
import os
import sys
import time
from pathlib import Path

# Añadir raíz del proyecto al path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from scripts.config import CATEGORIES
from scripts.aliexpress_api import search_products, generate_affiliate_link, normalize_product

DATA_FILE = ROOT / "data" / "products.json"


def fetch_category(slug: str, config: dict) -> list:
    """Descarga todos los productos de una categoría paginando la API."""
    print(f"\nDescargando categoria: {config['name']} ({config['keywords']})")
    
    all_products = []
    page = 1
    page_size = 20
    max_products = config.get("max_products", 40)

    while len(all_products) < max_products:
        print(f"   Página {page}...", end=" ", flush=True)
        result = search_products(
            keywords=config["keywords"],
            page=page,
            page_size=page_size,
            sort="LAST_VOLUME_DESC"  # más vendidos primero
        )
        raw_products = result.get("products", [])
        if not raw_products:
            print("sin resultados, fin.")
            break

        for raw in raw_products:
            # promotion_link ya viene en la respuesta de la API — no hace falta llamada extra
            product = normalize_product(raw)
            product["category_slug"] = slug
            all_products.append(product)

        print(f"{len(raw_products)} productos.")

        total = result.get("total_count", 0)
        fetched = page * page_size
        if fetched >= total or fetched >= max_products:
            break
        page += 1
        time.sleep(0.5)
    print(f"   OK Total {config['name']}: {len(all_products)} productos")
    return all_products[:max_products]


def main():
    print("=" * 50)
    print("AJSpinning - Fetch de productos AliExpress")
    print("=" * 50)

    # Cargar productos existentes si los hay
    existing = {}
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Indexar por category_slug
        for p in data.get("products", []):
            cat = p.get("category_slug")
            if cat not in existing:
                existing[cat] = []
            existing[cat].append(p)
        print(f"Productos existentes cargados: {len(data.get('products', []))}")

    # Determinar qué categorías actualizar
    args = sys.argv[1:]
    cats_to_fetch = args if args else list(CATEGORIES.keys())
    print(f"Categorias a actualizar: {', '.join(cats_to_fetch)}\n")

    all_products = []

    for slug, config in CATEGORIES.items():
        if slug not in cats_to_fetch:
            # Mantener productos existentes de categorías no actualizadas
            all_products.extend(existing.get(slug, []))
            continue
        products = fetch_category(slug, config)
        all_products.extend(products)

    # Guardar
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(all_products),
        "products": all_products,
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 50}")
    print(f"OK Guardados {len(all_products)} productos en {DATA_FILE}")
    print("Siguiente paso: python scripts/generate_pages.py")


if __name__ == "__main__":
    main()
