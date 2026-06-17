# scripts/aliexpress_api.py
# Wrapper oficial para AliExpress Affiliate Open Platform
# Docs: https://open.aliexpress.com/doc/api.htm

import hashlib
import hmac
import time
import json
import urllib.parse
import urllib.request
from scripts.config import ALIEXPRESS_CONFIG


def _sign(params: dict, secret: str) -> str:
    """Genera la firma HMAC-MD5 requerida por la API de AliExpress."""
    sorted_params = sorted(params.items())
    base_string = secret + "".join(f"{k}{v}" for k, v in sorted_params) + secret
    return hashlib.md5(base_string.encode("utf-8")).hexdigest().upper()


def _call(method: str, params: dict) -> dict:
    """Realiza una llamada a la API y devuelve el JSON de respuesta."""
    cfg = ALIEXPRESS_CONFIG
    base_params = {
        "method":        method,
        "app_key":       cfg["app_key"],
        "timestamp":     str(int(time.time() * 1000)),
        "format":        "json",
        "v":             "2.0",
        "sign_method":   "md5",
    }
    all_params = {**base_params, **params}
    all_params["sign"] = _sign(all_params, cfg["app_secret"])

    url = cfg["endpoint"]
    data = urllib.parse.urlencode(all_params).encode("utf-8")

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_products(keywords: str, page: int = 1, page_size: int = 20,
                    sort: str = "SALE_PRICE_ASC") -> dict:
    """
    Busca productos afiliados por palabras clave.
    sort: SALE_PRICE_ASC | SALE_PRICE_DESC | LAST_VOLUME_ASC | LAST_VOLUME_DESC
    Devuelve dict con 'products' (lista) y 'total_count'.
    """
    cfg = ALIEXPRESS_CONFIG
    params = {
        "keywords":           keywords,
        "tracking_id":        cfg["tracking_id"],
        "page_no":            str(page),
        "page_size":          str(page_size),
        "sort":               sort,
        "target_currency":    "EUR",
        "target_language":    "ES",
        "fields":             "product_id,product_title,product_main_image_url,"
                              "sale_price,original_price,target_sale_price,target_original_price,"
                              "discount,product_detail_url,promotion_link,"
                              "second_level_category_name,evaluate_rate,lastest_volume",
    }
    raw = _call("aliexpress.affiliate.product.query", params)

    resp_key = "aliexpress_affiliate_product_query_response"
    if resp_key not in raw:
        print(f"[API ERROR] Respuesta inesperada: {raw}")
        return {"products": [], "total_count": 0}

    result = raw[resp_key].get("resp_result", {})
    if result.get("resp_code") != 200:
        print(f"[API ERROR] Código {result.get('resp_code')}: {result.get('resp_msg')}")
        return {"products": [], "total_count": 0}

    data = result.get("result", {})
    products = data.get("products", {}).get("product", [])
    total = int(data.get("total_record_num", 0))
    return {"products": products, "total_count": total}


def generate_affiliate_link(product_url: str) -> str:
    """
    Genera un link de afiliado con tracking para una URL de producto.
    Devuelve el promotion_link o la URL original si falla.
    """
    cfg = ALIEXPRESS_CONFIG
    params = {
        "promotion_link_type": "0",
        "source_values":       product_url,
        "tracking_id":         cfg["tracking_id"],
    }
    raw = _call("aliexpress.affiliate.link.generate", params)

    resp_key = "aliexpress_affiliate_link_generate_response"
    if resp_key not in raw:
        return product_url

    result = raw[resp_key].get("resp_result", {})
    if result.get("resp_code") != 200:
        return product_url

    links = result.get("result", {}).get("promotion_links", {}).get("promotion_link", [])
    if links:
        return links[0].get("promotion_link", product_url)
    return product_url


def normalize_product(raw: dict, affiliate_link: str = None) -> dict:
    """Normaliza un producto de la API al formato interno del proyecto."""
    import re

    title = raw.get("product_title", "")
    # Slug limpio para URLs
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower())[:60].strip("-")
    slug = f"{slug}-{raw.get('product_id', '')}"

    # Usar target_sale_price (EUR) si está disponible, sino sale_price (USD)
    sale = raw.get("target_sale_price") or raw.get("sale_price", "0")
    original = raw.get("target_original_price") or raw.get("original_price", sale)
    try:
        sale_f = float(sale)
        orig_f = float(original)
        discount = round((1 - sale_f / orig_f) * 100) if orig_f > 0 else 0
    except Exception:
        sale_f, orig_f, discount = 0.0, 0.0, 0

    # El promotion_link ya viene en la respuesta, úsalo si no se pasó uno externo
    url = affiliate_link or raw.get("promotion_link") or raw.get("product_detail_url", "")

    return {
        "id":             raw.get("product_id"),
        "title":          title,
        "slug":           slug,
        "image":          raw.get("product_main_image_url", ""),
        "price":          round(sale_f, 2),
        "price_original": round(orig_f, 2),
        "currency":       "EUR",
        "discount":       discount,
        "rating":         raw.get("evaluate_rate", ""),
        "sales":          raw.get("lastest_volume", 0),
        "url":            url,
        "category":       raw.get("second_level_category_name", ""),
    }
