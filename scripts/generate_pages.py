#!/usr/bin/env python3
# scripts/generate_pages.py

import json, re, shutil, sys, time, unicodedata
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
from scripts.config import CATEGORIES, SITE_CONFIG

DATA_FILE = ROOT / "data" / "products.json"
CAT_DIR   = ROOT / "categoria"
PROD_DIR  = ROOT / "producto"
GUIA_DIR  = ROOT / "guia"
OUT_DIR   = ROOT / "out"
SITEMAP   = ROOT / "sitemap.xml"

BASE_URL  = SITE_CONFIG["base_url"]
SITE_NAME = SITE_CONFIG["site_name"]
TODAY     = time.strftime("%Y-%m-%d")
YEAR      = time.strftime("%Y")
CSS_ASSET_VERSION = "20260611-1"
JS_ASSET_VERSION = "20260610-2"
DEFAULT_ROBOTS = "index,follow,max-image-preview:large"
PRODUCT_ROBOTS = "noindex,nofollow,max-image-preview:large"
SHOP_ROBOTS = "noindex,follow,max-image-preview:large"
CATEGORY_ROBOTS = "noindex,follow,max-image-preview:large"
ADSENSE_CLIENT = "ca-pub-8807692365779886"
ADSENSE_ON_CATEGORY_PAGES = True
ADSENSE_ON_SHOP_PAGE = True
GUIDE_RELATED_PRODUCT_LIMIT = 2
SHOP_SLUG = "productos"
SHOP_URL = f"/{SHOP_SLUG}/"
INTERACTIVE_GUIDE_SLUG = "guia-interactiva"
INTERACTIVE_GUIDE_URL = f"/{INTERACTIVE_GUIDE_SLUG}/"
MINIGAME_SLUG = "minijuego-pesca"
MINIGAME_URL = f"/{MINIGAME_SLUG}/"
LOCKED_VISIBLE_HTML = [
    "index.html",
    "guia/index.html",
    "pesca-spinning/index.html",
    "tienda-de-pesca/index.html",
    "empieza-aqui/index.html",
    "metodologia/index.html",
    "sobre-nosotros/index.html",
    "equipo-editorial/index.html",
    "politica-afiliacion/index.html",
    "contacto/index.html",
]

def outbound_path(slug: str) -> str:
    return f"/out/{slug}/"


def load_locked_visible_html():
    locked_pages = {}
    for relative_path in LOCKED_VISIBLE_HTML:
        source = ROOT / relative_path
        if not source.exists():
            raise FileNotFoundError(f"No se encuentra la plantilla visible bloqueada: {source}")
        locked_pages[relative_path] = source.read_bytes()
    return locked_pages


def rewrite_locked_visible_html(locked_pages):
    locked_urls = []
    for relative_path, html_bytes in locked_pages.items():
        source = ROOT / relative_path
        source.write_bytes(html_bytes)
        if relative_path == "index.html":
            locked_urls.append(f"{BASE_URL}/")
        else:
            locked_urls.append(f"{BASE_URL}/{relative_path[:-11]}/")
        print(f"  OK bloqueada /{relative_path}")

    return locked_urls

EDITORIAL_TEAM = {
    "name": "Equipo editorial AJSpinning",
    "role": "Pescadores recreativos y analistas de material",
    "bio": (
        "Creamos guías prácticas para spinning en España y revisamos material de "
        "pesca con foco en utilidad real, presupuesto y contexto de uso."
    ),
}

# ─── Contenido editorial por categoría ───────────────────────────────────────

CATEGORY_CONTENT = {
    "senueulos": {
        "guide_title": "Cómo elegir señuelos de pesca spinning: guía completa",
        "guide_body": """
<p>Los <strong>señuelos artificiales</strong> son el elemento más versátil del pescador de spinning. Conocer los distintos tipos y cuándo usar cada uno marca la diferencia entre una jornada productiva y volver a casa con las manos vacías. Esta guía te explica todo lo que necesitas saber antes de comprar.</p>

<div class="fact-grid">
  <div class="fact-card"><div class="fact-card-num">5+</div><div class="fact-card-label">Tipos de señuelo para dominar</div></div>
  <div class="fact-card"><div class="fact-card-num">3–25 cm</div><div class="fact-card-label">Tallas según especie</div></div>
  <div class="fact-card"><div class="fact-card-num">desde 0,84 €</div><div class="fact-card-label">Precio en AliExpress</div></div>
  <div class="fact-card"><div class="fact-card-num">4 especies</div><div class="fact-card-label">Lucio · Lubina · Trucha · Siluro</div></div>
</div>

<div class="content-divider"><span>Tipos de señuelo</span></div>

<h3>Minnow (pececillo hundido o flotante)</h3>
<p>El minnow imita un pez pequeño herido. Los modelos <strong>flotantes</strong> son perfectos para aguas someras y para lucio en zonas con vegetación. Los <strong>hundidos</strong> permiten trabajar a media agua o fondo. Son los señuelos más populares en España para lubina, lucio y trucha.</p>

<div class="tip-box">
  <div class="tip-box-title">✅ Consejo para principiantes</div>
  <p>Empieza con 2–3 minnows de 7–9 cm: uno en color plata, uno en colores naturales (perca o trucha) y uno en chartreuse. Con estos tres cubres el 80% de las situaciones.</p>
</div>

<h3>Crankbait (manivela)</h3>
<p>Su pronunciada billa los hace bucear a profundidades determinadas. Ideales para barrer distintas capas de agua rápidamente y para embalses con perca o lucio en suspensión a media agua. La clave está en elegir el crankbait con la profundidad de buceo correcta para la zona.</p>

<h3>Jig (plomo con goma de silicona)</h3>
<p>Probablemente el señuelo más efectivo y económico. Se trabaja a cualquier profundidad con técnicas como drop-shot, Texas Rig o jig head clásico. Imprescindible para lucio en el Ebro o lubina en zonas rocosas.</p>

<h3>Spinnerbait y Popper de superficie</h3>
<p>Las <strong>paletas giratorias</strong> del spinnerbait generan vibración y destellos que atraen peces incluso en aguas turbias. Los <strong>poppers</strong> trabajan en superficie y producen las picadas más espectaculares del spinning: ver al pez romper el agua para atacar el señuelo es una experiencia única.</p>

<div class="pro-tip">
  <div class="pro-tip-title">💡 Regla de color</div>
  <p><strong>Agua clara = colores naturales</strong> (plata, dorado, verde). <strong>Agua turbia o poca luz = colores vivos</strong> (chartreuse, naranja, rojo). Para lubina en el mar, el plateado imitando boquerón es siempre una apuesta segura.</p>
</div>

<div class="content-divider"><span>Tallas por especie</span></div>

<h3>Guía de tamaños según especie objetivo</h3>
<table>
  <thead><tr><th>Especie</th><th>Longitud señuelo</th><th>Peso</th><th>Tipos recomendados</th></tr></thead>
  <tbody>
    <tr><td><strong>Trucha de río</strong></td><td>3–6 cm</td><td>3–8 g</td><td>Minnow, spinner, jig pequeño</td></tr>
    <tr><td><strong>Lucio / Perca</strong></td><td>7–14 cm</td><td>7–21 g</td><td>Minnow, jerkbait, crankbait, jig</td></tr>
    <tr><td><strong>Lubina (mar)</strong></td><td>8–14 cm</td><td>10–28 g</td><td>Minnow hundido, popper, jig</td></tr>
    <tr><td><strong>Siluro / Grandes</strong></td><td>15–25 cm</td><td>30–100 g</td><td>Swimbait, jig grande, crankbait</td></tr>
  </tbody>
</table>

<div class="warning-box">
  <div class="warning-box-title">⚠️ Sobre los anzuelos de señuelos baratos</div>
  <p>Los señuelos económicos de AliExpress son excelentes, pero sus anzuelos triples suelen ser blandos. Considera sustituirlos por anzuelos Owner o Gamakatsu (1–2 € por unidad) para mejorar el ratio de captura y la resistencia al forzar al pez.</p>
</div>

<p>Con señuelos de AliExpress de marcas como BEARKING, Kingdom o Hengjia puedes montar un surtido de 20–30 unidades por menos de 50 €, cubriendo todas las situaciones. Son utilizados por pescadores avanzados en toda España con excelentes resultados.</p>
""",
        "faq": [
            ("¿Qué señuelos son mejores para pescar lucio?", "Para lucio los más efectivos son minnows grandes (10–14 cm), jerkbaits y swimbaits. Los colores naturales (perca, trucha, verde/amarillo) funcionan bien en aguas claras, y los colores llamativos en días nublados o aguas con color. Los crankbaits también son muy efectivos en embalses cuando el lucio está a media agua."),
            ("¿Qué señuelos usar para lubina en el mar?", "La lubina responde muy bien a minnows hundidos de 8–12 cm en colores plateados o azul/plata que imitan boquerón. También a poppers en superficie cuando hay actividad de peces forrajeando. En zonas rocosas, los jigs de 15–25 g son muy versátiles. Por la noche, los señuelos en colores oscuros (negro, violeta) son muy efectivos."),
            ("¿Los señuelos baratos de AliExpress funcionan bien?", "Sí, muchos señuelos de AliExpress ofrecen una excelente relación calidad-precio. Marcas como BEARKING, Kingdom, Hengjia o Proberos son reconocidas entre la comunidad de pescadores. Los anzuelos pueden ser de menor calidad y conviene cambiarlos por unos premium (Owner, Gamakatsu), pero los cuerpos y las acciones son perfectamente válidos para pescar."),
            ("¿Cuántos señuelos necesito para empezar?", "Con 8–10 señuelos bien seleccionados tienes más que suficiente para empezar. Recomendamos: 2–3 minnows en distintos tamaños y colores, 1–2 crankbaits, 2–3 jigs de silicona y 1–2 spinnerbaits o señuelos de superficie. Cubre así casi todas las situaciones que te encontrarás en ríos y embalses españoles."),
            ("¿Qué señuelo usar para trucha?", "Para trucha de río los mejores señuelos son pequeños minnows de 3–5 cm con acciones vivas, cucharillas giratorias (spinners) de 3–7 g y pequeños jigs de 2–5 g. Los colores que más funcionan en ríos claros de montaña son el dorado, el cobre y los naturales. En cotos intensivos donde los peces son más selectivos, los señuelos naturalistas de colores vivos (chartreuse, naranja) también dan resultados."),
        ]
    },
    "carretes": {
        "guide_title": "Cómo elegir el carrete de spinning ideal: guía de compra",
        "guide_body": """
<p>El <strong>carrete de spinning</strong> es el corazón de tu equipo. Un buen carrete marca la diferencia en la distancia de lanzado, la sensación en la recuperación y la durabilidad a largo plazo. Entender los parámetros clave te ayudará a elegir el mejor carrete para tu presupuesto sin pagar de más.</p>

<div class="fact-grid">
  <div class="fact-card"><div class="fact-card-num">2500</div><div class="fact-card-label">Talla más versátil para empezar</div></div>
  <div class="fact-card"><div class="fact-card-num">5+1</div><div class="fact-card-label">Mínimo de rodamientos recomendado</div></div>
  <div class="fact-card"><div class="fact-card-num">6.2:1</div><div class="fact-card-label">Ratio ideal para uso general</div></div>
  <div class="fact-card"><div class="fact-card-num">desde 2 €</div><div class="fact-card-label">Precio en AliExpress</div></div>
</div>

<div class="content-divider"><span>Tallas de carrete</span></div>

<h3>¿Qué talla de carrete necesito?</h3>
<p>La talla del carrete determina la cantidad de línea que puede almacenar y el tipo de pesca para el que está diseñado:</p>
<table>
  <thead><tr><th>Talla</th><th>Uso</th><th>Señuelos</th><th>Línea</th></tr></thead>
  <tbody>
    <tr><td><strong>1000–2000</strong></td><td>Ultraligero · Trucha</td><td>1–7 g</td><td>0,10–0,16 mm</td></tr>
    <tr><td><strong>2500–3000</strong></td><td>Ligero/Medio · Lucio · Lubina</td><td>5–20 g</td><td>0,16–0,22 mm</td></tr>
    <tr><td><strong>4000–5000</strong></td><td>Medio/Pesado · Surfcasting</td><td>15–40 g</td><td>0,22–0,30 mm</td></tr>
    <tr><td><strong>6000+</strong></td><td>Pesado · Siluro · Mar</td><td>40 g+</td><td>0,30 mm+</td></tr>
  </tbody>
</table>

<div class="tip-box">
  <div class="tip-box-title">✅ Para empezar en España</div>
  <p>La talla 2500 o 3000 es la más versátil. Sirve para lucio en embalse, lubina costera y la mayoría de situaciones en ríos medianos. Si solo vas a comprar un carrete, elige este rango.</p>
</div>

<div class="content-divider"><span>Ratio y rodamientos</span></div>

<h3>Relación de recuperación (ratio)</h3>
<p>El ratio indica cuántas vueltas de línea recoge el carrete por cada vuelta de manivela. Un ratio <strong>5.2:1</strong> es lento y potente —ideal para crankbaits y swimbaits que necesitan trabajarse despacio—. El <strong>6.2:1</strong> es el más versátil. Los ratios <strong>7.0:1 o superiores</strong> permiten recuperaciones rápidas, ideales para jigging.</p>

<div class="pro-tip">
  <div class="pro-tip-title">💡 La trampa de los rodamientos</div>
  <p>Más rodamientos no siempre significa mejor carrete. Un carrete con 5 rodamientos de acero inoxidable de calidad supera a uno con 12 rodamientos baratos. Busca al menos <strong>5+1 BB</strong> y verifica que sean de acero inoxidable para resistir la humedad.</p>
</div>

<h3>Sistema de freno (drag)</h3>
<p>El <strong>freno delantero</strong> es más preciso y recomendable para spinning activo. El <strong>freno trasero</strong> es más cómodo de ajustar al vuelo pero menos preciso. Para peces grandes como siluro o grandes lucios, asegúrate de que el drag máximo sea de al menos 8 kg. La mayoría de carretes de AliExpress en talla 3000+ superan este valor.</p>

<div class="warning-box">
  <div class="warning-box-title">⚠️ Mantenimiento imprescindible</div>
  <p>Si pescas en el mar, enjuaga siempre el carrete con agua dulce al terminar la jornada. La sal destruye los rodamientos rápidamente. Una gota de aceite específico en el eje principal al inicio de cada temporada dobla la vida útil del carrete.</p>
</div>
""",
        "faq": [
            ("¿Qué talla de carrete necesito para spinning en río?", "Para spinning en ríos medianos (Ebro, Tajo, Duero) buscando lucio o perca, una talla 3000 es la más versátil. Si vas a pescar trucha en ríos de montaña, una talla 1000–2000 con línea fina es más adecuada. Para siluro o grandes depredadores en el Ebro, una talla 4000–5000."),
            ("¿Carrete spinning o baitcasting?", "El carrete spinning (o devanadera) es mucho más fácil de usar y recomendable para principiantes. El baitcasting ofrece mayor precisión y potencia, pero requiere práctica para evitar backlash (enredos en la bobina). Para empezar con el spinning, comienza con un carrete spinning convencional."),
            ("¿Cuánto debo gastar en un carrete para empezar?", "Con 15–40 € puedes encontrar un carrete spinning perfectamente funcional para empezar. Los modelos de AliExpress en ese rango son suficientes para practicar y disfrutar. Cuando mejores tu técnica y quieras progresar, una inversión de 60–120 € te dará un carrete de calidad real."),
            ("¿Qué línea usar con el carrete?", "Para spinning activo con señuelos, el <strong>hilo trenzado (braid)</strong> de 0,08–0,16 mm es la mejor opción: sensibilidad máxima, sin elasticidad y mejor detección de picadas. Se recomienda añadir un bajo de línea de fluorocarbono de 20–30 cm para mayor invisibilidad ante el pez."),
            ("¿Cada cuánto hay que cambiar el carrete?", "Un carrete de calidad media-alta bien mantenido (enjuagar con agua dulce tras pescar en el mar, lubricar anualmente) puede durar 5–10 años. Los modelos económicos suelen aguantar 1–3 temporadas con uso regular."),
        ]
    },
    "canas": {
        "guide_title": "Cañas de spinning y casting: guía para elegir la tuya",
        "guide_body": """
<p>La <strong>caña de spinning</strong> es la extensión de tu brazo. Una caña bien elegida mejora la distancia de lance, la sensibilidad para notar la picada y el control del pez durante la pelea. Estos son los parámetros que debes entender antes de comprar.</p>

<div class="fact-grid">
  <div class="fact-card"><div class="fact-card-num">2,40 m</div><div class="fact-card-label">Longitud más versátil para ríos</div></div>
  <div class="fact-card"><div class="fact-card-num">Fast</div><div class="fact-card-label">Acción ideal para spinning activo</div></div>
  <div class="fact-card"><div class="fact-card-num">ML / M</div><div class="fact-card-label">Potencia para empezar</div></div>
  <div class="fact-card"><div class="fact-card-num">desde 3 €</div><div class="fact-card-label">Precio en AliExpress</div></div>
</div>

<div class="content-divider"><span>Longitud y acción</span></div>

<h3>¿Qué longitud de caña necesito?</h3>
<p>La longitud más versátil para spinning en ríos y embalses es entre <strong>2,10 m y 2,40 m</strong>. Cañas más cortas (1,80 m) aportan precisión en zonas con obstáculos. Cañas más largas (2,70–3,00 m) para embalses grandes o surfcasting donde necesitas máxima distancia de lanzado.</p>

<div class="tip-box">
  <div class="tip-box-title">✅ La caña todo-terreno española</div>
  <p>Una caña de 2,40 m, acción fast o medium-fast, potencia ML (5–21 g) sirve para el 90% de situaciones: lucio en embalse, lubina desde costa, trucha en río grande y perca. Si solo vas a comprar una caña, elige este perfil.</p>
</div>

<h3>Acción: fast, regular o slow</h3>
<p>La <strong>acción</strong> indica en qué punto se dobla la caña bajo carga:</p>
<ul>
  <li><strong>Fast (rápida):</strong> Se dobla solo en el tercio superior. Máxima sensibilidad, ideal para minnows y jigs. La más usada en spinning activo.</li>
  <li><strong>Regular (media):</strong> Se dobla hasta la mitad. Versátil, absorbe bien el impacto de la picada. Buena para crankbaits.</li>
  <li><strong>Slow (lenta):</strong> Toda la caña trabaja. Para señuelos muy ligeros y peces pequeños. Típica en pesca ultraligera (UL).</li>
</ul>

<div class="content-divider"><span>Material y secciones</span></div>

<h3>Potencia: UL, L, ML, M, MH</h3>
<p>La potencia (lure weight) indica el rango de señuelos que puede lanzar la caña:</p>
<table>
  <thead><tr><th>Potencia</th><th>Señuelos</th><th>Especie objetivo</th></tr></thead>
  <tbody>
    <tr><td><strong>UL</strong> (ultraligera)</td><td>1–7 g</td><td>Trucha, perca pequeña, spinning de precisión</td></tr>
    <tr><td><strong>L</strong> (ligera)</td><td>3–14 g</td><td>Trucha, perca, pequeño lucio</td></tr>
    <tr><td><strong>ML</strong> (media-ligera)</td><td>5–21 g</td><td>Lucio, lubina, perca grande</td></tr>
    <tr><td><strong>M</strong> (media)</td><td>7–28 g</td><td>Lucio grande, lubina, corvina</td></tr>
    <tr><td><strong>MH</strong> (media-pesada)</td><td>14–42 g</td><td>Siluro, surfcasting, mar</td></tr>
  </tbody>
</table>

<h3>Carbono vs fibra de vidrio · Telescópica vs secciones</h3>
<p>Las cañas de <strong>carbono</strong> son ligeras y muy sensibles, ideales para spinning activo. Las de <strong>fibra de vidrio</strong> son más resistentes al impacto, buenas para crankbaits lentos. Las <strong>telescópicas</strong> son cómodas de transportar pero tienen peor acción que las de 2 secciones.</p>

<div class="pro-tip">
  <div class="pro-tip-title">💡 Cañas telescópicas de AliExpress</div>
  <p>Marcas como Biutifu, Phishger o CEMREO ofrecen cañas telescópicas de carbono de buena calidad a precios muy bajos. Son ideales para viajeros, senderistas que pescan en alta montaña o como caña de repuesto. Para pesca seria con señuelos activos, una caña de 2 secciones ofrece mejor acción y sensibilidad.</p>
</div>
""",
        "faq": [
            ("¿Qué caña de spinning comprar para empezar?", "Para empezar con el spinning en España, recomendamos una caña de 2,10–2,40 m, acción medium-fast y potencia ML (5–21 g) o M (7–28 g). Este rango cubre la mayoría de situaciones en ríos y embalses: lucio, perca, lubina costera. El presupuesto inicial puede ser de 20–50 € sin problema."),
            ("¿Cuántas secciones debe tener la caña?", "Las cañas de 2 secciones son las más habituales y ofrecen el mejor equilibrio entre portabilidad y prestaciones. Las telescópicas (4–6 secciones) son muy cómodas para viajes. Para pesca deportiva seria, evita las telescópicas baratas ya que pueden tener problemas en los encajes con el tiempo."),
            ("¿Caña de spinning o caña de casting?", "Las cañas de spinning son más versátiles y fáciles de usar para la mayoría de señuelos. Las cañas de casting (para carrete baitcasting) tienen los anillos en la parte superior y están pensadas para técnicas más específicas. Empieza con una caña de spinning convencional."),
            ("¿Qué longitud para pescar desde la orilla?", "Para spinning desde la orilla en ríos medianos: 2,10–2,40 m. Para embalses grandes o costas donde se necesita distancia: 2,70–3,00 m. Para pesca con señuelos pesados desde costa rocosa: 3,00–3,30 m. Recuerda que a mayor longitud, mayor distancia de lanzado pero menor precisión."),
            ("¿Puedo usar una caña telescópica barata para aprender?", "Sí, perfectamente. Las cañas telescópicas económicas de AliExpress son muy útiles para aprender el lanzado, practicar técnicas y disfrutar sin una gran inversión inicial. Cuando domines la técnica y quieras mejorar, puedes invertir en una caña de mayor calidad."),
        ]
    },
    "accesorios": {
        "guide_title": "Accesorios imprescindibles para la pesca spinning",
        "guide_body": """
<p>Más allá de la caña, el carrete y los señuelos, existe un conjunto de <strong>accesorios de pesca</strong> que marcan la diferencia en la comodidad y eficacia de cada jornada. Estos son los que no deben faltar en la caja de cualquier pescador de spinning en España.</p>

<div class="fact-grid">
  <div class="fact-card"><div class="fact-card-num">~20 €</div><div class="fact-card-label">Kit básico completo de accesorios</div></div>
  <div class="fact-card"><div class="fact-card-num">10–14</div><div class="fact-card-label">Talla de giratorio más usada</div></div>
  <div class="fact-card"><div class="fact-card-num">24 celdas</div><div class="fact-card-label">Caja organizadora recomendada</div></div>
</div>

<div class="content-divider"><span>Lo imprescindible</span></div>

<h3>Cajas organizadoras de señuelos</h3>
<p>Una buena caja de aparejos con <strong>compartimentos ajustables</strong> es fundamental para tener los señuelos organizados y protegidos. Lo ideal es tener una caja grande para casa y una más pequeña de 12–24 compartimentos para llevar al río. Las cajas de AliExpress con cierre hermético ofrecen excelente protección ante agua y polvo.</p>

<div class="tip-box">
  <div class="tip-box-title">✅ Organización por tipo</div>
  <p>Agrupa los señuelos por tipo en tu caja: fila 1 minnows pequeños, fila 2 minnows grandes, fila 3 crankbaits, fila 4 jigs. Así encuentras lo que buscas en segundos sin rebuscar en campo.</p>
</div>

<h3>Giratorios, mosquetones y destorcedores</h3>
<p>Los <strong>giratorios (swivels)</strong> evitan que la línea se retuerza al recuperar señuelos que rotan. Los <strong>mosquetones de cambio rápido</strong> (snap swivels) permiten cambiar señuelos sin hacer nudos. Para spinning medio, lleva siempre un surtido de <strong>tallas 10 a 14</strong>.</p>

<h3>Anzuelos de repuesto</h3>
<p>Los anzuelos triples de los señuelos económicos suelen ser de calidad media. Sustitúyelos por anzuelos de marcas como Owner o Gamakatsu (1–2 € por unidad) para mejorar el ratio de captura y la resistencia al forzar al pez.</p>

<div class="content-divider"><span>Herramientas</span></div>

<h3>Alicates de pesca y desclavadores</h3>
<p>Imprescindibles para desclavar anzuelos del pez de forma segura y sin dañarlo. Los alicates multiusos de pesca sirven también para partir hilo, aplastar aristas de anzuelos en pesca sin muerte y ajustar mosquetones. Un modelo de 15–20 cm con funda es suficiente.</p>

<div class="pro-tip">
  <div class="pro-tip-title">💡 Kit mínimo de campo (menos de 15 €)</div>
  <p>Para una jornada sin sustos: 1 caja pequeña, surtido de giratorios talla 10–14, 6–10 anzuelos triples de repuesto, 2 metros de fluorocarbono 0,25 mm y unos alicates básicos. Todo esto cabe en un bolsillo y cuesta menos de 15 € desde AliExpress.</p>
</div>

<h3>Mantenimiento: aceite y limpieza</h3>
<p>Un bote de <strong>aceite específico para carrete</strong> prolonga enormemente su vida útil. Lubrica el eje principal al inicio de cada temporada y siempre tras pescar en agua salada. Nunca uses WD40 ni aceite de cocina en el carrete: dañan los retenes y plásticos internos.</p>
""",
        "faq": [
            ("¿Qué accesorios son indispensables para empezar?", "Los imprescindibles para empezar con el spinning son: una caja de señuelos organizadora, un surtido de giratorios y mosquetones (tallas 10–14), un par de alicates básicos, hilo de repuesto o bajo de línea de fluorocarbono, y un anzuelo de recambio. Con esto tienes cubierto lo básico para una jornada sin sustos."),
            ("¿Cómo organizar los señuelos?", "La mejor organización es por tipo de señuelo y por tamaño/peso. En una caja de 24 compartimentos puedes organizar: fila 1 minnows pequeños, fila 2 minnows grandes, fila 3 crankbaits, fila 4 jigs, etc. Etiqueta las filas con cinta de pintor si tienes muchas cajas. Lo importante es poder encontrar el señuelo que buscas rápidamente sin rebuscar."),
            ("¿Qué talla de giratorio usar?", "Para spinning ligero con señuelos de 3–14 g: giratorios de talla 12–14. Para spinning medio (14–28 g): talla 8–10. Para spinning pesado: talla 4–6. Recuerda que el giratorio no debe pesar más del 20% del peso del señuelo para no alterar su acción."),
            ("¿Son necesarios los destorcedores?", "Con señuelos que rotan (spinners, cucharillas) son imprescindibles para evitar que la línea se retuerza y se debilite. Con minnows y jigs que no rotan no son estrictamente necesarios, aunque el mosquetón de cambio rápido sí es muy cómodo para cambiar señuelos sin hacer nudos."),
            ("¿Qué aceite usar para el carrete?", "Usa aceite específico para carrete de pesca, no aceite de cocina ni WD40. El WD40 puede dañar los retenes y plásticos del carrete. Existen aceites y grasas específicos para carretes de pesca muy económicos que duran años. Una aplicación anual y otra tras pescar en mar es suficiente."),
        ]
    },
}

CATEGORY_HUBS = {
    "senueulos": {
        "summary": "Colección orientada a cubrir profundidad, color, vibración y especie objetivo sin comprar señuelos al azar.",
        "checklist": [
            "Escoge la talla según especie y escenario.",
            "Adapta color y vibración a la claridad del agua.",
            "Revisa anzuelos, peso y profundidad de trabajo antes de comprar.",
        ],
        "guide_slug": "como-elegir-senuelo-segun-agua-y-clima",
    },
    "carretes": {
        "summary": "Selección pensada para que entiendas tallas, ratio, freno y mantenimiento antes de decidir qué carrete comprar.",
        "checklist": [
            "Confirma la talla real que necesitas para tu caña y tu línea.",
            "Elige ratio según técnica: versátil, lenta o rápida.",
            "Prioriza suavidad, freno y recambios frente al número bruto de rodamientos.",
        ],
        "guide_slug": "como-elegir-carrete-spinning",
    },
    "canas": {
        "summary": "Aquí agrupamos cañas de spinning y viaje con foco en longitud, potencia y facilidad de uso para ríos, embalses y costa.",
        "checklist": [
            "Define escenario: río estrecho, embalse o costa.",
            "Ajusta longitud y potencia al peso de tus señuelos.",
            "Valora si prefieres dos tramos o telescópica por transporte.",
        ],
        "guide_slug": "spinning-para-principiantes",
    },
    "accesorios": {
        "summary": "Accesorios para completar el equipo sin gastar de más: cajas, alicates, enganches, repuestos y mantenimiento.",
        "checklist": [
            "Compra accesorios que resuelvan un problema concreto en tus salidas.",
            "Prioriza orden, seguridad y durabilidad frente a cantidad.",
            "Lleva siempre recambios pequeños y protección para anzuelos y carretes.",
        ],
        "guide_slug": "errores-spinning-principiantes",
    },
}

# ─── Guías de pesca (artículos informativos) ─────────────────────────────────

GUIDES = [
    {
        "slug": "spinning-para-principiantes",
        "title": "Pesca Spinning para Principiantes: Guía Completa 2026",
        "description": "Todo lo que necesitas saber para empezar con la pesca spinning: equipo básico, técnicas, especies objetivo y los mejores consejos para pescar en España.",
        "date": "2026-01-15",
        "reading_time": "8",
        "content": """
<p>La <strong>pesca spinning</strong> es una de las modalidades de pesca con caña más activas y emocionantes que existen. A diferencia de la pesca estática con cebo natural, en el spinning tú eres quien provoca la picada: lanzas un señuelo artificial y lo recuperas de forma activa, imitando el movimiento de un pez herido, una rana, un cangrejo o cualquier presa natural del depredador que buscas.</p>
<p>En España, el spinning tiene millones de practicantes en ríos, embalses y costas. Las especies objetivo más populares son el <strong>lucio</strong> en embalses castellanos, la <strong>lubina</strong> y la <strong>corvina</strong> en las costas, la <strong>trucha</strong> en los ríos de montaña, la <strong>perca americana</strong> en algunos embalses del sur y el <strong>siluro</strong> en el río Ebro y otros grandes ríos.</p>

<h2>El equipo básico de spinning</h2>
<p>Para empezar con el spinning no necesitas gastar mucho. Un equipo básico y funcional puede costarte entre 30 y 80 €:</p>
<h3>La caña</h3>
<p>Para empezar, una caña de <strong>2,10–2,40 m</strong> con acción media (M o ML) y un rango de señuelos de 5–25 g es perfecta. Encontrarás opciones muy válidas entre 15 y 40 €. Las cañas telescópicas son más cómodas para transportar, aunque las de dos secciones tienen mejor acción.</p>
<h3>El carrete</h3>
<p>Un carrete spinning de talla <strong>2500–3000</strong> con freno delantero y al menos 5 rodamientos. El ratio de recuperación ideal para empezar es entre 5.2:1 y 6.2:1. Presupuesto: 10–30 € para empezar.</p>
<h3>La línea</h3>
<p>El <strong>hilo trenzado (braid)</strong> es la mejor opción para spinning: es muy sensible, no tiene memoria y dura mucho más que el monofilamento. Para empezar, un trenzado de 0,10–0,14 mm es suficiente. Añade un <strong>bajo de línea de fluorocarbono</strong> de 0,20–0,25 mm y 30–50 cm para mayor transparencia ante el pez.</p>
<h3>Los señuelos</h3>
<p>Empieza con 8–10 señuelos variados: 2–3 minnows (3–10 cm), 2 crankbaits, 2–3 jigs de silicona y 1–2 spinnerbaits. Con una selección corta y coherente puedes cubrir la mayoría de situaciones de iniciación sin gastar de más.</p>
<h3>Accesorios básicos</h3>
<p>Giratorios y mosquetones (talla 10–14), una caja organizadora, unos alicates de pesca y algo de fluorocarbono para bajos de línea. Todo esto, menos de 15 €.</p>

<h2>Técnica básica de spinning</h2>
<h3>El lanzado</h3>
<p>Con un carrete spinning, el lanzado es sencillo: abre el arco del carrete con el dedo índice, lanza en arco (como si tiraras una pelota de béisbol) y cierra el arco al caer el señuelo al agua. Con práctica, en 30 minutos dominarás los lanzados básicos.</p>
<h3>La recuperación</h3>
<p>La clave del spinning está en <strong>cómo recuperas</strong> el señuelo. Las técnicas básicas son:</p>
<ul>
  <li><strong>Recuperación lineal:</strong> Enrollas de forma continua y constante. Funciona con minnows y crankbaits que tienen su propia acción.</li>
  <li><strong>Stop &amp; go:</strong> Recuperas y paras, recuperas y paras. La pausa es cuando el pez suele atacar. Excelente con minnows hundidos.</li>
  <li><strong>Twitching:</strong> Pequeños tirones de caña mientras recuperas, dando al señuelo una acción errática. Muy efectivo con jerkbaits.</li>
  <li><strong>Jigging:</strong> Dejas caer el jig al fondo, luego das tirones hacia arriba. El ataque suele ser en la caída.</li>
</ul>

<h2>Dónde pescar spinning en España</h2>
<p>España tiene una red hidrográfica y costera privilegiada para el spinning:</p>
<ul>
  <li><strong>Río Ebro (Aragón/Cataluña):</strong> El mejor río de Europa para siluro. También alberga lucio, perca y carpa en algunas zonas.</li>
  <li><strong>Embalses de Castilla y León:</strong> El Duero y sus afluentes tienen excelentes poblaciones de lucio.</li>
  <li><strong>Costa Cantábrica y Galicia:</strong> Lubina, corvinata y trucha de mar. Pesca espectacular desde acantilados y playas rocosas.</li>
  <li><strong>Costa Mediterránea:</strong> Lubina, sargo y corvina. La técnica de rockfishing (pesca en rocas) es muy popular.</li>
  <li><strong>Ríos de montaña (Pirineos, Sistema Central, Sierra Nevada):</strong> Trucha y, en algunos ríos, salmón en el norte.</li>
</ul>

<h2>Licencia de pesca</h2>
<p>En España cada comunidad autónoma gestiona sus propias licencias de pesca. Necesitas una <strong>licencia de pesca fluvial</strong> para pescar en ríos y embalses, y en algunas comunidades también para la pesca en el mar desde tierra. El precio varía entre 5 y 30 € según la comunidad y la duración. Infórmate siempre en la web de la consejería de medio ambiente de tu comunidad antes de salir a pescar.</p>

<h2>Consejos para tu primera salida</h2>
<ul>
  <li>Empieza en un embalse o río grande con acceso fácil, donde el error de lanzado no crea problemas.</li>
  <li>Pesca las primeras horas de la mañana o las últimas de la tarde: los depredadores están más activos.</li>
  <li>Varía señuelos y técnicas si no tienes picadas en 20–30 minutos en la misma zona.</li>
  <li>Observa el agua: manchas, corrientes, zonas de sombra, cambios de profundidad. Ahí están los peces.</li>
  <li>Practica el lanzado en casa (patio, parque) antes de ir al río para no perder tiempo aprendiendo en el campo.</li>
  <li>Si practicas pesca sin muerte, lleva un salabre para sacar el pez y una tenaza para desclavar sin tocarlo.</li>
</ul>
"""
    },
    {
        "slug": "mejores-senueulos-lucio",
        "title": "Mejores Señuelos para Lucio: Guía 2026 para España",
        "description": "Descubre los mejores señuelos para pescar lucio en España: minnows, jerkbaits, swimbaits y crankbaits. Técnicas, tamaños y colores que funcionan en ríos y embalses.",
        "date": "2026-02-01",
        "reading_time": "7",
        "content": """
<p>El <strong>lucio (Esox lucius)</strong> es el rey de los depredadores de agua dulce en España. Su agresividad, su tamaño y la espectacularidad de sus ataques lo convierten en la especie favorita de miles de pescadores de spinning. Encontrarás lucios en los grandes embalses de Castilla y León, en el río Ebro y sus afluentes, y en numerosos ríos y pantanos de toda la Península.</p>

<h2>Por qué el spinning es ideal para el lucio</h2>
<p>El lucio es un depredador de emboscada que caza por visión y vibración. Los señuelos artificiales son perfectos para imitarlo: pueden lanzarse lejos para cubrir grandes extensiones de agua, generan vibraciones que activan el instinto cazador del lucio y permiten trabajar a cualquier profundidad.</p>

<h2>Los mejores tipos de señuelos para lucio</h2>
<h3>1. Minnow (pececillo)</h3>
<p>El minnow es probablemente el señuelo más versátil para lucio. Los tamaños ideales van de <strong>10 a 14 cm</strong> y los pesos de 10 a 21 g. Los modelos flotantes son perfectos para trabajar en aguas someras con vegetación, donde el lucio se apostas. Los hundidos permiten trabajar a media agua.</p>
<p>Colores que funcionan para lucio: <strong>natural perca</strong> (verde/amarillo/negro), <strong>natural trucha</strong> (marrón/dorado/rojo), <strong>blanco/plateado</strong> para días soleados en agua clara, y colores vivos (chartreuse, naranja) en agua turbia o poca luz.</p>
<h3>2. Jerkbait</h3>
<p>Los jerkbaits son minnows sin billa que se trabajan a base de tirones (jerks) de caña. Su acción errática e impredecible es devastadora para el lucio. Los modelos suspending (que quedan a media agua en pausa) son especialmente efectivos en agua fría cuando el lucio está lento.</p>
<h3>3. Swimbait (pez nada)</h3>
<p>Los swimbaits articulados de 10–18 cm imitan perfectamente el movimiento ondulante de un pez. Son ideales para lucios grandes que han visto de todo y son selectivos. La recuperación lenta y constante es suficiente; a veces un simple stop &amp; go marca la diferencia.</p>
<h3>4. Crankbait</h3>
<p>Los crankbaits de billa larga buzan hasta 3–5 metros, ideales para buscar lucios a media agua en embalses. Los de billa corta trabajan a 0,5–1,5 m, perfectos para rastrear bordillos y barrancos sumergidos. Tallas de 7–12 cm y 14–28 g.</p>
<h3>5. Spinnerbait</h3>
<p>Las paletas giratorias del spinnerbait generan vibración y destellos que son irresistibles para el lucio en condiciones de poca visibilidad. La paleta Colorado da más vibración (para agua turbia), la paleta Willow da más destello (para agua clara). Pesos de 14–28 g.</p>
<h3>6. Topwater (superficie)</h3>
<p>La pesca en superficie para lucio es la más espectacular de todas. Poppers, stickbaits y frogs en tallas de 8–14 cm. Úsalos al amanecer y al atardecer, con calma chicha, especialmente cerca de vegetación acuática. Cuando el lucio rompe la superficie para atacar, es un espectáculo que no se olvida.</p>

<h2>Técnica de pesca para lucio</h2>
<p>El lucio prefiere zonas de emboscada: orillas con vegetación, troncos sumergidos, cambios de profundidad, entradas de canales y zonas de sombra. Lanza en paralelo a la orilla, cerca de la vegetación, y trabaja el señuelo con paradas frecuentes.</p>
<p>En verano, el lucio es más activo en las horas frescas (amanecer y anochecer). En invierno, al mediodía cuando el agua está más cálida. La primavera es la mejor época: los lucios están activos post-freza y hambrientos.</p>

<h2>Tallas legales y pesca sin muerte</h2>
<p>En la mayoría de comunidades autónomas, la <strong>talla mínima para el lucio es de 40 cm</strong>, aunque varía. Consulta siempre la normativa de tu comunidad antes de pescar. La <strong>pesca sin muerte</strong> (catch &amp; release) está muy extendida entre los pescadores de lucio españoles y es la práctica más sostenible para mantener buenas poblaciones.</p>

<h2>Señuelos económicos que funcionan para lucio</h2>
<p>En gama económica hay señuelos muy válidos para lucio si eliges bien el perfil, el peso y la natación. Muchos modelos baratos funcionan mejor de lo que parece, pero conviene revisar bien herrajes, anillas y anzuelos de serie antes de dar por buena la compra.</p>
"""
    },
    {
        "slug": "mejores-senueulos-lubina",
        "title": "Mejores Señuelos para Lubina: Guía de Pesca en España",
        "description": "Los mejores señuelos artificiales para pescar lubina y corvina en España. Técnicas, zonas de pesca y consejos para la lubina desde costa rocosa y playa.",
        "date": "2026-02-15",
        "reading_time": "6",
        "content": """
<p>La <strong>lubina (Dicentrarchus labrax)</strong> es el depredador más codiciado de los pescadores de spinning en litoral español. Su combatividad, su presencia en casi toda la costa peninsular y la emoción de pescarla desde acantilados y playas la convierten en la especie reina del spinning marino en España. Desde el Cantábrico hasta el Mediterráneo, el Atlántico y las costas gallegas, la lubina ofrece oportunidades de pesca espectaculares durante casi todo el año.</p>

<h2>Dónde pescar lubina en España</h2>
<p>La lubina habita en aguas costeras poco profundas, especialmente en zonas con rompiente, corrientes y estructuras donde puede acechar a sus presas:</p>
<ul>
  <li><strong>Costa Cantábrica:</strong> Asturias, Cantabria y País Vasco son paraísos para la lubina. Las rompientes, los bajos rocosos y las desembocaduras de ría son zonas muy productivas.</li>
  <li><strong>Costa Atlántica (Galicia, Portugal):</strong> Excelentes poblaciones de lubina de gran tamaño. Las rías son zonas especialmente productivas.</li>
  <li><strong>Costa Mediterránea:</strong> Lubina más pequeña pero muy activa. Las puntas rocosas y los puertos son buenas zonas.</li>
  <li><strong>Desembocaduras de ríos:</strong> En toda la costa, las bocanas de río concentran lubinas buscando cangrejos de río, anguilas y peces de río.</li>
</ul>

<h2>Los mejores señuelos para lubina</h2>
<h3>Minnow hundido (sinking minnow)</h3>
<p>El señuelo más efectivo para lubina es el <strong>minnow hundido de 8–12 cm</strong> en colores plateados o azul/plata que imitan al boquerón o la sardina. La técnica consiste en cruzarlo por la corriente o por la espuma y recogerlo con pequeños toques de puntera. Muchas picadas llegan justo en la pausa. Funcionan muy bien los acabados naturales o ligeramente nacarados.</p>
<h3>Pencil (stickbait)</h3>
<p>Los pencils son señuelos de superficie que se trabajan con el famoso "walking the dog": tirones rítmicos de caña que hacen que el señuelo zigzaguee de izquierda a derecha. Son devastadores para lubina activa en superficie, especialmente cuando se ven saltos de peces forrajeando. Tallas de 9–13 cm, 12–28 g.</p>
<h3>Popper</h3>
<p>El popper crea salpicaduras y sonidos en superficie que imitan a un pez en apuros. Muy efectivo en condiciones de calma con lubinas activas. La técnica es lanzar lejos y recuperar con tirones cortos y fuertes alternados con pausas. Los ataques de la lubina al popper son espectaculares.</p>
<h3>Jig de plomo</h3>
<p>Los jigs metálicos de <strong>15–40 g</strong> son los señuelos más versátiles para lubina desde costa. Permiten lanzar largas distancias, llegar al fondo con corriente y trabajar a distintas profundidades. La técnica jigging (subir y bajar) es efectiva cuando la lubina está en el fondo buscando cangrejos y pequeños peces.</p>
<h3>Soft plastic (goma)</h3>
<p>Los señuelos de silicona montados en jig head (2–15 g) son muy efectivos para lubina en aguas tranquilas o interiores. Las formas de pez, gusano y calamar en colores blancos, chartreuse o naturales imitan muy bien a las presas de la lubina.</p>

<h2>Técnicas y condiciones para lubina</h2>
<p><strong>Mejor momento:</strong> El amanecer y el crepúsculo son las horas mágicas. La lubina también caza muy bien de noche, especialmente cerca de luces artificiales en puertos y paseos marítimos que atraen a pequeños peces e invertebrados.</p>
<p><strong>Agua removida:</strong> La lubina es especialmente activa cuando el mar está revuelto, con algo de oleaje y espuma. Las rompientes con corriente son zonas perfectas después de un temporal.</p>
<p><strong>Mareas:</strong> Las 2 horas antes y después del cambio de marea suelen ser las más productivas. En marea vaciante, la lubina sigue la corriente buscando presas.</p>

<h2>Señuelos económicos para lubina</h2>
<p>Los minnows y jigs económicos pueden rendir muy bien para lubina si eliges perfiles coherentes con tu costa, tu luz y tu rango de lance. Puedes montar una selección corta y versátil sin disparar presupuesto, pero conviene revisar anzuelos, anillas y estabilidad antes de darla por cerrada.</p>
"""
    },
    {
        "slug": "como-elegir-carrete-spinning",
        "title": "Carrete de Spinning: cómo elegir talla, ratio y freno (Guía 2026)",
        "description": "Guía práctica para elegir carrete de spinning en España: tallas 2500/3000/4000, ratio, freno, mantenimiento y errores comunes al comprar.",
        "date": "2026-03-01",
        "reading_time": "6",
        "content": """
<p>Elegir el <strong>carrete de spinning correcto</strong> puede parecer abrumador con tanta oferta disponible. Esta guía técnica desglosa todos los parámetros que debes conocer para tomar la decisión correcta según tu estilo de pesca, las especies que buscas y tu presupuesto.</p>

<h2>Entendiendo las tallas de carrete</h2>
<p>El sistema de tallas (1000, 2500, 3000, 4000...) es universal entre fabricantes aunque con pequeñas diferencias. La talla determina la capacidad de línea del carrete y el tamaño físico del mismo:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background:rgba(0,198,255,0.1)">
      <th style="padding:10px;text-align:left;border:1px solid #1e2a36">Talla</th>
      <th style="padding:10px;text-align:left;border:1px solid #1e2a36">Uso</th>
      <th style="padding:10px;text-align:left;border:1px solid #1e2a36">Señuelos</th>
      <th style="padding:10px;text-align:left;border:1px solid #1e2a36">Línea</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px;border:1px solid #1e2a36">1000–2000</td>
      <td style="padding:10px;border:1px solid #1e2a36">Ultraligero, trucha</td>
      <td style="padding:10px;border:1px solid #1e2a36">1–8 g</td>
      <td style="padding:10px;border:1px solid #1e2a36">0.08–0.14 mm</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #1e2a36">2500–3000</td>
      <td style="padding:10px;border:1px solid #1e2a36">Spinning versátil</td>
      <td style="padding:10px;border:1px solid #1e2a36">5–25 g</td>
      <td style="padding:10px;border:1px solid #1e2a36">0.14–0.20 mm</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #1e2a36">4000–5000</td>
      <td style="padding:10px;border:1px solid #1e2a36">Lubina, surfcasting</td>
      <td style="padding:10px;border:1px solid #1e2a36">15–50 g</td>
      <td style="padding:10px;border:1px solid #1e2a36">0.18–0.28 mm</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #1e2a36">6000+</td>
      <td style="padding:10px;border:1px solid #1e2a36">Surfcasting pesado</td>
      <td style="padding:10px;border:1px solid #1e2a36">40–100+ g</td>
      <td style="padding:10px;border:1px solid #1e2a36">0.25–0.35 mm</td>
    </tr>
  </tbody>
</table>

<h2>Ratio de recuperación: velocidad vs fuerza</h2>
<p>El ratio 5.2:1 significa que por cada vuelta completa de la manivela, el rotor del carrete da 5,2 vueltas. A mayor ratio, más línea se recoge por vuelta = más velocidad de recuperación, pero menos fuerza.</p>
<ul>
  <li><strong>Ratio lento (4.9:1–5.5:1):</strong> Para crankbaits y swimbaits que se deben trabajar despacio. Mayor par de fuerza para peces grandes.</li>
  <li><strong>Ratio medio (6.0:1–6.4:1):</strong> El más versátil. Funciona bien con casi cualquier técnica.</li>
  <li><strong>Ratio rápido (7.0:1+):</strong> Para jigging vertical, técnicas rápidas y recuperar rápidamente sin dar tiempo al pez a soltar.</li>
</ul>
<p>Para empezar, un <strong>ratio de 5.2:1 o 6.2:1</strong> es la elección más sensata.</p>

<h2>Rodamientos: cuántos y de qué calidad</h2>
<p>Los rodamientos determinan la suavidad del giro y la precisión del carrete. Más rodamientos no siempre es mejor: un carrete con 5 rodamientos de acero inoxidable de calidad supera a uno con 12 rodamientos de acero al carbono barato.</p>
<p>Busca: <strong>mínimo 5+1 rodamientos</strong>, acero inoxidable a prueba de sal si pescas en el mar, y rodamientos ABEC-5 o superior en carretes de gama media-alta.</p>

<h2>Sistema de freno (drag)</h2>
<p>El freno controla la resistencia que opone el carrete cuando el pez tira del hilo. Un freno suave y progresivo es esencial para no romper el sedal cuando el pez hace carreras. Para la mayoría de peces españoles:</p>
<ul>
  <li>Trucha/perca pequeña: 3–5 kg de freno máximo</li>
  <li>Lucio mediano, lubina: 5–8 kg</li>
  <li>Lucio grande, siluro, carpa: 8–15 kg</li>
</ul>

<h2>Freno delantero vs freno trasero</h2>
<p>El <strong>freno delantero</strong> (sobre la bobina) es más suave, preciso y eficiente. Es el estándar en spinning moderno y el recomendado para la mayoría de usos. El <strong>freno trasero</strong> (en la parte posterior) es más fácil de ajustar al vuelo, útil si pescas muchas especies de tamaños muy distintos en la misma sesión.</p>

<h2>¿Merece la pena gastar más en el carrete?</h2>
<p>La respuesta es: depende de tu nivel. Para aprender y disfrutar, un carrete de <strong>15–40 €</strong> es más que suficiente. Para pescar regularmente y notar diferencias en sensibilidad, suavidad y durabilidad, la franja de <strong>60–120 €</strong> ofrece una diferencia real. Por encima de 150 €, los beneficios son incrementales y apreciables principalmente por pescadores avanzados con técnicas exigentes.</p>
<p>Los carretes de entrada de 10–30 € pueden servir para empezar o montar un equipo de repuesto. Lo importante no es la tienda, sino revisar talla, freno, sensación de giro, repuestos y señales básicas de fiabilidad antes de decidir.</p>
"""
    },
    {
        "slug": "cana-de-spinning-como-elegir",
        "title": "Caña de Spinning: cómo elegir longitud, acción y potencia (Guía 2026)",
        "description": "Guía completa para elegir caña de spinning en España: longitud ideal, acción, potencia, escenarios reales y errores de compra más comunes.",
        "date": "2026-04-26",
        "reading_time": "11",
        "content": """
<p>Elegir una <strong>caña de spinning</strong> parece sencillo hasta que te enfrentas a veinte siglas, longitudes distintas y recomendaciones contradictorias. Esta guía está pensada para aterrizar la decisión con lógica real de pesca en España: qué caña usar en río, embalse o costa; cuándo elegir telescópica o de dos tramos; y qué errores cuestan más dinero al empezar.</p>

<h2>Qué define realmente una caña de spinning</h2>
<p>Hay tres variables que mandan de verdad: <strong>longitud</strong>, <strong>potencia</strong> y <strong>acción</strong>. El resto (marca, estética o marketing) importa menos si estas tres no encajan con tus señuelos y tu escenario.</p>
<ul>
  <li><strong>Longitud:</strong> influye en lance, control de línea y comodidad.</li>
  <li><strong>Potencia:</strong> define el peso de señuelo que mueve bien la caña.</li>
  <li><strong>Acción:</strong> determina cómo responde el blank al cargar y clavar.</li>
</ul>
<p>Si fallas en esta base, da igual que compres un carrete caro o un señuelo de moda: pescarás incómodo y perderás precisión.</p>

<h2>Tabla rápida: qué caña de spinning elegir según escenario</h2>
<table>
  <thead>
    <tr><th>Escenario</th><th>Longitud orientativa</th><th>Potencia habitual</th><th>Acción recomendable</th></tr>
  </thead>
  <tbody>
    <tr><td>Río pequeño / trucha</td><td>1,80–2,10 m</td><td>UL / L (1-10 g)</td><td>Rápida o moderada-rápida</td></tr>
    <tr><td>Embalse polivalente</td><td>2,10–2,40 m</td><td>ML / M (5-25 g)</td><td>Rápida</td></tr>
    <tr><td>Lucio / vinilo medio</td><td>2,20–2,50 m</td><td>M / MH (10-40 g)</td><td>Rápida</td></tr>
    <tr><td>Costa lubina</td><td>2,40–2,70 m</td><td>M / MH (10-45 g)</td><td>Rápida o progresiva</td></tr>
  </tbody>
</table>
<p>Estas cifras no son dogma, pero funcionan como base sólida para el 80% de pescadores recreativos.</p>

<h2>Longitud: cuándo una caña larga ayuda y cuándo molesta</h2>
<p>Una caña más larga lanza mejor en costa abierta y te da control de línea en espuma, corriente o olas laterales. En cambio, en río estrecho y vegetación cerrada puede ser una molestia: pierdes maniobra y precisión de entrada. Por eso no existe “la mejor caña de spinning” universal: existe la más coherente con tu agua.</p>
<p>Si pescas mixto (embalse + alguna salida a costa), 2,40 m suele ser un punto muy equilibrado. Si tu foco es río de montaña y trucha, moverte entre 1,90 y 2,10 m suele dar más rendimiento práctico.</p>

<h2>Potencia: la clave para no pescar fuera de rango</h2>
<p>El error más común es comprar una caña sobredimensionada “por si acaso”. Con una MH pesada puedes mover señuelos grandes, sí, pero pierdes sensibilidad con señuelo pequeño y te cansas antes. La potencia debe casar con el peso real de los señuelos que más repites, no con el señuelo máximo que usarás dos veces al año.</p>
<p>Para iniciarte en spinning generalista en España, una caña <strong>ML o M</strong> con rango 5-25 g suele ser excelente. Si tu objetivo principal es lucio grande o mar con señuelos voluminosos, entonces sí tiene sentido subir a M/MH.</p>

<h2>Acción: rápida, moderada o progresiva</h2>
<p>En spinning moderno, la acción rápida suele ser la más polivalente: transmite mejor el fondo, mejora clavada y facilita trabajar jerkbaits, minnows o vinilos. La acción más progresiva puede resultar cómoda con peces que pelean mucho o con señuelos de tracción continua.</p>
<p>Si dudas, empieza por una rápida no extrema. Te da lectura, control y margen para aprender técnica de forma más limpia.</p>

<h2>Telescópica vs dos tramos vs travel</h2>
<p>La caña telescópica gana por transporte y practicidad diaria, pero en muchas gamas sigue perdiendo finura frente a una buena caña de dos tramos. Las travel de 3-4 tramos han mejorado mucho: son gran opción si viajas en coche pequeño, tren o avión y no quieres renunciar del todo a sensibilidad.</p>
<ul>
  <li><strong>Dos tramos:</strong> mejor equilibrio general para rendimiento.</li>
  <li><strong>Telescópica:</strong> comodidad y rapidez para salidas cortas.</li>
  <li><strong>Travel:</strong> solución híbrida para movilidad frecuente.</li>
</ul>

<h2>Qué caña de spinning para empezar con presupuesto ajustado</h2>
<p>Con poco presupuesto conviene priorizar tres cosas: anillas decentes, portacarretes firme y un rango de potencia útil (por ejemplo 5-25 g o 7-28 g). No necesitas pagar una gama alta para aprender bien. Te va a hacer progresar más una caña media coherente con tu escenario que una “tope” fuera de rango.</p>
<p>Si además estás montando equipo completo, combina esta lectura con la guía de <a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">carrete de spinning</a> y con nuestra ruta de <a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">primeros pasos</a>.</p>

<h2>Errores habituales al comprar cañas de pescar spinning</h2>
<ul>
  <li>Comprar por marca sin revisar rango real de señuelos.</li>
  <li>Copiar la caña de un creador que pesca en un escenario distinto.</li>
  <li>Elegir “más potencia” pensando que siempre será mejor.</li>
  <li>No considerar peso total y fatiga en jornadas largas.</li>
  <li>Ignorar el entorno: no es lo mismo espigón abierto que río encajado.</li>
</ul>

<h2>Checklist final antes de decidir</h2>
<p>Antes de pagar, responde esto por escrito: ¿dónde voy a pescar más?, ¿qué señuelos usaré el 70% del tiempo?, ¿prefiero movilidad o máximo rendimiento?, ¿quiero una caña única o empezar con base polivalente? Si lo tienes claro, la compra suele salir bien a la primera.</p>
<p>En resumen: una buena <strong>caña de spinning</strong> no es la más cara ni la más viral, sino la que te permite lanzar cómodo, leer mejor el agua y repetir jornadas sin pelearte con el equipo.</p>
"""
    },
    {
        "slug": "senuelos-para-trucha-spinning",
        "title": "Señuelos para Trucha en Spinning: minnow, jerkbait, cucharilla y vinilo",
        "description": "Guía práctica de señuelos para trucha: tamaños, colores, minnow para pesca en río, jerkbait, cucharilla y cómo moverlos según el agua.",
        "date": "2026-04-26",
        "reading_time": "12",
        "content": """
<p>Si buscas una guía de <strong>señuelos para trucha</strong> en España, la idea clave es esta: no gana quien cambia más de señuelo, sino quien ajusta tamaño, ángulo y ritmo al tramo real de río. La trucha castiga mucho el ruido, la mala entrada y las recuperaciones sin intención. Aquí tienes un enfoque práctico para elegir y mover señuelos con criterio.</p>

<h2>Cómo se comporta la trucha (y por qué cambia tu selección)</h2>
<p>La trucha suele colocarse donde puede comer con gasto energético bajo: corrientes quebradas, piedras grandes, sombras, retornos, entradas de agua oxigenada y cambios de velocidad. Por eso un mismo señuelo puede parecer “malo” en una zona y funcionar perfecto veinte metros más arriba.</p>
<p>Antes de pensar color, piensa posición del pez y trayectoria del señuelo. En trucha, la línea de pase importa tanto como el propio señuelo.</p>

<h2>Minnow de pesca para trucha: el más versátil</h2>
<p>El <strong>minnow de pesca</strong> es probablemente el señuelo más completo para trucha porque permite trabajar agua superficial y media, con control fino y buena lectura de toques. En río español, los rangos más útiles suelen estar entre 4 y 7 cm.</p>
<ul>
  <li><strong>Minnow flotante:</strong> gran opción en poca profundidad y corriente viva.</li>
  <li><strong>Minnow hundido:</strong> mejor cuando necesitas bajar rápido y mantener línea de pase.</li>
  <li><strong>Minnow suspending:</strong> útil en tramos más lentos con pausas largas.</li>
</ul>
<p>Si solo pudieras llevar dos, un minnow natural de 5 cm y otro de mayor contraste para agua tomada te cubrirían muchísimas situaciones.</p>

<h2>Jerkbait para pesca de trucha: cuándo sí y cómo moverlo</h2>
<p>El <strong>jerkbait de pesca</strong> en trucha funciona muy bien cuando el pez sigue pero no decide. Los tirones cortos con pausas crean un estímulo irregular que provoca ataques por reacción. El fallo habitual es exagerar tirones y perder naturalidad. En ríos pequeños, menos es más.</p>
<p>Para empezar, prueba secuencias simples: dos toques cortos, pausa de uno o dos segundos, recogida corta y repetir. Ajusta la pausa según temperatura y actividad.</p>

<h2>Cucharilla: la escuela de ritmo y ángulo</h2>
<p>La cucharilla sigue siendo uno de los mejores señuelos para trucha por simplicidad y efectividad. En agua fría o presión de pesca alta, una cucharilla pequeña bien presentada puede resolver jornadas difíciles. Lo importante es controlar velocidad para que gire sin subir demasiado.</p>
<p>En corrientes fuertes, compensa lanzar algo más arriba y trabajar diagonalmente para entrar en la vena buena con tensión constante.</p>

<h2>Vinilo ligero: opción fina para trucha recelosa</h2>
<p>Cuando la trucha está muy tocada o el río va bajo y claro, un microvinilo con cabeza ligera puede dar una presentación más discreta que un hardbait. Funciona especialmente bien en pozas, remansos y bordes de corriente donde el pez inspecciona más.</p>
<p>No es un señuelo “mágico”; solo te da una textura de nado distinta que a veces desbloquea peces complicados.</p>

<h2>Tamaños y pesos recomendados</h2>
<table>
  <thead><tr><th>Tipo de señuelo</th><th>Tamaño orientativo</th><th>Peso habitual</th><th>Uso típico</th></tr></thead>
  <tbody>
    <tr><td>Minnow trucha</td><td>4-7 cm</td><td>2-8 g</td><td>Corriente media, orillas y pozas</td></tr>
    <tr><td>Jerkbait compacto</td><td>5-8 cm</td><td>4-10 g</td><td>Peces activos o indecisos en media agua</td></tr>
    <tr><td>Cucharilla</td><td>Nº 1 a Nº 3</td><td>3-8 g</td><td>Río clásico, lectura rápida de tramo</td></tr>
    <tr><td>Vinilo micro</td><td>4-6 cm</td><td>1-5 g</td><td>Agua clara y trucha recelosa</td></tr>
  </tbody>
</table>

<h2>Colores según claridad y luz</h2>
<ul>
  <li><strong>Agua clara:</strong> naturales (trucha, ayu, plateado fino, oliva).</li>
  <li><strong>Agua tomada:</strong> contraste moderado (chartreuse suave, vientre claro, dorado).</li>
  <li><strong>Poca luz:</strong> perfiles visibles sin pasarte de saturación.</li>
</ul>
<p>Si no hay respuesta, cambia primero profundidad o trayectoria; deja el color como segunda palanca.</p>

<h2>Cómo mover cada señuelo en río</h2>
<p>Para minnow, una recuperación con microtoques y pausas cortas suele funcionar de base. Para jerkbait, mejor secuencia breve y controlada. Para cucharilla, constancia y control de giro. Para vinilo, deriva tensa y pequeños levantamientos. En todos los casos, la clave es entrar bien en la vena del agua, no “recoger por recoger”.</p>

<h2>Errores típicos con señuelos para trucha</h2>
<ul>
  <li>Usar tamaños grandes por inercia de otras especies.</li>
  <li>Entrar demasiado cerca y espantar el tramo.</li>
  <li>Lanzar siempre al mismo ángulo.</li>
  <li>Acelerar demasiado cuando el agua está fría.</li>
  <li>No revisar anzuelos y triples tras enganchar piedra.</li>
</ul>

<h2>Caja mínima de trucha spinning (con cabeza)</h2>
<p>Una caja corta pero muy útil puede incluir: dos minnows (natural + contraste), una cucharilla pequeña, un jerkbait compacto y uno o dos microvinilos. Con eso cubres la mayoría de tramos si ajustas bien presentación y ritmo.</p>
<p>Si quieres completar el conjunto, te conviene leer también <a href="/guia/cana-de-spinning-como-elegir/" style="color:var(--c-primary)">cómo elegir caña de spinning</a> y <a href="/guia/nudos-y-bajos-spinning/" style="color:var(--c-primary)">nudos y bajos</a> para no perder eficacia por montaje.</p>

<h2>Conclusión práctica</h2>
<p>En trucha, el señuelo importa, pero la lectura del río y la presentación importan más. Elige pocos modelos, entiende cuándo usar cada uno y repite situaciones con método. Esa constancia te hará pescar mejor que cualquier compra impulsiva.</p>
"""
    },
    {
        "slug": "tecnicas-spinning-avanzadas",
        "title": "Técnicas de Spinning Avanzadas: Jigging, Twitching y Drop Shot",
        "description": "Domina las técnicas de spinning avanzadas: jigging vertical, twitching, drop shot, Carolina rig y más. Guía práctica para mejorar tus capturas en España.",
        "date": "2026-03-10",
        "reading_time": "7",
        "content": """
<p>Una vez dominados los fundamentos del spinning, llega el momento de incorporar técnicas más sofisticadas que abren un mundo de posibilidades. Estas <strong>técnicas avanzadas de spinning</strong> te permitirán adaptarte a condiciones difíciles, peces selectivos y situaciones donde la recuperación simple no funciona.</p>

<h2>Twitching: el lenguaje del pez herido</h2>
<p>El <strong>twitching</strong> es la técnica de impartir movimientos irregulares al señuelo mediante pequeños tirones (twitches) de caña mientras recuperas línea lentamente. La clave está en la irregularidad: el pez nunca sabe qué va a hacer el señuelo a continuación, lo que desencadena ataques por instinto.</p>
<p><strong>Cómo hacer twitching:</strong> Después del lanzado, baja la punta de la caña. Da pequeños tirones laterales de 10–20 cm con la muñeca, alternados con pausas de 0.5–2 segundos. Recoge el hilo sobrante después de cada tirón. El ataque suele ocurrir durante la pausa.</p>
<p><strong>Cuándo usar twitching:</strong> Agua clara, peces que has visto pero no atacan a la recuperación simple, días fríos con peces lentos. Ideal con minnows hundidos y jerkbaits.</p>

<h2>Jigging vertical</h2>
<p>El <strong>jigging vertical</strong> consiste en dejar caer el jig al fondo y luego subirlo a sacudidas, aprovechando la caída como la fase de ataque principal. Es la técnica más efectiva cuando los peces están en el fondo o pegados a estructuras verticales (muros, pilares, taludes).</p>
<p><strong>Técnica básica:</strong> Deja caer el jig al fondo (notarás que la línea se afloja). Sube la caña rápidamente 50–80 cm. Vuelve a bajar la caña y deja que el jig caiga libremente mientras recoges el hilo sobrante. La mayoría de ataques ocurren en la caída, a menudo no los sientes hasta que vuelves a tensar la línea.</p>
<p><strong>Especies objetivo:</strong> Lucio, perca, lubina y siluro son muy susceptibles al jigging vertical. Especialmente efectivo en embalses en invierno cuando los peces están en el fondo buscando calor.</p>

<h2>Drop shot</h2>
<p>El <strong>drop shot</strong> es un montaje de pesca fina que mantiene el señuelo a una altura fija del fondo. El lastre va en el extremo del hilo y el anzuelo con la goma va unido más arriba mediante un nudo. Es devastador para peces suspendidos justo por encima del fondo.</p>
<p><strong>Montaje:</strong> Ata el anzuelo con un nudo palomar a unos 15–40 cm del extremo del hilo. Deja el extremo suelto y ata ahí un lastre cilíndrico de 3–10 g. El señuelo de goma (gusano, pez pequeño) queda flotando libre en el nudo.</p>
<p><strong>Técnica:</strong> Lanza, deja caer al fondo, tensa ligeramente y mueve la punta de la caña con pequeños movimientos para que el señuelo vibre sin moverse del sitio. El pez lo ataca como si fuera un pez pequeño atrapado en el fondo.</p>

<h2>Carolina Rig</h2>
<p>El <strong>Carolina Rig</strong> es un montaje con un lastre deslizante en la línea principal seguido de un giratorio, un bajo de línea de 30–60 cm y un anzuelo offset con goma. El lastre arrastra por el fondo mientras el señuelo flota libre por detrás. Ideal para lucio y perca en fondos con obstáculos.</p>

<h2>Slow jigging (jigging lento)</h2>
<p>Adaptación del jigging clásico con jigs más ligeros (10–30 g) y movimientos mucho más lentos y deliberados. Especialmente efectivo en agua fría cuando los peces están dormidos. La clave es la paciencia: los movimientos son mínimos y las pausas largas.</p>

<h2>Surface fishing (pesca en superficie)</h2>
<p>La pesca en superficie con <strong>poppers, stickbaits y frogs</strong> es la modalidad más espectacular del spinning. Requiere condiciones específicas (calma, peces activos en superficie) pero las capturas son memorables.</p>
<p><strong>Walking the dog:</strong> La técnica para stickbaits. Con la caña baja y apuntando al agua, da tirones cortos y rítmicos de izquierda a derecha mientras recoges línea lentamente. El señuelo zigzaguea de lado a lado, imitando a un pez desorientado.</p>

<h2>Puntos clave para mejorar</h2>
<ul>
  <li><strong>Sensibilidad de manos:</strong> Aprende a "leer" las vibraciones del señuelo a través de la caña. Cada tipo de fondo, cada tipo de señuelo, cada mordisco tiene una vibración distinta.</li>
  <li><strong>Velocidad de recuperación:</strong> Varía constantemente hasta encontrar la velocidad que provoca ataques. En aguas frías, más lento. En aguas cálidas, más rápido.</li>
  <li><strong>La pausa:</strong> En casi todas las técnicas, la pausa es el momento del ataque. No tengas prisa por recuperar; las pausas estratégicas son clave.</li>
  <li><strong>Observación:</strong> Observa el comportamiento del pez antes de lanzar. ¿Está activo en superficie? ¿En el fondo? ¿Persiguiendo señuelos pero sin morder? Cada comportamiento pide una técnica diferente.</li>
</ul>
"""
    },
    {
        "slug": "calendario-spinning-espana",
        "title": "Calendario de Spinning en España: Qué Pescar en Cada Época",
        "description": "Guía estacional para planificar tus salidas de spinning en España: especies, escenarios, horas clave y señuelos según primavera, verano, otoño e invierno.",
        "date": "2026-03-18",
        "reading_time": "8",
        "content": """
<p>No existe un único calendario perfecto para todo el país, pero sí hay patrones claros. La temperatura del agua, la actividad de las presas y el nivel de oxígeno cambian mucho entre estaciones, y eso altera el comportamiento de lubinas, lucios, truchas, percas y otros depredadores. Tener un <strong>calendario de spinning en España</strong> te ayuda a elegir mejor el escenario, la especie y el señuelo antes de salir de casa.</p>

<h2>Primavera: actividad creciente y peces repartidos</h2>
<p>La primavera es una de las mejores épocas para el spinning porque el agua gana temperatura y los depredadores vuelven a moverse de forma más consistente. En embalses y ríos, el lucio y la perca suelen responder muy bien a minnows suspending, jerkbaits y jigs medios. En costa, la lubina se acerca a playas, desembocaduras y espumeros con mayor frecuencia.</p>
<p>En esta época interesa cubrir agua y alternar recuperación lineal con pausas largas. Las primeras y últimas horas siguen siendo excelentes, aunque en días templados también puede haber actividad útil a media mañana.</p>

<h2>Verano: menos margen, más precisión</h2>
<p>Con agua caliente, muchos peces reducen actividad durante las horas centrales. En verano conviene afinar más: amanecer, anochecer y zonas sombrías suelen marcar la diferencia. En embalses, los peces bajan de capa y los jigs, vinilos y crankbaits profundos ganan peso. En el mar, el rockfishing ligero y los minnows hundidos en primeras luces funcionan especialmente bien.</p>
<p>El error clásico del verano es insistir en superficie o media agua cuando el pez está claramente abajo. Si no hay respuesta rápida, busca profundidad, estructuras y entradas de agua fresca.</p>

<h2>Otoño: ventana top para depredadores</h2>
<p>El otoño es la estación más agradecida para muchos pescadores de spinning. Los peces comen con agresividad antes del invierno y aceptan señuelos más visibles y voluminosos. Es el gran momento para lucio, lubina y perca grande, con jornadas muy activas en embalses, rías y playas abiertas.</p>
<p>Los colores naturales siguen funcionando, pero cuando el agua se mueve o se tiñe puedes apretar con chartreuse, blanco o acabados con flash. En muchas zonas de España, el otoño premia recorrer metros y repetir lances sobre estructuras claras.</p>

<h2>Invierno: lentitud, pausas y profundidad</h2>
<p>En invierno el spinning sigue siendo productivo, pero exige paciencia. El pez no quiere perseguir tanto y la pausa se vuelve clave. Jerkbaits suspending, vinilos pequeños y montajes lentos ganan protagonismo. En costa, la lubina puede responder muy bien con mar movido, espuma y corrientes activas. En interior, los peces se concentran más y leer bien el escenario importa mucho.</p>
<p>Si en otras épocas 20 minutos sin toque invitan a moverse, en invierno a veces compensa insistir en una estructura que ya sabes que da pez. Menos desplazamiento y más precisión suelen funcionar mejor.</p>

<h2>Resumen rápido por estaciones</h2>
<table>
  <thead><tr><th>Estación</th><th>Escenario fuerte</th><th>Especies habituales</th><th>Señuelos más fiables</th></tr></thead>
  <tbody>
    <tr><td><strong>Primavera</strong></td><td>Embalses, desembocaduras</td><td>Lucio, lubina, perca</td><td>Minnow, jerkbait, jig medio</td></tr>
    <tr><td><strong>Verano</strong></td><td>Profundidad, sombra, costa al alba</td><td>Lubina, trucha, perca</td><td>Vinilo, jig, minnow hundido</td></tr>
    <tr><td><strong>Otoño</strong></td><td>Embalses abiertos, playas, roquedos</td><td>Lucio, lubina, perca grande</td><td>Jerkbait, swimbait, minnow</td></tr>
    <tr><td><strong>Invierno</strong></td><td>Estructuras profundas y espumeros</td><td>Lubina, lucio, trucha</td><td>Suspending, vinilo fino, slow jig</td></tr>
  </tbody>
</table>

<h2>Cómo usar este calendario sin caer en recetas fijas</h2>
<p>El calendario sirve como punto de partida, no como norma cerrada. Hay embalses someros que arrancan antes en primavera, costas que mejoran mucho con temporales suaves y ríos que cambian por caudal o presión de pesca. Tu mejor combinación siempre será <strong>estación + lectura del agua + especie objetivo</strong>.</p>
<p>Si vienes de contenido rápido en redes, esta es la gran diferencia entre ver clips y pescar mejor: entender <em>por qué</em> cambia el comportamiento del pez. Cuando unes calendario, escenario y técnica, empiezas a tomar decisiones con criterio y no por impulso.</p>
"""
    },
    {
        "slug": "como-elegir-senuelo-segun-agua-y-clima",
        "title": "Cómo Elegir el Señuelo Según el Agua, el Clima y la Profundidad",
        "description": "Aprende a escoger el señuelo correcto según claridad del agua, viento, temperatura, corriente y capa de trabajo. Guía práctica para pescar con más criterio.",
        "date": "2026-03-20",
        "reading_time": "9",
        "content": """
<p>Comprar señuelos sin un criterio claro es una de las formas más rápidas de llenar cajas y frustrarse en el agua. La elección correcta no depende solo de la especie: también manda la <strong>claridad del agua</strong>, la <strong>profundidad</strong>, la <strong>velocidad de corriente</strong>, el viento, la luz y la actividad del pez. Si entiendes estas variables, pescas más y compras mejor.</p>

<h2>Agua clara: perfil natural y movimientos limpios</h2>
<p>En aguas claras los peces ven mejor y disponen de más tiempo para inspeccionar el señuelo. Por eso suelen funcionar mejor los acabados naturales: plateado, boquerón, perca, trucha, ayu o colores translúcidos. También conviene evitar vibraciones exageradas salvo que el pez esté muy activo.</p>
<p>Los minnows, jerkbaits y vinilos discretos suelen rendir muy bien aquí. Si el pez sigue el señuelo pero no remata, baja el tamaño, alarga la pausa o reduce la agresividad del movimiento.</p>

<h2>Agua con algo de color o turbia: más vibración y contraste</h2>
<p>Cuando el agua tiene color, el pez detecta antes la vibración y la silueta que los detalles finos. En estas condiciones destacan spinnerbaits, crankbaits marcados, jigs con volumen y colores de contraste como chartreuse, blanco, negro o naranja. El objetivo es que el señuelo se localice con facilidad.</p>
<p>No siempre hay que ir a un señuelo enorme. A veces basta con aumentar contraste, ruido o peso para mantener contacto y provocar una reacción.</p>

<h2>Profundidad: el señuelo debe trabajar donde está el pez</h2>
<p>Muchos días el problema no es el color, sino la capa de agua. Si el pez está pegado al fondo, da igual lo bonito que sea un minnow de superficie. Por eso conviene pensar primero en la <strong>profundidad de trabajo</strong>:</p>
<ul>
  <li><strong>Superficie y lámina alta:</strong> poppers, pencils, minnows flotantes.</li>
  <li><strong>Media agua:</strong> minnows suspending, jerkbaits, crankbaits medios.</li>
  <li><strong>Fondo o capas profundas:</strong> jigs metálicos, vinilos plomados, crankbaits profundos.</li>
</ul>
<p>Una regla sencilla: si no tocas agua “útil” en varios lances, cambia el peso o el tipo de señuelo antes de cambiar de color.</p>

<h2>Luz, viento y presión de pesca</h2>
<p>Con mucha luz y peces recelosos, la naturalidad gana puntos. En amaneceres, atardeceres, días cubiertos o agua rota por el viento puedes permitirte más flash, más vibración y recuperaciones algo más agresivas. La presión de pesca también cuenta: en escenarios muy castigados, un perfil discreto y una pausa larga suelen marcar más diferencia que cambiar de marca o de precio.</p>

<h2>Temperatura del agua: más o menos persecución</h2>
<p>Con agua caliente el pez suele perseguir mejor, aunque en verano muchas veces baja de capa. Con agua fría, el ataque se decide más por cercanía, pausa y facilidad de captura. Eso favorece jerkbaits suspending, vinilos finos y movimientos lentos. Si el agua está fría y el pez no quiere correr, la solución rara vez es acelerar.</p>

<h2>Matriz rápida de decisión</h2>
<table>
  <thead><tr><th>Condición</th><th>Qué priorizar</th><th>Señuelo recomendable</th></tr></thead>
  <tbody>
    <tr><td>Agua clara y pez receloso</td><td>Naturalidad y pausa</td><td>Minnow fino o vinilo discreto</td></tr>
    <tr><td>Agua turbia o espuma</td><td>Contraste y vibración</td><td>Spinnerbait, crankbait, jig</td></tr>
    <tr><td>Pez en superficie</td><td>Presencia visual</td><td>Popper o pencil</td></tr>
    <tr><td>Pez en fondo</td><td>Peso y control</td><td>Jig o vinilo plomado</td></tr>
    <tr><td>Agua fría</td><td>Movimiento lento</td><td>Jerkbait suspending o vinilo</td></tr>
  </tbody>
</table>

<h2>Qué revisar antes de comprar un señuelo online</h2>
<p>Si compras un señuelo online, no mires solo la foto principal. Revisa tamaño real, peso, profundidad declarada, tipo de anzuelo, sistema de transferencia de pesos y comentarios donde se vea el señuelo en mano. Un señuelo económico puede ser muy útil, pero solo si encaja en tu escenario real de pesca.</p>
<p>La mejor compra no es la más viral, sino la que cubre un hueco concreto en tu caja: una capa de agua, una especie, una condición de luz o un tipo de corriente que todavía no tienes bien resuelto.</p>
"""
    },
    {
        "slug": "errores-spinning-principiantes",
        "title": "Errores de Spinning para Principiantes y Cómo Corregirlos",
        "description": "Los fallos más comunes al empezar en el spinning: elección de equipo, lectura del agua, ritmo de recuperación y compras impulsivas. Aprende a corregirlos.",
        "date": "2026-03-24",
        "reading_time": "8",
        "content": """
<p>La mayoría de pescadores no abandonan el spinning por falta de peces, sino por acumular pequeños errores que les impiden progresar. La buena noticia es que casi todos tienen solución rápida. Si estás empezando, esta guía te ahorrará dinero, frustración y muchas horas improductivas.</p>

<h2>Error 1: comprar equipo sin definir escenario</h2>
<p>No es lo mismo pescar trucha en río pequeño que lubina en costa o lucio en embalse. Sin embargo, mucha gente compra la primera caña o el primer carrete que ve en un vídeo corto sin pensar dónde va a pescar de verdad. Antes de gastar, define tu escenario principal y el peso de señuelos que vas a usar la mayor parte del tiempo.</p>

<h2>Error 2: abusar de la recuperación lineal</h2>
<p>Recoger siempre igual funciona algunos días, pero limita muchísimo tus opciones. Las pausas, tirones suaves, cambios de velocidad y ángulos de recuperación son parte del lenguaje del spinning. Cuando un señuelo “no funciona”, muchas veces lo que falla no es el señuelo, sino cómo lo estás moviendo.</p>

<h2>Error 3: cambiar de señuelo antes de leer el agua</h2>
<p>Cambiar cada dos minutos transmite la sensación de estar haciendo mucho, pero no siempre ayuda. Antes de modificar color o forma, pregúntate: ¿estoy pescando la capa correcta?, ¿hay corriente?, ¿hay pez pasto?, ¿estoy pasando cerca de una estructura? La lectura del agua va antes que la ansiedad por cambiar de modelo.</p>

<h2>Error 4: usar una caja llena y una estrategia vacía</h2>
<p>Uno de los problemas más frecuentes en webs de afiliación y redes es que todo parece imprescindible. En realidad, para empezar necesitas muy pocas piezas bien elegidas: un par de minnows, algún vinilo, un jig y quizá un señuelo de superficie. La caja se construye con intención, no por acumulación.</p>

<h2>Error 5: ignorar mantenimiento y seguridad</h2>
<p>Un carrete salado, un anillo dañado o un alicate que nunca llevas encima terminan costando más que cualquier compra inicial. Mantener el equipo básico en orden y llevar herramientas simples mejora mucho la experiencia, especialmente cuando pescas con triples o en zonas de roca.</p>

<h2>Error 6: no adaptar horario y ritmo a la estación</h2>
<p>En verano insistir al mediodía puede ser poco productivo; en invierno recuperar demasiado rápido suele matar la jornada. El spinning cambia con la estación y el agua. Si copias una técnica sin contexto, el resultado suele ser irregular. Por eso es mejor pensar siempre en la combinación <strong>hora + temperatura + profundidad + especie</strong>.</p>

<h2>Resumen rápido para corregirlos</h2>
<ul>
  <li>Define un escenario principal y compra en torno a él.</li>
  <li>Lleva una caja corta con roles claros, no una colección infinita.</li>
  <li>Varía velocidad, pausas y ángulo antes de descartar un señuelo.</li>
  <li>Observa corriente, pez pasto, sombras y cambios de profundidad.</li>
  <li>Mantén carrete, anzuelos y accesorios en buen estado.</li>
</ul>

<h2>La mejora real no llega por comprar más</h2>
<p>Si vienes de TikTok o de vídeos muy cortos, es normal querer respuestas inmediatas: “qué señuelo”, “qué color”, “qué caña”. Pero el salto real aparece cuando empiezas a conectar material, escenario y comportamiento del pez. Esa lectura es la que convierte una compra barata en una buena compra y una jornada floja en una salida con criterio.</p>
<p>Empieza por dominar pocas variables cada vez. Un pescador que entiende cuatro señuelos y dos escenarios suele rendir mejor que otro con veinte señuelos y ninguna estrategia.</p>
"""
    },
    {
        "slug": "leer-embalse-lucio-perca",
        "title": "Cómo Leer un Embalse para Encontrar Lucio y Perca en Spinning",
        "description": "Aprende a interpretar puntas, reculas, viento, profundidad y pez pasto para localizar lucio y perca en embalses españoles sin pescar a ciegas.",
        "date": "2026-04-07",
        "reading_time": "11",
        "content": """
<p>Muchos pescadores se frustran en embalse porque sienten que lanzan a una masa inmensa de agua sin pistas claras. La buena noticia es que un embalse rara vez es “todo igual”. Siempre hay estructuras, orientaciones, reculas, cambios de profundidad, entradas de agua, viento, sombra y comida. Aprender a <strong>leer un embalse</strong> es probablemente una de las habilidades que más capturas aporta a medio plazo.</p>

<h2>Empieza por reducir el agua útil</h2>
<p>El primer error es querer cubrirlo todo. En realidad, lo más rentable es descartar rápido grandes zonas. Un embalse suele darte mejores opciones en <strong>puntas, taludes, reculas con vida, árboles sumergidos, cambios de color y entradas de agua</strong>. Si además hay viento empujando alimento o pez pasto hacia una orilla concreta, esa zona gana valor de inmediato.</p>
<p>Piensa así: no buscas agua, buscas <em>condiciones</em>. Una misma punta puede ser mediocre un día plano y excelente cuando recibe viento, sombra o movimiento de alburno.</p>

<h2>Puntas, reculas y cambios de profundidad</h2>
<p>Las <strong>puntas</strong> son transiciones muy claras entre profundidad y paso de pez pasto. Lucios y percas las usan para emboscar o patrullar. Si una punta cae rápido a una zona más profunda, todavía mejor. Empieza rastreando desde poco fondo hacia media agua y luego profundiza si no hay respuesta.</p>
<p>Las <strong>reculas</strong> funcionan especialmente bien en primavera y otoño, cuando entra agua con algo de color, alimento o pequeños peces. No todas valen igual: prioriza las que tengan mezcla de estructura, vegetación o cambios de temperatura. Muchas picadas llegan en la unión entre el agua que entra y el cuerpo principal del embalse.</p>

<h2>El viento no molesta tanto como parece</h2>
<p>Una orilla batida por viento puede ser incómoda para lanzar, pero muchas veces concentra vida. El viento mueve plancton, activa el pez pasto y rompe la visibilidad del depredador. Para lucio y perca esto suele traducirse en más opciones. En lugar de evitar siempre la cara de viento, aprende a distinguir cuándo ese viento está construyendo una situación interesante.</p>
<p>Si el viento es moderado, usa señuelos con algo de peso y mantén contacto. Si es fuerte, céntrate en ángulos cortos, líneas tensas y zonas donde el agua empujada choca con una estructura clara.</p>

<h2>Qué busca el lucio en embalse</h2>
<p>El lucio quiere ventaja táctica. Busca bordes de vegetación, árboles sumergidos, entradas de recula, cambios de profundidad y plataformas donde pueda subir a cazar. En primavera y otoño puede moverse mucho más por capas medias, mientras que en invierno suele concentrarse y aceptar mejor presentaciones lentas.</p>
<p>Si sospechas lucio pero no das con él, revisa tres cosas antes de cambiar de zona: <strong>profundidad</strong>, <strong>ritmo</strong> y <strong>ángulo de lance</strong>. Muchas veces el mismo señuelo funciona cuando pasa dos metros más pegado a una pared o cuando alargas la pausa en la caída.</p>

<h2>Qué busca la perca</h2>
<p>La perca americana tiende a moverse más en grupo y a relacionarse con estructuras duras, desniveles, cambios de fondo y bancos de pez pequeño. En embalse español responde muy bien cuando encuentras una zona donde se concentra alimento. Ahí un vinilo pequeño, un jig fino o un crankbait corto pueden encadenar varias picadas seguidas.</p>
<p>Con perca, el detalle importa más: tamaño contenido, ritmo algo más estable y mucho control de profundidad. Si hay actividad pero ataques tímidos, baja perfil antes de pensar que el sitio no tiene pez.</p>

<h2>Embalse según estación</h2>
<table>
  <thead><tr><th>Estación</th><th>Qué mirar primero</th><th>Tono de la pesca</th></tr></thead>
  <tbody>
    <tr><td><strong>Primavera</strong></td><td>Reculas, puntas con vida, zonas menos frías</td><td>Actividad creciente, peces más repartidos</td></tr>
    <tr><td><strong>Verano</strong></td><td>Sombras, profundidad, entradas de agua</td><td>Ventanas cortas y necesidad de precisión</td></tr>
    <tr><td><strong>Otoño</strong></td><td>Puntas, orillas con viento, comida acumulada</td><td>Una de las mejores épocas para cubrir agua</td></tr>
    <tr><td><strong>Invierno</strong></td><td>Estructuras profundas y peces agrupados</td><td>Ritmo lento, pausas largas y más insistencia</td></tr>
  </tbody>
</table>

<h2>Cómo plantear una jornada sin sonda</h2>
<p>No necesitas electrónica para mejorar mucho. Puedes dividir la jornada en tres bloques: primero localiza zonas con potencial visual, después cubre capas con una familia de señuelos y, por último, repite sobre las mejores estructuras con otra profundidad o velocidad. Ese método simple evita la sensación de ir improvisando cada cinco minutos.</p>
<ul>
  <li>Empieza por una punta, una recula o una estructura clara.</li>
  <li>Haz varios lances cambiando profundidad antes de abandonar la zona.</li>
  <li>Si ves pez pasto, repite el ángulo que mejor contacto te dé.</li>
  <li>Si el agua está fría, insiste más y recorre menos metros.</li>
  <li>Si hay viento útil, no lo descartes solo por incomodidad.</li>
</ul>

<h2>La lectura del embalse vale más que una caja enorme</h2>
<p>Un pescador que entiende dónde se concentra la vida en un embalse suele necesitar menos cambios de señuelo. Por eso esta habilidad es tan rentable. Localizar la zona correcta, la profundidad razonable y la estructura dominante hace que el material empiece a tener sentido. Sin esa lectura previa, cualquier compra parece insuficiente.</p>
<p>Cuando interiorizas este enfoque, dejas de “pescar agua” y empiezas a buscar escenarios concretos. Ahí es donde el spinning se vuelve más técnico, más entretenido y también mucho más productivo.</p>
"""
    },
    {
        "slug": "spinning-costa-espuma-mareas",
        "title": "Spinning desde Costa en España: Espuma, Mareas, Viento y Lectura del Mar",
        "description": "Guía extensa para pescar a spinning desde costa: cómo leer espuma, corrientes, mareas, viento y horarios para buscar lubina con más criterio.",
        "date": "2026-04-07",
        "reading_time": "12",
        "content": """
<p>La costa ofrece una de las versiones más adictivas del spinning, pero también una de las más complejas. La lubina, la anjova o incluso la corvina no están repartidas al azar: responden a <strong>espuma, corriente, oleaje, viento, profundidad, luz y comida disponible</strong>. Por eso aprender a leer el mar es mucho más importante que acumular señuelos de moda.</p>

<h2>Qué significa realmente “leer la espuma”</h2>
<p>Cuando hablamos de espuma no nos referimos a cualquier agua blanca. La espuma útil suele señalar una mezcla de oxígeno, cobertura visual y alimento removido. Una lubina se siente cómoda entrando en esas zonas porque puede atacar con ventaja y exponerse menos. El truco está en mirar dónde se forma, cuánto dura y cómo se conecta con canales o piedras.</p>
<p>En playas abiertas, la espuma suele marcar barras y canales. En costa rocosa, puede señalar una piedra aislada, un escalón o una vena de agua que vuelve mar adentro. La clave no es lanzar a toda la mancha blanca, sino identificar el borde o la salida donde el pez puede colocarse a esperar.</p>

<h2>Mareas y movimiento del agua</h2>
<p>No toda la costa española tiene la misma amplitud de marea, pero en muchas zonas el cambio de nivel sí altera cómo se activan los escenarios. La subida puede acercar actividad a piedras someras, puntas y espumeros. La bajada puede ordenar mejor los canales y dejar más visibles ciertas corrientes de retorno. Si pescas zonas con marea marcada, aprender a relacionar cada punto con un tramo de marea te ahorra muchas horas vacías.</p>
<p>Si tu zona no tiene gran marea, entonces el peso recae más en el oleaje, el viento y la luz. La pregunta sigue siendo la misma: ¿dónde se concentra la comida y dónde puede esconderse la lubina con ventaja?</p>

<h2>Viento a favor, de cara o cruzado</h2>
<p>El viento no solo complica el lance; también reorganiza el escenario. Un viento moderado puede activar una orilla si empuja agua, alimento y pez pasto. Un viento fuerte puede volver impracticable un punto, pero no siempre porque “no haya pescado”, sino porque técnicamente no puedes presentar bien. Distinguir entre escenario malo y escenario mal pescado es parte del aprendizaje.</p>
<p>Con viento de cara conviene usar señuelos que corten bien el aire y centrarte en lances útiles, no en distancia máxima. Con viento cruzado, el control de la barriga de la línea se vuelve clave. Con viento a favor, a veces ganas metros pero pierdes sensibilidad si no mantienes tensión.</p>

<h2>Señuelos que tienen sentido desde costa</h2>
<p>Desde costa funcionan muy bien los <strong>minnows hundidos</strong> para cubrir medias aguas, los <strong>jigs</strong> cuando necesitas distancia o bajar más rápido, y los <strong>poppers o pencils</strong> si ves actividad alta o una ventana clara de superficie. No necesitas veinte modelos distintos. Sí te conviene tener tres roles bien cubiertos:</p>
<ul>
  <li>Un minnow de confianza para agua movida o luz baja.</li>
  <li>Un señuelo de lance largo para viento y corrientes.</li>
  <li>Una opción de superficie para amaneceres, atardeceres o pez arriba.</li>
</ul>
<p>El color importa, pero menos que la colocación. En agua clara funcionan muy bien plateados y tonos naturales. Con el mar movido o con cielo cerrado, un toque de contraste puede ayudar. Aun así, si el señuelo pasa fuera de la corriente útil, el mejor color del mundo sirve de poco.</p>

<h2>Canales, puntas y desembocaduras</h2>
<p>En playa, busca canales entre barras, zonas donde el agua vuelve al mar y puntos donde la espuma forma una línea reconocible. En roquedos, las puntas que rompen corriente son especialmente buenas. En desembocaduras, la mezcla de agua dulce, comida y cambios de velocidad puede ser excelente, sobre todo cuando la luz acompaña.</p>
<p>Una buena práctica es repetir el mismo lance varias veces si la corriente está bien definida. La lubina no siempre entra a la primera. A veces necesita ver dos o tres pasadas por la misma vena antes de decidirse.</p>

<h2>Horarios que suelen tener sentido</h2>
<p>Las primeras y últimas luces siguen siendo grandes momentos porque reducen visibilidad y aumentan confianza del depredador. En días cubiertos o con mar activado, la ventana útil puede ampliarse mucho. También hay escenarios muy buenos de noche, donde la silueta y la vibración ganan protagonismo.</p>
<p>En cambio, con agua limpia, cielo despejado y cero movimiento, muchas jornadas de costa se vuelven finas y exigentes. Ahí conviene bajar ruido, buscar estructuras pequeñas y trabajar con más paciencia.</p>

<h2>Errores habituales del spinning costero</h2>
<ul>
  <li>Querer lanzar a cualquier espuma sin leer su sentido.</li>
  <li>Confundir mar movido con mar útil.</li>
  <li>Cambiar de señuelo antes de cambiar ángulo o profundidad.</li>
  <li>Insistir en superficie cuando el pez claramente no está arriba.</li>
  <li>Subestimar la seguridad en roca mojada o mar de fondo.</li>
</ul>

<h2>Seguridad y criterio antes que épica</h2>
<p>La pesca desde costa tiene un componente visual muy potente y por eso en redes parece fácil entrar en cualquier piedra y lanzar. En la práctica, la seguridad manda. No merece la pena forzar un acceso ni quedarse en una postura insegura por una foto o por completar una sesión. Un pescador que vuelve siempre puede seguir aprendiendo el escenario.</p>

<h2>La costa premia observar más que acumular</h2>
<p>Cuando alguien dice que “hoy no había nada” muchas veces quiere decir que no consiguió leer el escenario. La costa cambia cada día, y justo ahí está su magia. Cuanto más aprendes a relacionar espuma, canal, viento y luz, menos dependes del señuelo milagroso y más dejas que el mar te diga dónde merece la pena insistir.</p>
<p>Esa lectura es la que convierte una salida casual en una jornada estratégica. Y esa estrategia es la que hace que el spinning costero en España pueda ser una disciplina tan absorbente como elegante.</p>
"""
    },
    {
        "slug": "nudos-y-bajos-spinning",
        "title": "Nudos y Bajos para Spinning: Montajes que Sí Tienen Sentido",
        "description": "Guía práctica sobre nudos, bajos y montajes para spinning: unión trenzado-fluoro, grapas, acero para lucio y errores comunes que conviene evitar.",
        "date": "2026-04-07",
        "reading_time": "10",
        "content": """
<p>Una gran parte de los problemas en spinning no viene de la caña ni del señuelo, sino de las uniones. Nudos mal apretados, bajos poco coherentes, grapas sobredimensionadas o ausencia de protección frente a dientes y rocas acaban en cortes, señuelos perdidos y peces fallados. Entender <strong>nudos y bajos</strong> no es glamour, pero sí una de las formas más rápidas de pescar con más confianza.</p>

<h2>La cadena completa importa</h2>
<p>Piensa el montaje como una cadena: línea principal, unión, bajo y conexión con el señuelo. Si una parte falla, da igual que el resto sea excelente. El spinning moderno se apoya mucho en <strong>trenzado + bajo de fluorocarbono</strong>, pero no es una receta fija. Hay escenarios donde un monofilamento sencillo o un bajo más largo tienen sentido.</p>

<h2>Trenzado a fluorocarbono: la unión más habitual</h2>
<p>Para la mayoría de situaciones de spinning, el trenzado aporta sensibilidad y el fluorocarbono añade discreción y resistencia al roce. La unión debe ser fuerte, compacta y suficientemente limpia para pasar por anillas sin castigar el lance. Si estás empezando, no necesitas dominar diez nudos: necesitas uno que repitas bien.</p>
<p>Los más conocidos para esta unión son el <strong>FG</strong>, el <strong>Albright modificado</strong> y el <strong>doble uni</strong>. El FG es excelente cuando está bien ejecutado, pero también más técnico. El doble uni o el Albright bien apretados son opciones muy razonables para muchos pescadores recreativos.</p>

<h2>Cuándo usar bajo largo o corto</h2>
<p>Un bajo corto es rápido, cómodo y suficiente en situaciones donde buscas funcionalidad antes que refinamiento. Un bajo algo más largo puede ayudar en agua clara, peces recelosos o escenarios con roce continuo. No hace falta obsesionarse con una medida exacta, pero sí tener claro el motivo de cada elección.</p>
<table>
  <thead><tr><th>Escenario</th><th>Bajo orientativo</th><th>Qué prioriza</th></tr></thead>
  <tbody>
    <tr><td>Embalse abierto</td><td>60-100 cm</td><td>Discreción y margen al roce</td></tr>
    <tr><td>Costa con rocas</td><td>80-150 cm</td><td>Resistencia y control en roce</td></tr>
    <tr><td>Río pequeño</td><td>40-80 cm</td><td>Rapidez y sencillez</td></tr>
    <tr><td>Lucio con dientes</td><td>Bajo específico</td><td>Evitar cortes</td></tr>
  </tbody>
</table>

<h2>Lucio y materiales resistentes a corte</h2>
<p>Con lucio, un fluorocarbono normal puede quedarse corto frente a dientes y giros violentos. Mucha gente usa acero, titanio o fluorocarbonos muy gruesos según estilo de pesca y tamaño de señuelo. Aquí no hay dogma absoluto, pero sí una idea clara: si de verdad buscas lucio, debes montar un bajo que minimice el riesgo de corte.</p>
<p>Un error común es lanzar un señuelo caro con una unión delicada “porque así se mueve mejor”. El movimiento del señuelo importa, sí, pero no más que traer el pez y el señuelo de vuelta.</p>

<h2>Grapas, mosquetones y cuándo prescindir de ellos</h2>
<p>Las grapas permiten cambiar rápido y en muchos minnows o jerkbaits pequeños ayudan a que el señuelo trabaje libre. El problema aparece cuando se usan modelos demasiado grandes, rígidos o de calidad pobre. Ahí alteran la acción y se convierten en un punto débil más.</p>
<p>Como regla simple: usa grapa cuando realmente te aporte comodidad y movimiento; prescinde de ella si el señuelo o la técnica pide máxima limpieza, o si el tamaño del conjunto se vuelve desproporcionado.</p>

<h2>Nudos del señuelo</h2>
<p>Para atar directamente al señuelo, el <strong>Palomar</strong>, el <strong>improved clinch</strong> y los nudos de lazo sencillo siguen siendo grandes opciones. El punto clave no es el nombre, sino la ejecución: humedecer antes de apretar, cerrar con calma y revisar que la línea no se haya quemado al tensarla.</p>

<h2>Errores frecuentes en montajes</h2>
<ul>
  <li>Recortar el bajo hasta dejar una unión demasiado cerca del señuelo.</li>
  <li>No revisar el tramo final después de tocar roca, dientes o estructuras.</li>
  <li>Usar grapas sobredimensionadas “por seguridad”.</li>
  <li>Confiar en un nudo complejo que solo sale bien una de cada tres veces.</li>
  <li>No reapretar o repetir el nudo después de una captura fuerte.</li>
</ul>

<h2>El mejor montaje es el que puedes repetir bien</h2>
<p>En internet abundan debates infinitos sobre si un nudo es un 5% mejor que otro. Para la mayoría de pescadores, la mejora real está en dominar tres o cuatro uniones y repetirlas siempre bien hechas. Un montaje coherente y revisado aporta mucha más tranquilidad que una lista interminable de tutoriales guardados.</p>
<p>Si conviertes tus uniones en una rutina, pescas con menos dudas, lanzas con más confianza y pierdes menos tiempo resolviendo fallos evitables. Y en spinning, esa confianza influye tanto como el señuelo elegido.</p>
"""
    },
    {
        "slug": "checklist-salida-spinning",
        "title": "Qué Revisar Antes de una Salida de Spinning: Guía Práctica",
        "description": "Guía práctica para preparar una salida de spinning en España: equipo, seguridad, licencias, caja útil, ropa y decisiones previas antes de salir de casa.",
        "date": "2026-04-07",
        "reading_time": "10",
        "content": """
<p>Una salida de spinning mejora mucho cuando la preparas bien antes de salir de casa. No hace falta convertir cada jornada en una expedición, pero sí revisar algunos puntos que evitan olvidos, pérdidas de tiempo y decisiones precipitadas en el agua. Una buena revisión previa te deja la cabeza libre para observar mejor y pescar con más calma.</p>

<h2>Primero: decide escenario y objetivo</h2>
<p>Antes de meter cosas en la mochila, define tres variables: <strong>dónde vas</strong>, <strong>qué especie esperas</strong> y <strong>qué ventana de tiempo vas a aprovechar</strong>. No es lo mismo una mañana corta en río que una tarde entera en costa o una jornada en embalse con viento. Esa decisión previa ordena la selección de caña, señuelos, ropa y ritmo mental.</p>

<h2>Revisión básica del equipo</h2>
<ul>
  <li>Caña y carrete revisados, sin anillas dañadas ni holguras raras.</li>
  <li>Línea principal en buen estado y bajo preparado o de repuesto.</li>
  <li>Caja corta con señuelos que cubran capas y condiciones reales.</li>
  <li>Grapas, giratorios o repuestos si sueles usarlos.</li>
  <li>Alicates, pequeño cortahílos y algún recambio de anzuelo si toca.</li>
</ul>
<p>El objetivo no es llevarlo todo. Es llevar una selección que responda a la jornada prevista. Muchas salidas se complican por exceso de material mal organizado, no por falta de opciones.</p>

<h2>Documentación y normativa</h2>
<p>Según la comunidad autónoma y el escenario, puede que necesites licencia, permiso específico o conocer vedas y tallas. Revisar eso antes de salir es tan importante como preparar la caña. También conviene confirmar si el acceso sigue siendo viable, si hay restricciones temporales o si el caudal, la marea o el parte de mar han cambiado.</p>

<h2>Ropa, seguridad y comodidad</h2>
<p>Una jornada incómoda suele traducirse en menos atención y peores decisiones. Lleva ropa adaptada a la temperatura real, no a la del coche al salir. En costa o roca, el calzado importa muchísimo. En embalse o río, una gorra, agua y protección solar siguen siendo básicos incluso en días aparentemente suaves.</p>
<p>Si vas a caminar bastante, aligera. Si vas a pescar roca o zonas técnicas, prioriza estabilidad y movilidad. Si el escenario presenta riesgo, la primera decisión correcta es renunciar a lo innecesario.</p>

<h2>Qué revisar justo antes del primer lance</h2>
<table>
  <thead><tr><th>Chequeo</th><th>Qué buscas</th><th>Por qué importa</th></tr></thead>
  <tbody>
    <tr><td>Uniones y nudos</td><td>Roce, vueltas raras, cierre limpio</td><td>Evita pérdidas por fallo simple</td></tr>
    <tr><td>Freno del carrete</td><td>Tensión razonable</td><td>Ni demasiado suelto ni bloqueado</td></tr>
    <tr><td>Primer señuelo</td><td>Rol claro</td><td>Empiezas con intención, no por azar</td></tr>
    <tr><td>Ángulo de entrada</td><td>Lectura del agua</td><td>Te obliga a mirar antes de lanzar</td></tr>
  </tbody>
</table>

<h2>La caja útil frente a la caja infinita</h2>
<p>Una salida normal rara vez necesita veinte señuelos distintos. Suele bastar con una pequeña selección que cubra superficie, media agua y fondo; un perfil natural y otro con contraste; y algún peso que te permita adaptarte si cambia el viento o la corriente. Todo lo que no tenga un rol claro probablemente está ocupando espacio mental.</p>

<h2>Plan mental antes de empezar</h2>
<p>Además del material, conviene salir con una idea sencilla de plan: qué vas a mirar primero, cuánto tiempo dedicarás a una zona antes de moverte y qué variable vas a cambiar si no hay respuesta. Esa microestrategia evita que cada jornada se convierta en una secuencia de cambios impulsivos.</p>
<ul>
  <li>¿Voy a cubrir agua o a insistir en una estructura concreta?</li>
  <li>¿Qué capa quiero comprobar primero?</li>
  <li>¿Qué cambio haré antes: color, profundidad o ritmo?</li>
  <li>¿Qué guía o criterio estoy poniendo a prueba hoy?</li>
</ul>

<h2>La preparación también forma parte de pescar bien</h2>
<p>Preparar una salida no le quita romanticismo a la pesca; al contrario, permite disfrutar más del tiempo en el agua. Cuando no dudas de si llevas licencias, si el bajo está bien o si olvidaste los alicates, puedes dedicar más atención a leer el entorno, ajustar la técnica y aprender del escenario.</p>
<p>Una buena revisión previa no es rigidez. Es una base que te deja improvisar mejor cuando de verdad merece la pena hacerlo.</p>
"""
    },
    {
        "slug": "especies-spinning-espana",
        "title": "Qué Peces Puedes Pescar a Spinning en España: Atlas de Especies",
        "description": "Guía completa de las principales especies que puedes pescar a spinning en España: agua dulce y costa, comportamiento, escenarios y señuelos que mejor encajan.",
        "date": "2026-04-07",
        "reading_time": "14",
        "content": """
<p>Una de las dudas más comunes cuando alguien empieza en esta modalidad es muy simple: <strong>qué peces se pueden pescar a spinning en España</strong>. La respuesta corta es que muchísimos más de los que parece. No solo hablamos de depredadores clásicos como lucio, lubina o trucha; también entran especies pelágicas, peces de roca, oportunistas de río e incluso peces que no siempre asociamos al spinning pero que responden muy bien a pequeños vinilos, paseantes o microjigs cuando se dan las condiciones.</p>
<p>La clave es entender que el spinning no es una lista cerrada de especies, sino una forma de pescar basada en <strong>mover un señuelo artificial con intención</strong>. Por eso cambia mucho según si hablamos de embalse, río, desembocadura, playa, roca o puerto. Esta guía no pretende hacer un inventario biológico absoluto de todos los peces de España, sino un <strong>atlas práctico de las especies principales y más realistas</strong> para un pescador de spinning en nuestro país.</p>

<h2>Resumen rápido: especies de spinning más habituales en España</h2>
<table>
  <thead>
    <tr><th>Bloque</th><th>Especies más habituales</th><th>Escenarios típicos</th><th>Nivel recomendado</th></tr>
  </thead>
  <tbody>
    <tr><td>Agua dulce</td><td>Lucio, trucha, black bass, lucioperca, perca, siluro</td><td>Embalses, ríos medios, tramos de montaña</td><td>Desde inicial</td></tr>
    <tr><td>Costa y desembocadura</td><td>Lubina, baila, anjova, palometón, jurel, caballa y, en fino, dorada, sargo u oblada</td><td>Playa, roca, escollera, bocana, puerto</td><td>Desde inicial</td></tr>
    <tr><td>Aguas cálidas y pelágicos</td><td>Llampuga, barracuda, serviola, melva, bacoreta, bonito</td><td>Puertos, puntas, espigones y costa abierta</td><td>Intermedio</td></tr>
    <tr><td>Microspinning y rockfishing</td><td>Dorada, sargo, oblada, pequeños serránidos, jurelillo, caballa pequeña, baila</td><td>Puerto, escollera, roca, playa mixta y zonas de luz</td><td>Inicial</td></tr>
    <tr><td>Oportunistas</td><td>Barbo, cacho, aspio donde exista, algunas carángidas y espáridos</td><td>Río, desembocadura, puerto</td><td>Intermedio</td></tr>
  </tbody>
</table>

<h2>Agua dulce: el gran laboratorio del spinning interior</h2>
<p>En el interior de España el spinning vive sobre todo en embalses, grandes ríos y tramos medios con estructura. Aquí el pescador aprende a leer puntas, reculas, entradas de agua, vegetación, cambios de profundidad y viento útil. Las especies más habituales son:</p>
<ul>
  <li><strong>Lucio:</strong> probablemente la especie más icónica del spinning interior. Muy presente en embalses y aguas con estructura.</li>
  <li><strong>Trucha:</strong> reina del spinning ligero en ríos de montaña y tramos bien oxigenados.</li>
  <li><strong>Black bass:</strong> uno de los peces que más enseña sobre precisión, coberturas y lectura fina.</li>
  <li><strong>Lucioperca:</strong> más de fondo, más de ventana corta y muy ligada a vinilos y lecturas lentas.</li>
  <li><strong>Perca:</strong> ideal para aprender equipos ligeros, tamaños pequeños y ritmos vivos.</li>
  <li><strong>Siluro:</strong> especie especial, no para empezar, pero muy presente en ciertas cuencas.</li>
</ul>
<p>Si quieres profundizar más en este bloque, merece mucho la pena leer también nuestra guía sobre <a href="/guia/peces-spinning-agua-dulce-espana/" style="color:var(--c-primary)">peces de agua dulce para spinning en España</a> y la de <a href="/guia/leer-embalse-lucio-perca/" style="color:var(--c-primary)">cómo leer un embalse</a>.</p>

<h2>Costa: la diversidad real es mayor de lo que parece</h2>
<p>Cuando se piensa en spinning de mar en España, casi todo gira alrededor de la lubina. Es normal: es la especie más constante, más repartida y más agradecida para una web centrada en costa desde tierra. Pero la realidad es bastante más amplia. En nuestras costas también pueden aparecer anjovas, palometones, llampugas, jureles, caballas, melvas, bacoretas, bailas, barracudas y, cuando hablamos de spinning ligero o rockfishing, también espáridos como la <strong>dorada</strong>, el <strong>sargo</strong> o la <strong>oblada</strong>.</p>
<p>La gran diferencia respecto al interior es que en el mar manda mucho más el <strong>contexto instantáneo</strong>: espuma, marea, viento, corriente, claridad, banco de pez pasto y dirección del agua. Por eso el spinning de costa no suele recompensar tanto al que repite mecánicamente, sino al que sabe leer rápido el escenario.</p>
<p>Para desarrollar esta parte hemos añadido una guía específica de <a href="/guia/peces-spinning-mar-espana/" style="color:var(--c-primary)">peces de mar para spinning en España</a> y otra pieza táctica sobre <a href="/guia/spinning-costa-espuma-mareas/" style="color:var(--c-primary)">espuma, mareas y lectura del mar</a>.</p>

<h2>Las especies clave de spinning en España, una por una</h2>
<h3>Lucio</h3>
<p>El lucio es la gran escuela del spinning de embalse. Premia el trabajo sobre estructura, cambios de profundidad, vegetación, puntas batidas por viento y entradas de agua. En primavera y otoño suele dar ventanas excelentes; en verano obliga a hilar más fino con sombras y capas profundas; en invierno pide pausa y control. Si quieres una base de señuelos concreta, la guía de <a href="/guia/mejores-senueulos-lucio/" style="color:var(--c-primary)">mejores señuelos para lucio</a> sigue siendo la referencia natural.</p>

<h3>Trucha</h3>
<p>La trucha exige otro tipo de pescador: más silencioso, más preciso y más fino con el tamaño del señuelo. Aquí importan mucho la corriente, el ángulo de entrada, la sombra, las posturas del pez y el control del señuelo en deriva o contracorriente. No necesita cajas enormes; necesita lectura de agua y ajuste fino. Es una de las mejores especies para aprender spinning ligero de verdad.</p>

<h3>Black bass</h3>
<p>Aunque no siempre aparece en todas las conversaciones generalistas sobre spinning en España, el black bass forma parte total del paisaje de muchos embalses y escenarios cálidos. Enseña muchísimo sobre coberturas, pausas, precisión de lance y ritmo. Es menos “de cubrir agua a lo loco” y más de presentar con intención cerca de estructuras, sombras, piedras, árboles y vegetación.</p>

<h3>Lucioperca</h3>
<p>Es una especie menos visual que el lucio y menos explosiva en apariencia, pero tremendamente interesante para quien disfruta de la lectura lenta, el fondo y las ventanas cortas. En muchos escenarios españoles responde especialmente bien a vinilos, montajes plomados, recogidas controladas y momentos de poca luz. No siempre perdona los errores de profundidad.</p>

<h3>Perca</h3>
<p>La perca es una especie magnífica para quien quiere afinar equipo ligero y entender el movimiento de bancos, escalones, entradas de agua y microestructuras. Admite microjigs, vinilos pequeños, crankbaits compactos y minnows cortos. Además, es un pez muy agradecido para aprender a detectar cuándo el problema no es el color, sino el tamaño, la profundidad o la velocidad.</p>

<h3>Siluro</h3>
<p>El siluro no es “un lucio grande”, sino un mundo aparte. Entra en el universo del spinning, sí, pero exige una mentalidad distinta: equipo más serio, señuelos más voluminosos, escenarios muy concretos y bastante respeto. Quien empieza no debería convertirlo en objetivo principal, pero cualquier atlas honesto de spinning en España tiene que incluirlo porque en cuencas como el Ebro es parte central del paisaje pesquero.</p>

<h3>Lubina</h3>
<p>La lubina es el gran pilar del spinning desde costa. Funciona en playa, roca, ría, espigón, desembocadura y puerto, siempre que sepas leer comida, espuma, corriente y orillas activas. No es una especie de “señuelo único”; entra a minnows, paseantes, jigs, vinilos y topwater según mar, luz y altura de agua. Si pescas costa española, tarde o temprano acabarás aprendiendo de verdad alrededor de la lubina.</p>

<h3>Anjova y palometón</h3>
<p>Cuando sube el ritmo, aparece el spinning más agresivo. Anjovas y palometones son peces de persecución, velocidad y violencia en el ataque. Piden comida presente, agua viva y a menudo señuelos que permitan cubrir metros rápido. Son especies muy atractivas para el pescador de orilla porque convierten una jornada de observación en algo eléctrico.</p>

<h3>Jurel, caballa, melva y otros pelágicos pequeños</h3>
<p>No siempre se les da el valor que merecen, pero son básicos para entender el spinning ligero de mar. Jigs pequeños, cucharillas, minnows compactos y vinilos finos permiten disfrutar mucho cuando el agua tiene movimiento y entra pescado al puerto, la escollera o la punta. Además, son especies que obligan a afinar lance, tensión y lectura de capa.</p>

<h3>Dorada, sargo y oblada</h3>
<p>No son la imagen típica del spinning de costa generalista, pero sí forman parte de la realidad del <strong>spinning ligero</strong> y del <strong>rockfishing</strong> en España. En puertos, escolleras, playas mixtas y desembocaduras pueden entrar a microjigs, pequeños vinilos, minnows cortos o señuelos compactos cuando el tamaño de la comida, la claridad y la capa son las correctas.</p>
<p>Más que venderlas como “la especie estrella” del spinning, conviene explicarlas bien: son peces que afinan mucho al pescador porque obligan a bajar tamaño, a moderar la velocidad y a leer mejor la orilla. Y eso encaja perfectamente con una guía seria sobre las especies que realmente se tocan a spinning en España.</p>

<h3>Llampuga, barracuda, serviola y aguas cálidas</h3>
<p>En el Mediterráneo y en determinadas ventanas cálidas aparecen especies que cambian por completo la película. La llampuga es visual, móvil y muy ligada a comida y estructuras flotantes. La barracuda pide perfiles alargados y cierta lectura de agua clara. La serviola, cuando se deja tocar desde costa o espigón, exige ya otro nivel de equipo y decisión. Son peces que dan mucha personalidad al spinning marino español.</p>

<h2>Qué especies son mejores para empezar</h2>
<p>Si alguien empieza desde cero en España, mi consejo práctico es este:</p>
<ul>
  <li><strong>Interior:</strong> perca, trucha y bass cuando el escenario sea amable; lucio cuando ya entiendas algo más de agua y señuelo.</li>
  <li><strong>Costa:</strong> lubina y pelágicos pequeños como jurel o caballa en momentos de actividad.</li>
  <li><strong>Más adelante:</strong> lucioperca, anjova, palometón, siluro o especies cálidas de costa.</li>
</ul>
<p>No porque unas especies sean “mejores” que otras, sino porque cada una exige un nivel distinto de lectura, de equipo y de paciencia. Empezar por una especie demasiado técnica a veces da una falsa sensación de fracaso cuando en realidad el problema es de curva de aprendizaje.</p>

<h2>No intentes cubrirlas todas a la vez</h2>
<p>Una de las trampas más comunes al descubrir la variedad del spinning en España es querer preparar una caja para lucio, lubina, bass, jurel, anjova y trucha al mismo tiempo. Eso casi siempre termina en equipo duplicado, compras poco afinadas y jornadas confusas. Lo razonable es elegir <strong>una familia de escenarios</strong>, dos o tres especies realistas de tu zona y construir desde ahí.</p>
<p>Si quieres convertir este atlas en decisiones prácticas, la mejor ruta es sencilla: empieza por la <a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">guía para principiantes</a>, usa después la <a href="/guia-interactiva/" style="color:var(--c-primary)">guía interactiva</a> para una situación concreta y entra en las guías por especie o escenario cuando ya tengas claro qué agua vas a pisar.</p>
"""
    },
    {
        "slug": "peces-spinning-agua-dulce-espana",
        "title": "Peces de Agua Dulce para Spinning en España: Guía por Especies",
        "description": "Lucio, trucha, black bass, lucioperca, perca, siluro y otras especies de agua dulce para spinning en España. Dónde buscarlas y cómo enfocarlas.",
        "date": "2026-04-07",
        "reading_time": "13",
        "content": """
<p>Si pescas embalses, ríos o grandes masas de agua interiores, tarde o temprano acabarás haciéndote esta pregunta: <strong>qué peces merece la pena buscar a spinning en agua dulce en España</strong>. La respuesta depende mucho de tu zona, de la normativa y del tipo de agua que tengas cerca, pero hay un grupo de especies que se repite una y otra vez en la práctica real del pescador español.</p>
<p>Esta guía está pensada para ordenar ese mapa: qué especies son más habituales, qué nivel de dificultad tienen, en qué escenarios suelen aparecer y qué familia de señuelos tiene más sentido para empezar cada una.</p>

<h2>Tabla rápida de especies de agua dulce para spinning</h2>
<table>
  <thead>
    <tr><th>Especie</th><th>Dónde destaca</th><th>Mejor momento</th><th>Señuelos base</th><th>Dificultad</th></tr>
  </thead>
  <tbody>
    <tr><td>Lucio</td><td>Embalses, reculas, puntas, vegetación</td><td>Primavera y otoño</td><td>Minnow, jerkbait, swimbait, spinnerbait</td><td>Media</td></tr>
    <tr><td>Trucha</td><td>Ríos de montaña y tramos frescos</td><td>Primavera, otoño y ventanas finas de verano</td><td>Minnow pequeño, cucharilla, microvinilo</td><td>Media</td></tr>
    <tr><td>Black bass</td><td>Embalses cálidos, coberturas y orillas tomadas</td><td>Primavera, verano temprano y otoño</td><td>Vinilo, paseante, jerkbait, jig</td><td>Media</td></tr>
    <tr><td>Lucioperca</td><td>Embalses profundos y orillas con escalón</td><td>Otoño, invierno y poca luz</td><td>Vinilo plomado, montaje fino, minnow hundido</td><td>Alta</td></tr>
    <tr><td>Perca</td><td>Embalses y ríos con bancos de pez pasto</td><td>Primavera y otoño</td><td>Microjig, pequeño crank, vinilo corto</td><td>Inicial</td></tr>
    <tr><td>Siluro</td><td>Grandes ríos y embalses concretos</td><td>Calor y ventanas de actividad marcadas</td><td>Vinilo grande, swimbait, hardbait voluminoso</td><td>Alta</td></tr>
    <tr><td>Barbo y oportunistas</td><td>Ríos medios, corrientes y zonas someras</td><td>Primavera y verano</td><td>Pequeño vinilo, paseante, microseñuelo</td><td>Media</td></tr>
  </tbody>
</table>

<h2>Lucio: la especie que mejor enseña a leer un embalse</h2>
<p>El lucio es probablemente la especie más completa para entender el spinning interior en España. No porque siempre sea fácil, sino porque obliga a trabajar muchos conceptos útiles: viento, estructura, vegetación, pez pasto, cambios de profundidad, entradas de agua y pausas. Quien aprende a buscar lucio con cabeza suele mejorar también con otras especies.</p>
<p>Lo normal es encontrarlo en embalses y aguas con clara lógica de emboscada. En primavera y otoño da jornadas muy agradecidas. En verano se vuelve más de sombra, horas cortas y capas profundas. En invierno la pausa gana muchísimo peso. Si tu prioridad es esta especie, enlaza esta lectura con <a href="/guia/mejores-senueulos-lucio/" style="color:var(--c-primary)">la guía específica de señuelos para lucio</a>.</p>

<h2>Trucha: precisión, ángulo y control del señuelo</h2>
<p>La trucha exige menos volumen de equipo y más lectura fina. Aquí no suele ganar quien hace más ruido o quien cambia más de señuelo, sino quien entiende bien la corriente, entra desde buen ángulo y pasa el señuelo por la capa exacta donde el pez está cómodo. Es una especie perfecta para aprender a pescar “limpio”.</p>
<p>Pequeños minnows, cucharillas, ondulantes y microvinilos siguen siendo la base. Los mejores tramos para spinning de trucha suelen ser aguas oxigenadas, sombreadas, con corrientes variadas y refugios claros. Para mucha gente, la trucha es la escuela real del spinning ligero.</p>

<h2>Black bass: cobertura, pausa y decisiones cortas</h2>
<p>El black bass aparece en muchísimos escenarios de interior y cambia bastante la forma de pensar la jornada. Aquí la cobertura importa muchísimo: ramas, piedras, carrizos, claros entre vegetación, orillas con sombra, plataformas, recodos. Más que “cubrir agua” sin criterio, lo normal es encadenar presentaciones a puntos concretos.</p>
<p>Es una especie excelente para aprender a decidir rápido: si conviene vinilo, paseante, montaje sin plomar, jerkbait o un pequeño jig. También es muy útil para interiorizar que no siempre manda la velocidad de recogida; a veces manda mucho más el sitio exacto donde cae el señuelo.</p>

<h2>Lucioperca: cuando el fondo manda de verdad</h2>
<p>La lucioperca es una especie que obliga a madurar como pescador. En muchos escenarios entra cuando el señuelo pasa por la capa correcta y con el ritmo correcto; si fallas una de las dos, puedes tener la sensación de que “no hay pez” cuando en realidad solo estás pescando fuera de rango. Por eso tanta gente la asocia al trabajo con vinilo, cabezas plomadas, montajes discretos y momentos de poca luz.</p>
<p>No es la especie que yo recomendaría como primer objetivo absoluto, pero sí una de las más interesantes cuando ya has aprendido a leer escalones, fondos mixtos y ventanas más cortas de actividad.</p>

<h2>Perca: la mejor especie para afinar el equipo ligero</h2>
<p>La perca tiene muchísimo valor formativo. Te obliga a ajustar tamaño, a leer bancos, a entender cuándo el pez está en media agua y cuándo está pegado al fondo, y a no sobredimensionar el equipo. Microjigs, pequeños vinilos, minnows cortos y cranks compactos suelen resolver gran parte de las situaciones.</p>
<p>Además, es una especie que castiga bastante bien un error muy común: insistir con un señuelo demasiado grande cuando el problema real es que el banco está comiendo pequeño.</p>

<h2>Siluro: objetivo grande, responsabilidad grande</h2>
<p>El siluro está muy presente en la conversación del spinning español porque hay escenarios donde es imposible ignorarlo. Pero conviene decirlo claro: no es una especie para construir la base. Exige equipo sólido, montaje coherente, control de pelea y bastante cabeza. Quien llega demasiado pronto al siluro sin haber entendido aún la lógica del agua suele apoyarse demasiado en la fuerza del equipo y demasiado poco en la lectura del escenario.</p>
<p>Eso no le quita interés; al contrario. Solo significa que encaja mejor como paso posterior, no como primer escalón.</p>

<h2>Barbo, cacho y otras especies oportunistas</h2>
<p>Una de las cosas bonitas del spinning interior en España es que no todo acaba en las especies “estrella”. En algunos ríos y tramos se pueden provocar ataques de barbos, cachos y otras especies oportunistas con pequeños paseantes, vinilos o señuelos discretos. No siempre son objetivos principales, pero sí una parte muy real del paisaje del spinning ligero y ultraligero.</p>
<p>Esto además te obliga a ampliar la mirada: un escenario no solo vale por la especie de portada. A veces un río aparentemente modesto enseña más que un gran embalse si lo recorres con ojos de spinning fino.</p>

<h2>Qué caja de señuelos tiene sentido para empezar en agua dulce</h2>
<p>En vez de comprar “por especie” desde el primer día, funciona mejor construir una caja corta por funciones:</p>
<ul>
  <li><strong>Un minnow versátil</strong> para cubrir orilla y media agua.</li>
  <li><strong>Un jerkbait o suspending</strong> para pausas y ventanas finas.</li>
  <li><strong>Uno o dos vinilos</strong> con distintos pesos de cabeza.</li>
  <li><strong>Un spinnerbait o chatter</strong> para agua tomada, vegetación o vibración.</li>
  <li><strong>Un pequeño señuelo de superficie</strong> si tu zona tiene bass, perca, barbo o lucio en caliente.</li>
</ul>
<p>Después, ya sí, afinas hacia lucio, trucha o bass. Pero la base no debería nacer de una lista infinita de especies, sino de situaciones reales.</p>

<h2>Qué especie elegir según tu zona y tu nivel</h2>
<p>Si vives cerca de embalses grandes y quieres una especie muy formativa, el lucio es una opción excelente. Si tienes ríos frescos y quieres aprender fino, la trucha es la mejor escuela. Si tu entorno son embalses templados y orillas con coberturas, el bass te obliga a pensar mejor. Si ya controlas profundidad, ritmo y ventanas, la lucioperca te hará crecer mucho. Y si lo que quieres es pulir equipo ligero y técnica corta, la perca sigue siendo una maestra fantástica.</p>
<p>La idea importante es esta: el spinning interior español es mucho más rico cuando eliges la especie por <strong>encaje real con tu agua</strong>, no por fama en redes. Ahí es donde más rápido se aprende.</p>
"""
    },
    {
        "slug": "peces-spinning-mar-espana",
        "title": "Peces de Mar para Spinning en España: Lubina, Anjova, Pelágicos y Más",
        "description": "Guía completa de peces de mar para spinning en España: lubina, anjova, palometón, llampuga, jurel, caballa, barracuda, dorada, sargo, oblada y otras especies de costa.",
        "date": "2026-04-07",
        "reading_time": "13",
        "content": """
<p>El spinning de mar en España es mucho más diverso de lo que parece cuando uno mira solo redes sociales o fotos sueltas. Sí, la <strong>lubina</strong> sigue siendo la gran especie de referencia desde costa, pero no es ni mucho menos la única. Según la comunidad, la época y el tipo de orilla, pueden entrar anjovas, palometones, jureles, caballas, melvas, llampugas, barracudas, bailas, serviolas y, en el terreno del <strong>spinning ligero</strong>, también <strong>doradas, sargos y obladas</strong> que responden a minnows pequeños, microjigs, paseantes compactos o pequeños vinilos.</p>
<p>La dificultad está en que el mar es menos estable que el embalse: hoy una playa parece vacía y mañana tiene comida, espuma y actividad por todas partes. Por eso esta guía está pensada para ordenar las especies más realistas de spinning marino en España y el tipo de enfoque que pide cada una.</p>

<h2>Tabla rápida de peces de mar para spinning en España</h2>
<table>
  <thead>
    <tr><th>Especie</th><th>Escenario típico</th><th>Mejor momento</th><th>Señuelo base</th><th>Dificultad</th></tr>
  </thead>
  <tbody>
    <tr><td>Lubina</td><td>Playa, roca, ría, espigón, desembocadura</td><td>Amanecer, noche, mar movido</td><td>Minnow, paseante, vinilo, jig</td><td>Inicial / media</td></tr>
    <tr><td>Baila</td><td>Puertos, bocanas, playas y escolleras</td><td>Agua templada y actividad alta</td><td>Minnow pequeño, paseante, vinilo</td><td>Inicial</td></tr>
    <tr><td>Anjova</td><td>Costa abierta, puntas, playas con comida</td><td>Verano y otoño</td><td>Paseante, pencil, jig, minnow rápido</td><td>Media</td></tr>
    <tr><td>Palometón</td><td>Espigón, desembocadura, playa profunda</td><td>Calor y agua viva</td><td>Pencil, minnow largo, jig, stickbait</td><td>Media / alta</td></tr>
    <tr><td>Jurel y caballa</td><td>Puertos, espigones, luces, bancos activos</td><td>Primavera a otoño</td><td>Microjig, cucharilla, pequeño vinilo</td><td>Inicial</td></tr>
    <tr><td>Dorada, sargo y oblada</td><td>Puerto, escollera, playa mixta, desembocadura</td><td>Amanecer, atardecer y actividad de orilla</td><td>Microjig, pequeño vinilo, minnow corto</td><td>Inicial / media</td></tr>
    <tr><td>Llampuga</td><td>Puertos, boyas, puntas, estructuras flotantes</td><td>Final de verano y otoño</td><td>Paseante, jig ligero, pequeño minnow</td><td>Media</td></tr>
    <tr><td>Barracuda / espetón</td><td>Agua clara, costa cálida, puertos</td><td>Otoño e invierno suave</td><td>Minnow alargado, jerkbait, pencil</td><td>Media</td></tr>
    <tr><td>Serviola y pelágicos grandes</td><td>Puntas, espigones, corriente y profundidad</td><td>Calor y paso de pescado</td><td>Jig, stickbait, minnow grande</td><td>Alta</td></tr>
  </tbody>
</table>

<h2>Lubina: la gran especie escuela del spinning de costa</h2>
<p>La lubina es la especie que mejor resume el spinning marino español porque enseña casi todo: lectura de espuma, canales, desembocaduras, marea, viento, actividad del pez pasto y adaptación de señuelo según luz y profundidad. No exige un único estilo. A veces se pesca arriba con paseante; otras veces manda el minnow; otras, un vinilo bien llevado junto al fondo.</p>
<p>También es la especie más lógica para empezar si pescas desde costa. Tiene presencia amplia, admite muchos enfoques y te obliga a aprender a leer el mar de verdad. Por eso siguen siendo clave nuestras guías de <a href="/guia/mejores-senueulos-lubina/" style="color:var(--c-primary)">señuelos para lubina</a> y de <a href="/guia/spinning-costa-espuma-mareas/" style="color:var(--c-primary)">espuma, mareas y viento</a>.</p>

<h2>Baila: la prima cercana que muchas veces salva la jornada</h2>
<p>La baila aparece menos en titulares pero merece bastante más atención. Comparte muchas cosas con la lubina, aunque suele moverse en tamaños menores y en escenarios algo más calmados o cercanos a puerto y desembocadura. Para quien empieza en costa, puede ser una especie muy agradecida porque responde bien a minnows pequeños, vinilos discretos y recogidas nada exageradas.</p>

<h2>Anjova: velocidad, agresividad y agua viva</h2>
<p>Cuando la anjova entra en escena, el mar cambia de tono. Es una especie de persecución, de ataques muy duros y de jornadas donde compensa cubrir agua rápido. Si ves actividad arriba, pez pasto nervioso o persecuciones claras, conviene pensar en pencils, paseantes, minnows rápidos y jigs que permitan meter ritmo.</p>
<p>No es una especie para pescarla “como si fuera lubina” con otro nombre. Necesita más velocidad, más decisión y, a menudo, montaje más serio.</p>

<h2>Palometón: presencia grande y escenarios con espacio</h2>
<p>El palometón desde costa es una de esas especies que marcan al pescador. Pide agua con recorrido, orillas profundas, desembocaduras, playas con paso de comida y momentos en los que el pez patrulla con intención. No siempre es un pez de jornadas continuas, pero cuando aparece conviene estar preparado con señuelos que muevan aire y agua de forma creíble.</p>
<p>Muchos pescadores se precipitan y sobredimensionan todo. La realidad es que el criterio importa más que el exceso: lectura de distancia, trayectoria del banco, velocidad del señuelo y control de la recogida.</p>

<h2>Jurel, caballa, melva y bacoreta: la escuela perfecta del spinning ligero de mar</h2>
<p>Para aprender en costa, este bloque es oro puro. Jureles y caballas permiten practicar lectura de superficie, cortes de agua, capas de actividad y tamaños pequeños. Melvas y bacoretas ya suben el ritmo y la exigencia, pero siguen enseñando muchísimo sobre timing, lance y rapidez de decisión.</p>
<p>El error típico aquí es usar señuelos demasiado grandes o recoger sin tensión ni intención. Microjigs, cucharillas, pequeños minnows y vinilos finos suelen resolver mucho mejor la situación real.</p>

<h2>Dorada, sargo y oblada: sí, también tienen sitio en una web seria de spinning</h2>
<p>Si solo miras el spinning de costa desde la óptica del minnow de lubina o del pencil para anjova, parece que estos peces no pintan nada. Pero en la práctica española de <strong>light spinning</strong> y <strong>rockfishing</strong> sí encajan. La dorada, el sargo y la oblada aparecen alrededor de puertos, escolleras, zonas mixtas de arena y piedra, desembocaduras y orillas con comida pequeña. No siempre son el objetivo principal, pero negar su presencia sería explicar el mar de forma incompleta.</p>
<p>La clave aquí es reducir tamaño, perfilar mejor la capa y bajar la agresividad del señuelo. Microjigs de poco peso, pequeños vinilos tipo shad o worm, minnows cortos y señuelos compactos pescados con continuidad suelen tener mucho más sentido que montar una caja pensada para peces puramente pelágicos. Son especies que afinan al pescador: obligan a leer mejor la orilla, a no exagerar la velocidad y a entender cuándo hay que pescar fino.</p>

<h2>Llampuga: una especie que llega con calor y cambia el plan</h2>
<p>La llampuga es muy visual y muy de oportunidad. Puede aparecer alrededor de estructuras flotantes, entradas de puerto, boyas, puntas y escenarios donde se concentra pez pequeño. Es un pez que castiga la lentitud mental: cuando la tienes delante, conviene responder rápido, con un señuelo que caiga bien y se mueva con ligereza.</p>
<p>No es una especie para todos los días, pero sí una de las que más personalidad dan al spinning de final de verano y otoño en muchas zonas cálidas.</p>

<h2>Barracuda, espetón y aguas claras</h2>
<p>En determinadas costas y épocas suaves aparecen barracudas o espetones, peces muy ligados a agua clara, perfiles alargados y cierto componente visual. Aquí el minnow fino, el jerkbait largo y el pencil con silueta estrecha suelen tener bastante sentido. No siempre conviene pescar demasiado deprisa; muchas veces lo importante es el ángulo y la continuidad del recorrido.</p>

<h2>Serviola y grandes pelágicos: otro escalón</h2>
<p>La serviola entra ya en un terreno algo distinto. No porque deje de ser spinning, sino porque sube mucho la exigencia de equipo, de escenario y de toma de decisiones. Profundidad, corriente, paso de comida y capacidad de pelea importan mucho. Quien viene del spinning ligero suele disfrutarla más cuando ya ha hecho antes el camino con especies menores.</p>

<h2>Rockfishing y microspinning: mucho más que peces pequeños</h2>
<p>A veces se menosprecia el rockfishing porque se asocia a capturas pequeñas, pero como escuela técnica vale muchísimo. Obliga a leer microestructuras, entradas de corriente, luz, pequeños cambios de fondo y peces que comen de forma distinta según la altura del agua. Obladas, sargos, doradas de orilla, pequeños serránidos, jurelillo, caballa menuda y otras especies de puerto o roca convierten una jornada aparentemente discreta en una clase magistral de control fino.</p>
<p>Además, este tipo de pesca encaja muy bien con espigones, puertos accesibles y salidas cortas, algo importante para quien todavía no domina escenarios grandes de costa abierta.</p>

<h2>Cómo elegir especie objetivo según el escenario</h2>
<ul>
  <li><strong>Playa abierta con algo de mar:</strong> lubina como referencia, con opción de anjova o palometón en época.</li>
  <li><strong>Roca y punta con agua viva:</strong> lubina, anjova, barracuda y algunos pelágicos según estación.</li>
  <li><strong>Puerto y bocana:</strong> baila, lubina, jurel, caballa, dorada, sargo y rockfishing ligero.</li>
  <li><strong>Desembocadura:</strong> lubina todo el año con picos muy buenos, y oportunidades de palometón, anjova o pelágicos.</li>
  <li><strong>Escollera de paso:</strong> mezcla muy interesante de lubina, jurel, caballa, anjova, sargo, oblada y especies de oportunidad.</li>
</ul>

<h2>Una caja de costa con sentido para cubrir varias especies</h2>
<p>Igual que en agua dulce, no hace falta montar una caja gigantesca para cada pez. Si quieres cubrir bastante mar sin perder el norte, funciona muy bien una base así:</p>
<ul>
  <li>Un <strong>minnow de 10 a 14 cm</strong> para lubina y costa generalista.</li>
  <li>Un <strong>paseante o pencil</strong> para actividad arriba y agua caliente.</li>
  <li>Uno o dos <strong>jigs metálicos</strong> de distinto peso para distancia y pelágicos.</li>
  <li>Un <strong>vinilo con cabeza</strong> para fondo, espuma o agua más lenta.</li>
  <li>Un conjunto de <strong>microjigs o pequeños señuelos</strong> para jurel, caballa, dorada, sargo, oblada y momentos de microspinning.</li>
</ul>
<p>Con eso puedes leer mucho más mar del que parece. El resto ya es especialización.</p>

<h2>La mejor especie de mar para empezar</h2>
<p>Si tuviera que elegir una sola para empezar desde costa en España, seguiría diciendo lubina. No porque sea la más fácil todos los días, sino porque es la que más te obliga a aprender cosas transferibles: lectura del agua, elección de perfil, ritmo de recogida, horas útiles y relación entre comida y estructura. Después, el bloque de jurel, caballa y pequeños pelágicos es perfecto para afinar reflejos y equipo ligero.</p>
<p>Cuando el mar te enseñe ya a leer actividad, entonces anjova, palometón o llampuga pasarán de parecer especies “de foto” a convertirse en objetivos realistas.</p>
"""
    },
    {
        "slug": "licencias-pesca-espana",
        "title": "Licencia de Pesca en España (2026): guía completa para spinning + enlaces oficiales",
        "description": "Todo sobre licencia de pesca en España para spinning: tipos, precios orientativos, interautonómica y enlaces oficiales por comunidades y provincias.",
        "date": "2026-04-07",
        "reading_time": "14",
        "content": """
<p>Resolver el tema de las <strong>licencias de pesca</strong> antes de preparar la caja te ahorra dos cosas muy poco épicas: viajes perdidos y problemas evitables. En spinning esto importa todavía más porque solemos movernos mucho entre ríos, embalses, puertos, espigones, playas o desembocaduras, y no siempre vale la misma documentación para todos los escenarios.</p>
<p>Esta guía está escrita con una idea muy simple: que un pescador de spinning en España entienda <strong>qué licencia necesita de verdad</strong>, qué errores son los más comunes y dónde puede entrar para tramitarla en el <strong>portal oficial</strong> de su comunidad. He revisado los accesos enlazados el <strong>7 de abril de 2026</strong> y he priorizado páginas públicas de la administración, no gestorías ni terceros.</p>

<div class="fact-grid">
  <div class="fact-card"><div class="fact-card-num">17</div><div class="fact-card-label">Comunidades con gestión propia</div></div>
  <div class="fact-card"><div class="fact-card-num">2</div><div class="fact-card-label">Escenarios principales: continental y mar</div></div>
  <div class="fact-card"><div class="fact-card-num">10</div><div class="fact-card-label">Comunidades en la red interautonómica a 07/04/2026</div></div>
  <div class="fact-card"><div class="fact-card-num">1</div><div class="fact-card-label">Error caro: confundir licencia con permiso</div></div>
</div>

<h2>Lo primero: en España no se tramita por provincia, sino por comunidad autónoma</h2>
<p>Esta es la confusión más repetida. Mucha gente busca “licencia de pesca en Zaragoza”, “licencia de pesca en Málaga” o “licencia de pesca en Lugo”, pero la gestión real suele hacerse a nivel de <strong>comunidad autónoma</strong>. Por eso aquí verás cada bloque ordenado por comunidad y, dentro de él, las provincias que cubre. Es la forma más útil de entenderlo si pescas a spinning y te mueves por varios escenarios.</p>
<p>Dicho de otra manera: si sales a por lucio en Valladolid, trucha en León o bass en Guadalajara, no compras una licencia provincial aislada, sino la licencia que regula la comunidad en la que vas a pescar. Luego, además, puede tocar añadir <strong>permiso de coto</strong>, autorización especial o validación concreta si el tramo lo exige.</p>

<div class="tip-box">
  <div class="tip-box-title">Qué necesita un pescador de spinning, resumido</div>
  <p><strong>Ríos y embalses:</strong> licencia continental o fluvial de la comunidad correspondiente. <strong>Costa y mar:</strong> licencia marítima recreativa o licencia de superficie según la comunidad litoral. <strong>Cotos, zonas controladas y tramos especiales:</strong> casi siempre piden algo más además de la licencia básica.</p>
</div>

<h2>Qué licencia necesitas según el escenario donde haces spinning</h2>
<h3>Spinning en agua dulce</h3>
<p>Si tu pesca habitual es de <strong>lucio, trucha, bass, lucioperca, perca o siluro</strong> en ríos y embalses, lo normal es que te pidan una <strong>licencia de pesca continental</strong>. Esa licencia te habilita para pescar en aguas interiores de la comunidad, pero no te libra automáticamente de permisos extra en cotos, escenarios deportivos, reservas o zonas de regulación especial.</p>
<p>Aquí es donde muchos pescadores se confían. Pagan la licencia, la guardan en el móvil y creen que ya está todo resuelto. Luego llegan a un coto intensivo, a una zona controlada o a un tramo con cupo y descubren que faltaba el permiso de jornada. Si quieres salir mejor preparado, te conviene enlazar esta lectura con nuestra <a href="/guia/checklist-salida-spinning/" style="color:var(--c-primary)">checklist de salida para spinning</a>.</p>

<h3>Spinning en costa, puertos y desembocaduras</h3>
<p>Si haces spinning a <strong>lubina, anjova, palometón, jurel, caballa, dorada, sargo u oblada</strong> desde costa, el punto importante es comprobar si tu comunidad litoral exige una <strong>licencia marítima recreativa</strong>, una <strong>licencia de superficie</strong> o ambas cosas según modalidad. En algunas comunidades el trámite está muy claro y se hace online en pocos minutos; en otras conviene leer antes si pescas desde tierra, desde embarcación o en zona portuaria, porque pueden existir matices.</p>
<p>La regla práctica es sencilla: si vas a mar, no des por hecho que con una licencia continental o con la de otra comunidad ya estás cubierto. En costa cambian bastante la gestión, las clases de licencia y algunas restricciones. Si pescas sobre todo el mar, acompaña esta guía con nuestra pieza sobre <a href="/guia/peces-spinning-mar-espana/" style="color:var(--c-primary)">peces de mar para spinning en España</a>.</p>

<h2>Licencia autonómica o interautonómica: cuándo compensa de verdad</h2>
<p>Si solo pescas siempre dentro de la misma comunidad, la licencia autonómica normal suele ser la vía más lógica. Pero si eres de los que un fin de semana baja a un embalse de Castilla-La Mancha, al siguiente pisa Aragón y en vacaciones cruza a Extremadura o Galicia, entonces conviene mirar con mucha atención la <strong>licencia interautonómica</strong>.</p>
<p>A fecha de <strong>7 de abril de 2026</strong>, el convenio de licencia interautonómica de pesca en aguas continentales ya se ha ido ampliando y alcanza <strong>diez comunidades</strong>. La conclusión práctica es clara: si te mueves bastante por interior, esta licencia puede ahorrarte trámites, pagos duplicados y olvidos. Si tu pesca se concentra en una sola zona, quizá no te haga falta.</p>

<div class="pro-tip">
  <div class="pro-tip-title">Cuándo sí merece la pena la interautonómica</div>
  <p>Compensa sobre todo si alternas salidas en Aragón, Asturias, Castilla-La Mancha, Castilla y León, Andalucía, Comunitat Valenciana, Extremadura, Galicia, Madrid o Murcia. Si repites solo una comunidad, normalmente la licencia autonómica basta. Antes de pagar, revisa siempre el portal oficial porque los convenios y condiciones pueden actualizarse.</p>
</div>

<div class="license-link-row" style="margin: 20px 0 8px;">
  <a class="license-link-pill" href="https://www.juntaex.es/w/5685" target="_blank" rel="noopener">Revisar licencia interautonómica de pesca</a>
</div>

<h2>Enlaces oficiales para tramitar la licencia por comunidades y provincias</h2>
<p>No he organizado esta parte por “destinos de fin de semana”, sino por <strong>cómo se tramita de verdad</strong>. Bajo cada comunidad te dejo las provincias que cubre y el enlace oficial que yo abriría primero si hoy tuviera que sacarme la licencia para ir a pescar a spinning.</p>

<div class="content-divider"><span>Norte y noroeste</span></div>
<div class="license-guide-grid">
  <article class="license-community-card">
    <h3>Galicia</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> A Coruña, Lugo, Ourense y Pontevedra.</p>
    <p>Si vas a ríos, cotos o embalses, entra por la licencia continental. Si vas a costa a por lubina, jurel, caballa o spinning ligero de puerto, usa la licencia marítima recreativa. En puertos concretos puede tocar además una autorización específica.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://sede.xunta.gal/es/detalle-procedemento?codtram=MT806A&ano=2021&numpub=1" target="_blank" rel="noopener">Licencia continental en Galicia</a>
      <a class="license-link-pill" href="https://sede.xunta.gal/detalle-procedemento?codtram=PE405A&langId=es_ES" target="_blank" rel="noopener">Licencia marítima en Galicia</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Asturias</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> Asturias.</p>
    <p>Si haces spinning en ríos y embalses asturianos, esta es la vía oficial para tramitar la licencia. Muy útil si tu pesca es más de trucha, reo o depredador interior que de costa.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://miprincipado.asturias.es/-/dboid-6269000005302796707573" target="_blank" rel="noopener">Sacar licencia de pesca en Asturias</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Cantabria</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> Cantabria.</p>
    <p>Buena comunidad si alternas río y costa. La licencia fluvial cubre interior; la marítima de primera clase es la referencia para pesca recreativa en el mar. Si además entras en tramos regulados, revisa permisos concretos.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://sede.cantabria.es/sede/catalogo-de-tramites/tramite/licencias-de-caza-y-pesca-fluvial/5011" target="_blank" rel="noopener">Licencia fluvial en Cantabria</a>
      <a class="license-link-pill" href="https://sede.cantabria.es/sede/catalogo-de-tramites/tramite/concesion-de-licencias-de-pesca-maritima-de-recreo-de-primera-clase/6095" target="_blank" rel="noopener">Licencia marítima en Cantabria</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>País Vasco</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Álava, Bizkaia y Gipuzkoa.</p>
    <p>Para costa y mar, el acceso oficial del Gobierno Vasco es muy claro. En pesca continental conviene comprobar además la gestión del territorio o coto concreto antes de desplazarte, sobre todo si te mueves por trucha o escenarios regulados.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.euskadi.eus/autorizacion/licencias-de-pesca-maritima-recreativa/web01-tramite/es/" target="_blank" rel="noopener">Licencia marítima en el País Vasco</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Navarra</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> Navarra.</p>
    <p>Si tu plan es spinning en embalses, ríos o tramos navarros, este es el acceso oficial más directo para tramitar la licencia. Después revisa permisos específicos si vas a un escenario regulado.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.navarra.es/es/tramites/on/-/line/tramitacion-de-la-licencia-de-pesca" target="_blank" rel="noopener">Tramitar licencia en Navarra</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>La Rioja</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> La Rioja.</p>
    <p>Muy práctica si pescas el Ebro riojano o escenarios de interior de la comunidad. Aquí tienes el trámite oficial de oficina electrónica, no un resumen ni una gestoría.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://web.larioja.org/oficina-electronica/tramite?n=15049" target="_blank" rel="noopener">Licencia de pesca en La Rioja</a>
    </div>
  </article>
</div>

<div class="content-divider"><span>Centro e interior</span></div>
<div class="license-guide-grid">
  <article class="license-community-card">
    <h3>Aragón</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Huesca, Teruel y Zaragoza.</p>
    <p>Si pescas el Ebro aragonés, embalses de depredador o alta montaña, este es el trámite oficial para empezar. Si además entras en cotos o reservas, revisa el permiso diario que corresponda.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.aragon.es/tramitador/-/tramite/solicitud-licencia-pesca-1" target="_blank" rel="noopener">Licencia de pesca en Aragón</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Castilla y León</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Ávila, Burgos, León, Palencia, Salamanca, Segovia, Soria, Valladolid y Zamora.</p>
    <p>Una de las comunidades clave para embalses, lucio y escenarios continentales grandes. El portal de tramitación agrupa la licencia de caza y pesca y es el camino oficial si vas a pescar dentro de la comunidad.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181103604/Tramite/1230983945808/Tramite" target="_blank" rel="noopener">Licencia de pesca en Castilla y León</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Castilla-La Mancha</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Albacete, Ciudad Real, Cuenca, Guadalajara y Toledo.</p>
    <p>Si te mueves por embalses manchegos o escenarios interiores con bass, lucio o lucioperca, la plataforma DIANA es la vía más práctica para iniciar la gestión. Después revisa si el tramo o coto añade condiciones.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://diana.castillalamancha.es/" target="_blank" rel="noopener">Entrar en DIANA y sacar licencia en Castilla-La Mancha</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Comunidad de Madrid</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> Madrid.</p>
    <p>Madrid es una buena referencia también para quien está valorando la interautonómica. Si pescas embalses y ríos madrileños o quieres revisar las modalidades disponibles, esta es la ficha oficial.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://sede.comunidad.madrid/autorizaciones-licencias-permisos-carnes/licencia-pesca" target="_blank" rel="noopener">Licencia de pesca en Madrid</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Extremadura</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Badajoz y Cáceres.</p>
    <p>Extremadura ha mejorado mucho la tramitación al llevarla a ARADO. Si pescas embalses grandes o viajas a menudo a la región, este es hoy el acceso clave. Allí puedes tramitar y recibir la licencia en PDF.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://arado.juntaex.es" target="_blank" rel="noopener">Licencia telemática en Extremadura</a>
      <a class="license-link-pill" href="https://www.juntaex.es/w/licencia-telematica-pesca" target="_blank" rel="noopener">Cómo funciona la licencia en ARADO</a>
    </div>
  </article>
</div>

<div class="content-divider"><span>Sur y Mediterráneo</span></div>
<div class="license-guide-grid">
  <article class="license-community-card">
    <h3>Andalucía</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Almería, Cádiz, Córdoba, Granada, Huelva, Jaén, Málaga y Sevilla.</p>
    <p>Si alternas spinning en embalses andaluces y jornadas de lubina o anjova desde costa, aquí tienes separados los dos accesos que más te interesan: continental y marítimo recreativo.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.juntadeandalucia.es/index.php/servicios/sede/tramites/procedimientos/detalle/746" target="_blank" rel="noopener">Licencia continental en Andalucía</a>
      <a class="license-link-pill" href="https://www.juntadeandalucia.es/index.php/servicios/sede/tramites/procedimientos/detalle/114" target="_blank" rel="noopener">Licencia marítima en Andalucía</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Cataluña</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Barcelona, Girona, Lleida y Tarragona.</p>
    <p>La licencia de pesca recreativa de superficie es especialmente cómoda porque, según el propio portal de la Generalitat, sirve para pescar en <strong>mar y aguas interiores</strong>. Si además entras en zona controlada, necesitarás el permiso adicional.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://web.gencat.cat/es/tramits/tramits-temes/3587_Llicencia-de-pesca-recreativa-de-superficie" target="_blank" rel="noopener">Licencia de superficie en Cataluña</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Comunitat Valenciana</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Alicante, Castellón y Valencia.</p>
    <p>Si vas a embalse, fluvial o zonas interiores, usa el trámite de pesca continental. Si lo tuyo es costa, espigón, desembocadura o kayak de recreo, entra por la licencia marítima recreativa.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.gva.es/es/inicio/procedimientos?id_proc=681" target="_blank" rel="noopener">Licencia continental en la Comunitat Valenciana</a>
      <a class="license-link-pill" href="https://sede.gva.es/es/detall-tramit?id_proc=647" target="_blank" rel="noopener">Licencia marítima en la Comunitat Valenciana</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Región de Murcia</h3>
    <p class="license-community-provinces"><strong>Provincia:</strong> Murcia.</p>
    <p>Murcia separa bien la parte fluvial de la marítima. Si pescas en agua continental, entra por el portal de licencias de pesca. Si vas al mar, usa la ficha oficial de pesca marítima recreativa. En fluvial revisa también requisitos complementarios antes de ir.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://cazaypesca.carm.es/solicitud-de-licencias-de-pesca" target="_blank" rel="noopener">Licencia fluvial en Murcia</a>
      <a class="license-link-pill" href="https://sede.carm.es/web/procedimiento/1865" target="_blank" rel="noopener">Licencia marítima en Murcia</a>
    </div>
  </article>
</div>

<div class="content-divider"><span>Islas</span></div>
<div class="license-guide-grid">
  <article class="license-community-card">
    <h3>Illes Balears</h3>
    <p class="license-community-provinces"><strong>Islas principales:</strong> Mallorca, Menorca, Ibiza y Formentera.</p>
    <p>Si pescas en Baleares, empieza por el portal oficial de pesca marítima recreativa del Govern. Allí tienes la información útil sobre licencias, reservas marinas, cuaderno y normativa específica de las islas.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://www.caib.es/sites/recursosmarins/es/pesca_maritima_recreativa-53062/" target="_blank" rel="noopener">Licencias de pesca recreativa en Baleares</a>
    </div>
  </article>
  <article class="license-community-card">
    <h3>Canarias</h3>
    <p class="license-community-provinces"><strong>Provincias:</strong> Las Palmas y Santa Cruz de Tenerife.</p>
    <p>El Gobierno de Canarias tiene una tramitación electrónica específica y bastante clara para la pesca marítima de recreo. Si haces spinning desde costa o embarcación en el archipiélago, este es el enlace oficial que conviene guardar.</p>
    <div class="license-link-row">
      <a class="license-link-pill" href="https://sede.gobiernodecanarias.org/sede/procedimientos_servicios_destacados/sugerencias_reclamaciones/tramites/1186" target="_blank" rel="noopener">Licencia de pesca recreativa en Canarias</a>
    </div>
  </article>
</div>

<h2>Qué revisar antes de pagar la licencia</h2>
<ul>
  <li><strong>Escenario real:</strong> no es lo mismo embalse, río, puerto, playa o costa rocosa.</li>
  <li><strong>Modalidad:</strong> superficie, embarcación, submarina, coto, zona controlada o permiso diario.</li>
  <li><strong>Vigencia:</strong> algunas comunidades permiten 1 día, 15 días, 1 año o varios años.</li>
  <li><strong>Bonificaciones:</strong> menores, mayores de 65 años o personas con discapacidad pueden tener exenciones en varias comunidades.</li>
  <li><strong>Documentación adicional:</strong> DNI, justificante de pago, permisos de coto y, en algunos casos, seguros o autorizaciones complementarias.</li>
</ul>

<div class="warning-box">
  <div class="warning-box-title">El error más común del pescador de spinning</div>
  <p>Pensar que “llevo licencia” equivale a “puedo pescar aquí”. No siempre. La licencia te habilita, pero no sustituye los permisos específicos, las vedas, las tallas, los cupos o la normativa concreta del escenario. Si cambias de comunidad o de modalidad, vuelve a comprobarlo.</p>
</div>

<h2>Errores que hacen perder una jornada entera</h2>
<p>Hay tres fallos clásicos. El primero es pagar la licencia equivocada: fluvial cuando ibas al mar, o una modalidad de embarcación cuando ibas realmente a pescar desde tierra. El segundo es no mirar si el escenario es coto o zona regulada. El tercero, más tonto pero muy habitual, es llevar la licencia “en algún correo” y no tenerla localizable cuando te la piden.</p>
<p>Mi recomendación es sencilla y muy de pescador práctico: <strong>guarda un PDF en el móvil, una copia en la nube y otra descargada sin conexión</strong>. Si además llevas una captura del justificante o el CSV de verificación, mejor. No da peces, pero sí evita que una mañana buena se convierta en un viaje inútil.</p>

<h2>Mi consejo para quien empieza a spinning en España</h2>
<p>Si estás arrancando, no intentes resolver todo a la vez. Primero elige <strong>tu escenario principal</strong>: embalse, río o costa. Después saca la licencia correcta. Y solo entonces empieza a afinar el equipo. Hacerlo al revés —comprar caña, carrete, señuelos y descubrir después que te falta documentación— es la secuencia más cara y menos elegante de todas.</p>
<p>Si quieres hilar fino la parte técnica después de resolver papeleo, te recomiendo esta ruta: <a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">empezar por la guía de spinning para principiantes</a>, seguir por <a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">cómo elegir el señuelo según el agua y el clima</a> y rematar con la <a href="/guia/checklist-salida-spinning/" style="color:var(--c-primary)">checklist antes de salir</a>. Es una forma muy limpia de convertir una licencia en una jornada bien planteada.</p>
"""
    }
]

# ─── Páginas estáticas ────────────────────────────────────────────────────────

STATIC_PAGES = [
    {
        "slug": "sobre-nosotros",
        "title": "Sobre Nosotros | AJSpinning",
        "h1": "Sobre AJSpinning",
        "description": "AJSpinning reúne guías y ayudas de compra para pesca spinning en España, con foco en escenarios reales, especies y material con sentido.",
        "content": """
<p><strong>AJSpinning</strong> nació con una idea sencilla: que cualquier pescador, tanto si empieza como si ya lleva años, encuentre información práctica para entender mejor el spinning, elegir material con sentido y evitar compras impulsivas.</p>
<h2>Quién hay detrás</h2>
<p>Detrás de AJSpinning hay un pequeño equipo centrado en pesca recreativa, comparación de material y redacción técnica pensada para usuarios reales. Nuestro papel es ordenar información, separar lo útil del ruido y explicar en qué contexto tiene sentido cada compra.</p>
<h2>Nuestro enfoque</h2>
<p>Publicamos guías evergreen, comparativas útiles y contenidos orientados a resolver dudas reales: qué equipo comprar para empezar, cómo elegir un carrete, qué señuelo tiene sentido según el agua o cómo planificar una salida de temporada. Preferimos menos fichas y más contexto antes que llenar la web de páginas vacías.</p>
<h2>¿Por qué AliExpress?</h2>
<p>AliExpress concentra una gran oferta de material con una relación calidad-precio muy competitiva, especialmente en señuelos, accesorios y equipos de entrada. Muchas referencias son interesantes si sabes leer especificaciones, pesos, opiniones y uso real. Nuestro trabajo consiste en dar ese contexto para que la decisión no dependa solo de una foto bonita o de un descuento llamativo.</p>
<h2>Transparencia</h2>
<p>AJSpinning participa en el Programa de Afiliados de AliExpress. Si compras a través de algunos enlaces, podemos recibir una comisión sin coste extra para ti. Eso no debería cambiar la recomendación: primero va la utilidad y solo después el enlace, cuando de verdad encaja con el contexto explicado.</p>
<h2>Por qué creemos que AJSpinning es de confianza</h2>
<p>Intentamos que cada categoría y cada guía respondan a una necesidad concreta: aprender, comparar, evitar errores o entender mejor una técnica. Mostramos páginas de metodología, política editorial, privacidad, cookies y contacto porque la confianza no depende solo del diseño, sino también de que el usuario sepa quién publica, cómo se financia el proyecto y cómo puede pedir una corrección si encuentra algo confuso o desactualizado.</p>
<h2>Qué queremos aportar</h2>
<p>Queremos que quien llegue desde Google, redes sociales o una recomendación encuentre algo más que un producto: una explicación, una ruta de aprendizaje y una base para tomar mejores decisiones. Si quieres ver cómo trabajamos, te recomendamos visitar nuestra <a href="/metodologia/" style="color:var(--c-primary)">metodología</a> y nuestra <a href="/politica-editorial/" style="color:var(--c-primary)">política editorial</a>.</p>
"""
    },
    {
        "slug": "compromiso-calidad",
        "title": "Compromiso de Calidad Editorial | AJSpinning",
        "h1": "Compromiso de calidad editorial",
        "description": "Cómo verificamos contenido, actualizamos guías y mantenemos AJSpinning útil, transparente y fiable para pescadores en España.",
        "content": """
<p>AJSpinning se construye como un proyecto editorial de utilidad real para pescadores de spinning en España. Esta página explica, en términos claros, cómo cuidamos la calidad del contenido para que una guía no sea solo “texto bonito”, sino una ayuda práctica para decidir mejor en el agua y fuera de ella.</p>
<h2>Qué entendemos por calidad</h2>
<p>Para nosotros, una guía de calidad cumple tres condiciones: responde una pregunta concreta, ofrece pasos accionables y mantiene coherencia con escenarios reales de pesca (costa, río y embalse). Evitamos publicar contenido genérico que no sirva para tomar decisiones.</p>
<h2>Cómo verificamos una guía antes de publicarla</h2>
<ul>
  <li>Definimos la intención: qué duda exacta quiere resolver el lector.</li>
  <li>Revisamos precisión técnica en términos, tamaños, técnica y contexto.</li>
  <li>Comprobamos legibilidad: lenguaje claro, estructura por bloques y ejemplos concretos.</li>
  <li>Eliminamos relleno: si un párrafo no ayuda a decidir, se reescribe o se quita.</li>
</ul>
<h2>Cómo mantenemos el contenido vivo</h2>
<p>Publicar no es “cerrar” una página. Revisamos periódicamente guías y páginas clave para ajustar redacción, enlaces y señales de actualidad. Cuando una recomendación pierde vigencia o detectamos una incoherencia, corregimos y volvemos a publicar con fecha de actualización visible.</p>
<h2>Cómo tratamos recomendaciones de productos</h2>
<p>Las recomendaciones de material se subordinan al contexto editorial. Primero explicamos técnica y uso; después, si procede, añadimos opciones de compra con transparencia de afiliación. No prometemos capturas por comprar un producto ni desplazamos el contenido por interés comercial.</p>
<h2>Qué hacemos con el feedback de usuarios</h2>
<p>El correo de contacto está activo para reportar errores, mejoras de redacción, enlaces rotos o matices técnicos. Priorizamos los avisos que mejoran seguridad, claridad o coherencia práctica para que el beneficio sea colectivo y no puntual.</p>
<h2>Compromiso final</h2>
<p>Queremos que AJSpinning sea útil incluso cuando no hay compra. Si una página no cumple ese estándar, la revisamos. Puedes consultar también nuestra <a href="/politica-editorial/" style="color:var(--c-primary)">política editorial</a>, la <a href="/metodologia/" style="color:var(--c-primary)">metodología</a> y la <a href="/politica-afiliacion/" style="color:var(--c-primary)">política de afiliación</a> para entender el proyecto completo.</p>
"""
    },
    {
        "slug": "mapa-web",
        "title": "Mapa Web | AJSpinning",
        "h1": "Mapa web AJSpinning",
        "description": "Acceso rápido a todas las guías, páginas editoriales y recursos de AJSpinning para mejorar navegación e indexación.",
        "content": """
<p>Este mapa web reúne las páginas principales de AJSpinning para facilitar navegación, revisión de contenido y acceso rápido a recursos clave. Si llegas por primera vez, te recomendamos empezar por la ruta editorial y después profundizar en guías por especie o escenario.</p>
<h2>Ruta editorial recomendada</h2>
<ul>
  <li><a href="/pesca-spinning/" style="color:var(--c-primary)">Pesca spinning en España</a></li>
  <li><a href="/empieza-aqui/" style="color:var(--c-primary)">Empieza aquí</a></li>
  <li><a href="/guia-interactiva/" style="color:var(--c-primary)">Guía interactiva</a></li>
  <li><a href="/guia/" style="color:var(--c-primary)">Biblioteca de guías</a></li>
</ul>
<h2>Guías principales de spinning</h2>
<ul>
  <li><a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">Spinning para principiantes</a></li>
  <li><a href="/guia/especies-spinning-espana/" style="color:var(--c-primary)">Especies de spinning en España</a></li>
  <li><a href="/guia/peces-spinning-agua-dulce-espana/" style="color:var(--c-primary)">Peces de agua dulce</a></li>
  <li><a href="/guia/peces-spinning-mar-espana/" style="color:var(--c-primary)">Peces de mar</a></li>
  <li><a href="/guia/spinning-costa-espuma-mareas/" style="color:var(--c-primary)">Spinning en costa</a></li>
  <li><a href="/guia/leer-embalse-lucio-perca/" style="color:var(--c-primary)">Leer embalse para lucio y perca</a></li>
  <li><a href="/guia/licencias-pesca-espana/" style="color:var(--c-primary)">Licencias de pesca en España</a></li>
  <li><a href="/guia/calendario-spinning-espana/" style="color:var(--c-primary)">Calendario de spinning</a></li>
</ul>
<h2>Páginas de confianza y transparencia</h2>
<ul>
  <li><a href="/equipo-editorial/" style="color:var(--c-primary)">Equipo editorial</a></li>
  <li><a href="/compromiso-calidad/" style="color:var(--c-primary)">Compromiso de calidad</a></li>
  <li><a href="/metodologia/" style="color:var(--c-primary)">Metodología</a></li>
  <li><a href="/politica-editorial/" style="color:var(--c-primary)">Política editorial</a></li>
  <li><a href="/politica-afiliacion/" style="color:var(--c-primary)">Política de afiliación</a></li>
  <li><a href="/sobre-nosotros/" style="color:var(--c-primary)">Sobre nosotros</a></li>
  <li><a href="/contacto/" style="color:var(--c-primary)">Contacto</a></li>
  <li><a href="/aviso-legal/" style="color:var(--c-primary)">Aviso legal</a></li>
  <li><a href="/condiciones-uso/" style="color:var(--c-primary)">Condiciones de uso</a></li>
  <li><a href="/politica-privacidad/" style="color:var(--c-primary)">Privacidad</a></li>
  <li><a href="/politica-cookies/" style="color:var(--c-primary)">Cookies</a></li>
</ul>
<h2>Material y herramientas</h2>
<p>La parte de material está pensada como apoyo final, no como puerta de entrada. Para mantener una navegación más útil, te recomendamos llegar a ella después de revisar una guía o de pasar primero por la herramienta interactiva.</p>
<ul>
  <li><a href="/tienda-de-pesca/" style="color:var(--c-primary)">Criterios de compra para spinning</a></li>
  <li><a href="/guia/cana-de-spinning-como-elegir/" style="color:var(--c-primary)">Cómo elegir una caña</a></li>
  <li><a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">Cómo elegir un carrete</a></li>
  <li><a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">Cómo elegir un señuelo</a></li>
</ul>
<h2>Cómo usar este mapa para ahorrar tiempo</h2>
<p>Si vienes desde redes sociales o búsquedas rápidas, lo más eficaz es seguir un orden corto: primero una guía base, después una guía de especie o escenario y, solo al final, material. Este flujo evita compras impulsivas y mejora mucho la calidad de cada salida.</p>
<p>Si ya tienes experiencia, puedes usar este mapa al revés: entrar por especie o escenario (lubina, lucio, trucha, costa, embalse) y saltar directo a contenidos de técnica o revisión de equipo.</p>
<h2>Transparencia y mejora continua</h2>
<p>AJSpinning mantiene este mapa web como punto de control para usuarios y para rastreadores. Cuando añadimos una guía nueva o una página de confianza, la incorporamos aquí para que la navegación siga siendo clara y verificable.</p>
<p>Si detectas enlaces rotos o necesitas una ruta más rápida para tu caso, escríbenos desde <a href="/contacto/" style="color:var(--c-primary)">contacto</a> y revisaremos la estructura.</p>
"""
    },
    {
        "slug": "equipo-editorial",
        "title": "Equipo Editorial | AJSpinning",
        "h1": "Equipo editorial AJSpinning",
        "description": "Conoce quién firma AJSpinning, cómo revisamos contenidos y qué compromiso asumimos con la comunidad pescadora.",
        "content": """
<p>El contenido de AJSpinning parte de dudas reales de pescadores en España: cómo empezar, qué señuelo usar, qué equipo compensa y qué errores conviene cortar a tiempo. Esta página resume quién está detrás y cómo se revisa lo que publicamos.</p>
<h2>Quién firma el contenido</h2>
<p><strong>Equipo editorial AJSpinning</strong> reúne perfiles que combinan práctica recreativa de spinning, análisis de material y redacción técnica orientada al usuario final. El trabajo principal es traducir información dispersa en decisiones claras, con una persona responsable visible detrás de la revisión.</p>
<h2>Qué experiencia aplicamos</h2>
<ul>
  <li>Lectura de escenarios reales en España: costa, embalse y río.</li>
  <li>Uso habitual de material de entrada y gama media para recomendaciones realistas.</li>
  <li>Comparación crítica de fichas de producto y señales de calidad en marketplaces.</li>
  <li>Edición de guías evergreen que priorizan técnica y seguridad antes de compra.</li>
</ul>
<h2>Cómo revisamos una guía</h2>
<p>Cada guía pasa por una revisión de estructura y utilidad. Validamos que responda una intención concreta (por ejemplo: empezar en spinning, elegir señuelo según agua o entender licencias), que use lenguaje claro y que no dependa de afirmaciones vacías. Si una sección no aporta decisión práctica, se reescribe o se elimina.</p>
<h2>Cómo revisamos recomendaciones de material</h2>
<p>Cuando enlazamos productos, revisamos si encajan con el escenario de pesca, si el rango de precio es razonable y qué límites tiene la ficha. Si el contexto no está claro, preferimos no enlazar. Por eso muchas decisiones de compra se apoyan antes en una guía.</p>
<h2>Compromiso de transparencia</h2>
<p>AJSpinning monetiza mediante afiliación con tiendas externas, pero esa monetización no sustituye el criterio de revisión. La afiliación se identifica y se acompaña de páginas específicas para que cualquier visitante entienda cómo funciona la web de principio a fin.</p>
<h2>Actualización y correcciones</h2>
<p>No damos contenido por cerrado. Revisamos periódicamente guías y páginas clave para ajustar redacción, precisión y enlaces. Si una recomendación se queda obsoleta o detectamos una inconsistencia, la actualizamos. Este enfoque es continuo: publicar no es el final, es el inicio de mantenimiento editorial.</p>
<h2>Cómo contactar con el equipo</h2>
<p>Si quieres proponer mejoras, reportar errores o compartir contexto de pesca que pueda enriquecer una guía, escríbenos a <a href="mailto:info@ajspinning.com" style="color:var(--c-primary)">info@ajspinning.com</a> o usa la página de <a href="/contacto/" style="color:var(--c-primary)">contacto</a>. El feedback de usuarios reales en agua nos ayuda a que AJSpinning sea más útil y más honesto.</p>
"""
    },
    {
        "slug": "empieza-aqui",
        "title": "Empieza Aquí | AJSpinning",
        "h1": "Empieza Aquí",
        "description": "Ruta recomendada para empezar en AJSpinning: aprende la base, elige equipo, entiende los señuelos y planifica mejor tus salidas.",
        "content": """
<p>Esta página reúne los contenidos que más ayudan a pasar de la curiosidad a las primeras salidas con criterio, sin gastar de más y sin perderte entre demasiadas opciones.</p>
<h2>1. Entiende la base del spinning</h2>
<p>Empieza por nuestra <a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">guía de spinning para principiantes</a>. Te servirá para entender el equipo básico, la lógica del lanzado, la recuperación y los escenarios más habituales en España.</p>
<h2>2. Aprende a comprar con criterio</h2>
<p>Antes de mirar productos concretos, revisa <a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">cómo elegir un carrete</a> y <a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">cómo elegir un señuelo según el agua y el clima</a>. Son dos contenidos clave para no comprar por impulso.</p>
<h2>3. Escoge especie o escenario</h2>
<p>Cuando ya tengas la base, entra en contenidos más específicos como <a href="/guia/mejores-senueulos-lucio/" style="color:var(--c-primary)">señuelos para lucio</a>, <a href="/guia/mejores-senueulos-lubina/" style="color:var(--c-primary)">señuelos para lubina</a> o el <a href="/guia/calendario-spinning-espana/" style="color:var(--c-primary)">calendario de spinning en España</a>.</p>
<h2>4. Completa el equipo mínimo</h2>
  <p>Después sí: explora nuestras categorías de <a href="/categoria/canas/" style="color:var(--c-primary)">cañas</a>, <a href="/categoria/carretes/" style="color:var(--c-primary)">carretes</a>, <a href="/categoria/senuelos/" style="color:var(--c-primary)">señuelos</a> y <a href="/categoria/accesorios/" style="color:var(--c-primary)">accesorios</a>. La idea es que cada selección te encuentre ya con una necesidad clara, no con ganas de comprar por comprar.</p>
  <h2>5. Usa la guía interactiva para decidir más rápido</h2>
<p>Si ya sabes qué especie quieres buscar, pero no tienes claro por dónde empezar, abre la <a href="/guia-interactiva/" style="color:var(--c-primary)">guía interactiva de spinning</a>. Te ayuda a cruzar especie, escenario, estado del agua y momento del día para obtener una primera recomendación útil antes de comprar o salir a pescar.</p>
  <h2>Si vienes de redes sociales</h2>
  <p>Muchos pescadores llegan desde vídeos cortos con un consejo aislado. Aquí tienes la versión completa: por qué funciona una técnica, cuándo deja de hacerlo y cómo adaptar material y señuelo a tu caso.</p>
  """
      },
    {
        "slug": "pesca-spinning",
        "title": "Pesca Spinning en España: guía completa para empezar y mejorar | AJSpinning",
        "h1": "Pesca Spinning en España",
        "description": "Guía completa de pesca spinning en España: especies, escenarios, señuelos, caña de spinning, carrete spinning y licencias para pescar con criterio.",
        "content": """
<p>La <strong>pesca spinning</strong> en España no es una técnica única ni una lista de señuelos milagro. Cambia mucho entre costa, río y embalse, y por eso conviene aprender a leer agua, elegir bien el equipo y adaptar el señuelo a cada situación real. Esta página resume ese mapa y te lleva a las guías que más te ayudan en cada paso.</p>
<h2>Qué es el spinning y por qué funciona tan bien en España</h2>
<p>El spinning consiste en pescar con señuelos artificiales en movimiento, variando velocidad, profundidad y pausa para provocar ataques. Funciona especialmente bien porque en España tenemos una combinación muy amplia de aguas: embalses, ríos de montaña, tramos medios, desembocaduras, playas abiertas y costa rocosa. Eso permite practicar spinning durante todo el año cambiando especie, ventana horaria y lectura del escenario.</p>
<p>La gran ventaja del spinning es que es una modalidad <strong>activa, técnica y progresiva</strong>: aprendes observando lo que hace el pez y ajustando en tiempo real. La desventaja es que, al principio, es fácil comprar material sin saber para qué lo necesitas. Por eso conviene empezar por método y no por impulso.</p>
<h2>Primeros pasos: especie, agua y momento antes que tienda</h2>
<p>La decisión más rentable no suele ser “qué compro”, sino “qué voy a pescar y en qué condiciones”. Una ruta simple que funciona:</p>
<ul>
  <li>Elige especie objetivo: lubina, lucio, trucha, black bass, siluro o pelágicos costeros.</li>
  <li>Define escenario: río, embalse, costa o desembocadura.</li>
  <li>Mira estación y luz: amanecer, plena luz, nublado o últimas horas.</li>
  <li>Decide capa de agua y familia de señuelos para empezar.</li>
</ul>
<p>Si quieres hacer este proceso de forma guiada, usa nuestra <a href="/guia-interactiva/" style="color:var(--c-primary)">guía interactiva de pesca spinning</a>. En menos de un minuto tendrás una primera recomendación práctica y la siguiente lectura adecuada.</p>
<h2>Equipo base: caña de spinning, carrete spinning y línea</h2>
<p>El equipo no se elige “por marca”, se elige por equilibrio. Para la mayoría de pescadores que empiezan, una base versátil suele ser caña media, carrete tamaño 2500-3000 y línea trenzada con bajo de fluorocarbono. A partir de ahí, cambias según escenario y especie.</p>
<p>Para afinar de verdad esta parte, te recomendamos dos guías esenciales:</p>
<ul>
  <li><a href="/guia/cana-de-spinning-como-elegir/" style="color:var(--c-primary)">Caña de spinning: cómo elegir longitud, acción y potencia</a>.</li>
  <li><a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">Carrete spinning: talla, ratio y freno</a>.</li>
</ul>
<p>Si completas ese bloque con <a href="/guia/nudos-y-bajos-spinning/" style="color:var(--c-primary)">nudos y bajos</a>, evitarás muchos problemas típicos de lance, roturas y pérdida de sensibilidad.</p>
<h2>Señuelos: cómo elegir sin llenar la caja de ruido</h2>
<p>No necesitas cincuenta señuelos para empezar. Necesitas pocos y coherentes con el escenario. En aguas claras suelen funcionar mejor perfiles naturales y trabajo más fino; en agua tomada o turbia, perfiles con más vibración o contraste. En costa, viento y espuma cambian mucho la lectura; en embalse, la profundidad y las estructuras mandan; en río truchero, tamaño y control del ángulo importan muchísimo.</p>
<p>Si quieres resolver esto rápido, aquí tienes una ruta directa:</p>
<ul>
  <li><a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">Cómo elegir señuelo según agua y clima</a>.</li>
  <li><a href="/guia/mejores-senueulos-lubina/" style="color:var(--c-primary)">Señuelos para lubina</a>.</li>
  <li><a href="/guia/senuelos-para-trucha-spinning/" style="color:var(--c-primary)">Señuelos para trucha en spinning</a>.</li>
  <li><a href="/guia/mejores-senueulos-lucio/" style="color:var(--c-primary)">Señuelos para lucio</a>.</li>
</ul>
<h2>Licencia de pesca y normativa: paso obligatorio</h2>
<p>En España no basta con “tener equipo”. Antes de salir, revisa licencia y normativa del escenario. Según comunidad autónoma y modalidad, cambian permisos, vigencias y requisitos. Para resolverlo sin perder tiempo, tienes la guía de <a href="/guia/licencias-pesca-espana/" style="color:var(--c-primary)">licencia de pesca en España para spinning</a> con enlaces oficiales por territorios.</p>
<h2>La mejor forma de progresar en spinning</h2>
<p>La progresión real viene de tres hábitos: registrar lo que haces (agua, luz, señuelo, ritmo), repetir en condiciones parecidas y corregir un detalle cada salida. En pocas semanas notarás más avance que cambiando de señuelo cada diez minutos o copiando recetas sin contexto.</p>
<p>Si quieres una visión global de especies y escenarios, empieza por <a href="/guia/especies-spinning-espana/" style="color:var(--c-primary)">qué peces puedes pescar a spinning en España</a> y por nuestra sección de <a href="/guia/" style="color:var(--c-primary)">guías completas</a>. Y cuando ya tengas claro qué te falta, entra en <a href="/tienda-de-pesca/" style="color:var(--c-primary)">cómo comprar con criterio</a> para comparar material con filtros útiles y notas de uso.</p>
"""
    },
    {
        "slug": "tienda-de-pesca",
        "title": "Tienda de Pesca Spinning: cómo comprar con criterio en 2026 | AJSpinning",
        "h1": "Tienda de pesca para spinning: compra con contexto",
        "description": "Guía de tienda de pesca spinning para comprar mejor: qué mirar primero, qué errores evitar y cómo elegir equipo según uso real.",
        "content": """
<p>Si has buscado una <strong>tienda de pesca</strong> para spinning, la clave no es ver más productos, sino acertar mejor con lo que compras. Antes de mirar cañas, carretes o señuelos, conviene tener claro dónde vas a pescar, qué especie buscas y qué problema quieres resolver en tu equipo.</p>
<h2>Cómo usar una tienda de pesca sin comprar por impulso</h2>
<p>El error más frecuente es abrir catálogo sin definir especie, escenario ni nivel. Cuando haces eso, cualquier caña, carrete o señuelo parece válido. Para evitarlo, usa esta secuencia:</p>
<ul>
  <li>Define escenario principal (río, embalse, costa).</li>
  <li>Marca especie objetivo (lubina, lucio, trucha, bass, siluro, etc.).</li>
  <li>Revisa una guía técnica corta antes de filtrar productos.</li>
  <li>Compara precio y señales comerciales solo al final.</li>
</ul>
<p>Con ese método, la compra suele ser más corta, más barata y mucho más coherente.</p>
<h2>Acceso directo al catálogo de AJSpinning</h2>
<p>En nuestra página de <a href="/guia/" style="color:var(--c-primary)">guías de pesca spinning</a> puedes buscar por nombre, filtrar por categoría y ajustar rango de precio y descuento. Además, cada ficha intenta explicar límites, uso recomendado y contexto antes de salir a una tienda externa.</p>
<h2>Categorías de tienda más útiles para empezar</h2>
<ul>
  <li><a href="/categoria/canas/" style="color:var(--c-primary)">Cañas de spinning</a> para elegir longitud y potencia según escenario.</li>
  <li><a href="/categoria/carretes/" style="color:var(--c-primary)">Carretes spinning</a> para ajustar talla, ratio y freno.</li>
  <li><a href="/categoria/senuelos/" style="color:var(--c-primary)">Señuelos</a> para cubrir profundidad, vibración y color.</li>
  <li><a href="/categoria/hilos/" style="color:var(--c-primary)">Líneas y fluorocarbono</a> para montar mejor bajos y terminales.</li>
  <li><a href="/categoria/accesorios/" style="color:var(--c-primary)">Accesorios</a> para ordenar caja y resolver una jornada real.</li>
</ul>
<h2>Antes de comprar, abre estas guías</h2>
<p>Si quieres ahorrar errores, combina la parte de compra con lecturas de base. Estas guías suelen ayudar más que cualquier “top ventas” genérico:</p>
<ul>
  <li><a href="/guia/spinning-para-principiantes/" style="color:var(--c-primary)">Spinning para principiantes</a>.</li>
  <li><a href="/guia/cana-de-spinning-como-elegir/" style="color:var(--c-primary)">Cómo elegir caña de spinning</a>.</li>
  <li><a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">Cómo elegir carrete spinning</a>.</li>
  <li><a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">Cómo elegir señuelo según agua y clima</a>.</li>
</ul>
<p>Cuando entiendes esto, el catálogo deja de ser una lista infinita y se convierte en una herramienta de decisión.</p>
"""
    },
    {
        "slug": INTERACTIVE_GUIDE_SLUG,
        "title": "Guía Interactiva de Pesca Spinning en España | AJSpinning",
        "h1": "Planificador de spinning",
        "description": "Planifica una salida de spinning en España según especie, escenario, estación, claridad y luz. Recomendaciones editoriales útiles antes de comprar.",
        "extra_head": f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"WebApplication","name":"Guía Interactiva de Spinning AJSpinning","url":"{BASE_URL}{INTERACTIVE_GUIDE_URL}","applicationCategory":"SportsApplication","operatingSystem":"Any","description":"Herramienta editorial para orientar la elección de señuelos, técnica y contenidos según la situación de pesca."}}
</script>""",
        "content": """
<p>La idea de esta guía interactiva es ayudarte a tomar una buena decisión inicial cuando todavía no sabes qué mover, qué color priorizar o qué guía abrir primero. No sustituye la experiencia en el agua, pero sí te evita empezar a ciegas y te da una ruta editorial clara para pasar del impulso a una estrategia.</p>
<p>Esta herramienta cruza <strong>especie, escenario, estación, estado del agua y momento del día</strong> para devolverte una recomendación breve y útil: por dónde empezar, qué familia de señuelos priorizar y qué lectura abrir después para afinar la salida.</p>
{{planner_widget}}
<h2>Qué resuelve esta herramienta</h2>
<p>Muchos usuarios llegan desde TikTok o desde búsquedas rápidas con una duda concreta: “voy a embalse con agua con algo de color, ¿qué señuelo muevo primero?”, “si quiero lubina al amanecer, ¿empiezo arriba o abajo?”, “¿qué color tiene más sentido hoy?”. La guía interactiva resume esa primera decisión y te manda después a la guía más adecuada para profundizar.</p>
<h2>Cómo interpretar la recomendación</h2>
<p>Piensa en el resultado como un <strong>plan de primera pasada</strong>. Si la herramienta te sugiere minnows o vinilos, no significa que sean la única opción, sino la familia de señuelos más coherente para arrancar dadas las condiciones. A partir de ahí, conviene ajustar tamaño, peso, color y ritmo según actividad real, viento, presión de pesca y estructura del agua.</p>
<h2>Qué hace diferente a esta guía</h2>
<p>No se limita a decirte un señuelo. También te orienta sobre la capa de agua que conviene priorizar, el tipo de recuperación más razonable, el grado de actividad esperado y la lectura editorial que más te conviene abrir después. La idea es acortar el camino entre la duda y una decisión práctica.</p>
<h2>Para quién está pensada</h2>
<p>Sirve tanto para quien empieza como para quien ya pesca y quiere ahorrar tiempo antes de una salida. Si estás montando tu primera caja, úsala para entender qué categorías mirar primero. Si ya tienes equipo, úsala para decidir qué línea de ataque tiene más sentido ese día y qué contenido revisar antes de llegar al agua.</p>
<h2>Qué hacer después de usarla</h2>
<p>Cuando tengas una primera dirección clara, el siguiente paso suele ser abrir una guía concreta para afinar tamaño, profundidad, ritmo de recogida o escenario. La herramienta está pensada precisamente para eso: ahorrar tiempo al principio y llevarte rápido al contenido que de verdad te ayuda.</p>
"""
    },
    {
        "slug": MINIGAME_SLUG,
        "title": "Minijuegos de Pesca Spinning | AJSpinning",
        "h1": "Minijuegos de Pesca y Reacción",
        "description": "Tres minijuegos rápidos para pescadores de spinning: reflejos, aventura pixel de orilla y precisión de lance. Entrena paciencia, lectura y timing.",
        "robots": "noindex,nofollow,max-image-preview:large",
        "extra_head": f"""<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">
      {{"@context":"https://schema.org","@type":"Game","name":"Paciencia de Orilla","url":"{BASE_URL}{MINIGAME_URL}","description":"Minijuego de reflejos inspirado en la espera en la orilla durante una jornada de spinning.","genre":"Casual game","playMode":"SinglePlayer"}}
</script>""",
        "content": """
<p>Una jornada completa de spinning no solo va de lanzar: también va de esperar, leer señales y tomar decisiones rápidas con calma. Aquí tienes tres minijuegos cortos pensados para ese mismo enfoque: reflejos, aventura pixel de orilla y precisión de lance.</p>
{{wait_game_widget}}
<h2>Cómo funciona</h2>
<p>Puedes jugar en sesiones muy breves. El primero trabaja la reacción durante la espera; el segundo te deja caminar por la orilla y gestionar lance + picada en estilo pixel; y el tercero te pide afinar el timing del lance. Son minijuegos simples, rápidos y con puntuación para que notes progreso.</p>
<h2>Qué entrenas mientras juegas</h2>
<p>No sustituyen una jornada de pesca real, pero sí refuerzan hábitos útiles: esperar sin precipitarte, identificar zonas con más probabilidad y afinar el momento de ejecución. Esa combinación de lectura y control marca muchas jornadas reales.</p>
<h2>Qué hacer después</h2>
<p>Cuando termines de jugar, vuelve a la <a href="/guia-interactiva/" style="color:var(--c-primary)">guía interactiva</a> para planificar tu siguiente salida o entra en nuestra sección de <a href="/guia/" style="color:var(--c-primary)">guías editoriales</a> si quieres profundizar en técnica, escenarios y material.</p>
"""
    },
    {
        "slug": "metodologia",
        "title": "Metodología | AJSpinning",
        "h1": "Metodología de Selección",
        "description": "Conoce cómo seleccionamos productos y cómo decidimos si una recomendación realmente ayuda al pescador que va a usarlos.",
        "content": """
<p>En AJSpinning no enlazamos productos al azar. Antes miramos para qué escenario tienen sentido, qué dudas resuelven y qué errores pueden evitar a quien va a usarlos de verdad.</p>
<h2>1. Partimos de una intención real</h2>
<p>No empezamos por el producto, sino por la necesidad: empezar en spinning, cubrir una técnica, resolver un hueco de la caja, mejorar el equipo o planificar una salida estacional. Esa intención guía después la selección de contenidos y enlaces.</p>
<h2>2. Revisamos señales objetivas</h2>
<p>Cuando enlazamos a productos analizamos, entre otros factores, precio, descuento, ventas, claridad de la ficha, variantes disponibles y coherencia entre lo prometido y el uso habitual. Estos datos no sustituyen el criterio, pero ayudan a filtrar referencias poco claras.</p>
<h2>3. Añadimos contexto real</h2>
<p>Un producto por sí solo aporta poco valor. Por eso intentamos acompañarlo de criterios de uso: para qué escenario encaja, qué medidas revisar, qué errores evitar y qué guía conviene leer antes si todavía no tienes clara la compra.</p>
<h2>4. Priorizamos contenido evergreen</h2>
<p>La base de la web son las guías evergreen y las páginas hub: contenidos que ayudan hoy y seguirán siendo útiles dentro de meses. Las categorías y las páginas de producto solo tienen sentido cuando están conectadas con esas guías.</p>
<h2>5. Actualizamos y corregimos</h2>
<p>Cuando detectamos precios obsoletos, enlaces rotos o contenidos mejorables, los revisamos y actualizamos. Si recibimos una sugerencia útil por correo, la incorporamos cuando encaja con el proyecto. Puedes escribirnos desde la página de <a href="/contacto/" style="color:var(--c-primary)">contacto</a>.</p>
"""
    },
    {
        "slug": "politica-editorial",
        "title": "Política Editorial | AJSpinning",
        "h1": "Política Editorial",
        "description": "Principios editoriales de AJSpinning: transparencia, actualización, independencia y utilidad para el usuario.",
        "content": """
<p>Esta política editorial resume cómo trabajamos en AJSpinning y qué puede esperar el lector cuando navega por nuestras guías, categorías y selecciones de productos.</p>
<h2>Utilidad antes que monetización</h2>
<p>Nuestro criterio principal es la utilidad para el usuario. Publicamos primero contenidos que respondan preguntas reales de pesca spinning en España. Los enlaces de afiliado son un complemento, no el motivo central del sitio.</p>
<h2>Transparencia en afiliación</h2>
<p>Identificamos de forma clara que algunos enlaces son de afiliado. Cuando un usuario compra a través de ellos podemos recibir una comisión sin coste adicional. Nunca prometemos un producto perfecto ni ocultamos que existe un interés comercial.</p>
<h2>Independencia y límites</h2>
<p>No todos los productos enlazados han sido probados físicamente uno a uno. Cuando no hay prueba directa, nos apoyamos en experiencia de uso comparable, análisis de especificaciones y señales objetivas del marketplace. Evitamos afirmar pruebas o resultados que no podamos sostener honestamente.</p>
<h2>Actualización y correcciones</h2>
<p>Intentamos mantener las páginas actualizadas, pero precios, stock y variantes pueden cambiar en AliExpress sin previo aviso. Si una guía queda desactualizada o contiene un error relevante, la corregimos y actualizamos la fecha de modificación.</p>
<h2>Contacto editorial</h2>
<p>Si detectas un error, una ficha confusa o quieres proponer un tema, escríbenos a <a href="mailto:info@ajspinning.com" style="color:var(--c-primary)">info@ajspinning.com</a>. Revisamos especialmente las sugerencias que mejoran claridad, seguridad o contexto de uso.</p>
"""
    },
    {
        "slug": "politica-afiliacion",
        "title": "Política de Afiliación | AJSpinning",
        "h1": "Política de Afiliación",
        "description": "Cómo funciona la afiliación en AJSpinning, cuándo puede aparecer una comisión y qué límites seguimos para que la recomendación tenga sentido.",
        "content": """
<p>Esta página explica cómo funciona la afiliación en AJSpinning y qué límites seguimos para que el interés comercial no se coloque por delante de la utilidad real para quien lee la guía.</p>
<h2>Qué significa que AJSpinning sea afiliado</h2>
<p>AJSpinning participa en el Programa de Afiliados de AliExpress. Esto significa que, si haces clic en algunos enlaces y finalmente compras un producto en la tienda externa, podemos recibir una comisión. Esa comisión no incrementa el precio para el usuario en AJSpinning.</p>
<h2>Cuándo mostramos enlaces de afiliado</h2>
<p>No publicamos enlaces por volumen. Primero construimos guías y contexto de uso, y después enlazamos productos cuando ese enlace ayuda a resolver una decisión concreta: por ejemplo, elegir talla de carrete, rango de caña o familia de señuelo para un escenario real.</p>
<h2>Qué NO hacemos</h2>
<ul>
  <li>No vendemos posiciones en guías a cambio de pago directo.</li>
  <li>No prometemos resultados de pesca garantizados por comprar un producto.</li>
  <li>No publicamos reseñas inventadas ni simulamos pruebas que no se han realizado.</li>
  <li>No ocultamos que existen enlaces con comisión.</li>
</ul>
<h2>Criterios para enlazar un producto</h2>
<p>Cuando valoramos productos de marketplace usamos señales objetivas como la claridad de la ficha, el precio relativo, las ventas, las valoraciones y la coherencia con la técnica y el escenario. Un enlace solo se mantiene si aporta una alternativa razonable para la necesidad explicada en la guía.</p>
<h2>Limitaciones y responsabilidad</h2>
<p>AJSpinning no controla stock, envíos, atención al cliente ni garantías de AliExpress y sus vendedores. Los precios pueden cambiar sin aviso y una referencia puede dejar de estar disponible. Por eso revisamos periódicamente, pero no podemos garantizar que toda ficha externa esté siempre idéntica en el momento de la visita.</p>
<h2>Cómo separamos contenido y publicidad</h2>
<p>Las guías, la metodología y las páginas legales están accesibles desde navegación y footer para que se entienda la web completa, no solo la parte comercial. Además, los enlaces externos de compra se marcan con atributos de afiliación (<code>rel="sponsored"</code>) y añadimos avisos de transparencia en las páginas donde aplica.</p>
<h2>Contacto para incidencias o correcciones</h2>
<p>Si detectas un enlace roto, una ficha desactualizada o una recomendación mejorable, escríbenos a <a href="mailto:info@ajspinning.com" style="color:var(--c-primary)">info@ajspinning.com</a> o visita <a href="/contacto/" style="color:var(--c-primary)">contacto</a>. Las correcciones tienen prioridad porque mejoran la utilidad general para toda la comunidad.</p>
"""
    },
    {
        "slug": "contacto",
        "title": "Contacto | AJSpinning",
        "h1": "Contacto",
        "description": "Contacta con AJSpinning si has visto un error, quieres proponer una guía o necesitas aclarar una duda real sobre spinning.",
        "content": """
<p>Si has visto un error, quieres proponer una mejora o necesitas aclarar una duda concreta, puedes escribirnos. Cuanto más contexto des, más fácil será revisar bien la consulta.</p>
<p><strong>Email:</strong> <a href="mailto:info@ajspinning.com" style="color:var(--c-primary)">info@ajspinning.com</a></p>
<h2>¿Qué tipo de consultas atendemos?</h2>
<ul>
  <li>Dudas sobre selección de material de pesca spinning</li>
  <li>Comentarios sobre contenidos y propuestas de nuevas guías</li>
  <li>Sugerencias de productos para incluir en el catálogo</li>
  <li>Errores o problemas con el sitio web</li>
  <li>Propuestas de colaboración</li>
  <li>Consultas sobre el programa de afiliados</li>
</ul>
<h2>Plazos de respuesta</h2>
<p>Intentamos responder en un plazo de 24–48 horas laborables. Si tu mensaje tiene que ver con una corrección o una mejora del contenido, indícanos la URL concreta para poder revisarla más rápido.</p>
<h2>Qué información ayuda a resolver mejor tu consulta</h2>
<ul>
  <li>URL exacta de la guía, categoría o producto donde has detectado el problema.</li>
  <li>Descripción breve del error (texto confuso, enlace roto, precio incoherente, etc.).</li>
  <li>Escenario de pesca al que te refieres (río, embalse, costa; especie objetivo).</li>
  <li>Si procede, una sugerencia concreta de mejora para que podamos valorarla.</li>
</ul>
<h2>Compromiso editorial</h2>
<p>Priorizamos las consultas relacionadas con claridad del contenido, correcciones técnicas y seguridad de uso del material. Cuando una observación mejora una guía para todos los lectores, la tratamos como revisión prioritaria.</p>
<h2>Transparencia sobre afiliación</h2>
<p>Si tu consulta está relacionada con monetización o enlaces de compra, también puedes revisar nuestra <a href="/politica-afiliacion/" style="color:var(--c-primary)">Política de Afiliación</a>, donde explicamos cómo se seleccionan enlaces y qué límites aplicamos para mantener independencia al recomendar.</p>
<p>Si quieres conocer quién firma las guías y cómo se revisan, puedes visitar también la página de <a href="/equipo-editorial/" style="color:var(--c-primary)">equipo editorial</a>.</p>
<p>Gracias por ayudar a mejorar AJSpinning. El feedback de pescadores que están en el agua suele ser lo que más valor aporta a una guía.</p>
"""
    },
    {
        "slug": "aviso-legal",
        "title": "Aviso Legal | AJSpinning",
        "h1": "Aviso Legal",
        "description": "Aviso legal de AJSpinning. Información sobre el titular del sitio web y condiciones de uso.",
        "content": """
<h2>Titular del sitio web</h2>
<p>En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se facilita la siguiente información:</p>
<ul>
  <li><strong>Nombre del sitio:</strong> AJSpinning</li>
  <li><strong>Dominio:</strong> ajspinning.com</li>
  <li><strong>Email de contacto:</strong> info@ajspinning.com</li>
</ul>
<h2>Objeto y ámbito de aplicación</h2>
<p>El presente Aviso Legal regula el acceso y la utilización del sitio web ajspinning.com. El acceso al sitio web implica la aceptación de las condiciones aquí establecidas.</p>
<h2>Naturaleza del contenido</h2>
<p>AJSpinning publica contenido editorial orientado a pesca recreativa. Las guías, comparativas y recomendaciones se ofrecen con finalidad informativa y pueden requerir adaptación a cada escenario, nivel técnico y normativa local aplicable. El usuario es responsable de validar licencias, permisos y restricciones antes de pescar.</p>
<h2>Propiedad intelectual</h2>
<p>Los contenidos del sitio web (textos, imágenes, gráficos, logotipos) son propiedad de AJSpinning o de sus respectivos autores. Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa. Las imágenes de productos son propiedad de AliExpress y sus vendedores.</p>
<h2>Programa de afiliados</h2>
<p>AJSpinning es participante en el Programa de Afiliados de AliExpress. Los enlaces marcados como afiliados pueden generar una comisión para AJSpinning cuando se realiza una compra, sin coste adicional para el usuario.</p>
<h2>Limitación de responsabilidad</h2>
<p>AJSpinning no se hace responsable de la exactitud de los precios mostrados, que son orientativos y pueden variar en AliExpress. Los precios y disponibilidad se actualizan periódicamente pero pueden no reflejar en tiempo real el estado de la oferta en AliExpress.</p>
<p>Tampoco podemos garantizar disponibilidad permanente de productos, condiciones comerciales de terceros o resultados de pesca derivados del uso del material recomendado. Cada decisión de compra y uso técnico debe tomarse bajo criterio propio del usuario.</p>
<h2>Enlaces a terceros</h2>
<p>Este sitio puede incluir enlaces a dominios externos (por ejemplo, AliExpress o sedes oficiales de administraciones públicas). AJSpinning no controla esos sitios, su seguridad, su contenido ni sus políticas de privacidad. La navegación a terceros se realiza bajo responsabilidad del usuario.</p>
<h2>Protección de datos y cookies</h2>
<p>La información sobre privacidad, cookies y consentimiento publicitario está desarrollada en nuestras páginas de <a href="/politica-privacidad/" style="color:var(--c-primary)">Política de Privacidad</a> y <a href="/politica-cookies/" style="color:var(--c-primary)">Política de Cookies</a>.</p>
<h2>Legislación aplicable</h2>
<p>Este aviso legal se rige por la legislación española vigente.</p>
"""
    },
    {
        "slug": "condiciones-uso",
        "title": "Condiciones de Uso | AJSpinning",
        "h1": "Condiciones de uso",
        "description": "Condiciones de uso de AJSpinning: alcance informativo, responsabilidad del usuario y límites de recomendaciones y enlaces externos.",
        "content": """
<p>Estas condiciones regulan el uso del sitio web AJSpinning y tienen como objetivo aclarar, de forma simple, qué tipo de información ofrecemos, cómo debe interpretarse y cuáles son los límites de responsabilidad del proyecto. Al acceder y navegar por ajspinning.com, aceptas estas condiciones de uso.</p>
<h2>Finalidad del sitio</h2>
<p>AJSpinning es una web editorial sobre pesca spinning en España. Publicamos guías, comparativas y contexto práctico para ayudar a tomar decisiones de compra y planificación de salidas. El contenido tiene carácter informativo y divulgativo; no constituye asesoramiento profesional, legal o administrativo personalizado.</p>
<h2>Uso permitido</h2>
<ul>
  <li>Consultar y compartir enlaces a nuestras páginas para uso personal o educativo.</li>
  <li>Aplicar recomendaciones técnicas bajo criterio propio y adaptadas al escenario real de pesca.</li>
  <li>Contactarnos para reportar errores, enlaces rotos o mejoras editoriales.</li>
</ul>
<h2>Uso no permitido</h2>
<ul>
  <li>Copiar de forma masiva contenidos del sitio para reutilización comercial sin autorización.</li>
  <li>Utilizar AJSpinning para fines fraudulentos, automatización abusiva o manipulación de datos.</li>
  <li>Interpretar una guía como garantía de resultado en captura, seguridad o rendimiento.</li>
</ul>
<h2>Responsabilidad del usuario</h2>
<p>Cada pescador es responsable de comprobar la normativa aplicable en su comunidad autónoma (licencias, vedas, cupos, tallas y escenarios autorizados), de usar material adecuado y de priorizar seguridad en todo momento. AJSpinning recomienda prácticas responsables, pero no puede sustituir la revisión normativa ni la decisión final del usuario en campo.</p>
<h2>Enlaces externos y afiliación</h2>
<p>Algunas páginas incluyen enlaces externos a AliExpress y otros sitios de terceros. AJSpinning no controla directamente esos dominios, sus precios, su disponibilidad ni sus políticas. Podemos recibir una comisión por compras realizadas mediante enlaces de afiliación, sin coste adicional para el usuario. Esta monetización no implica garantía sobre producto, vendedor, plazos de envío o servicio posventa.</p>
<h2>Actualización y precisión del contenido</h2>
<p>Trabajamos para mantener el contenido útil y actualizado, pero puede haber cambios en precios, stock, variantes o normativa tras la publicación de una página. Si detectas un dato incorrecto o desactualizado, puedes escribirnos a <a href="mailto:info@ajspinning.com" style="color:var(--c-primary)">info@ajspinning.com</a> o usar la página de <a href="/contacto/" style="color:var(--c-primary)">contacto</a> para solicitar revisión.</p>
<h2>Modificaciones de estas condiciones</h2>
<p>AJSpinning puede actualizar estas condiciones cuando sea necesario para adaptarlas a cambios del sitio, de la normativa o de las políticas de plataformas publicitarias. La versión vigente será siempre la publicada en esta página.</p>
"""
    },
    {
        "slug": "politica-privacidad",
        "title": "Política de Privacidad | AJSpinning",
        "h1": "Política de Privacidad",
        "description": "Política de privacidad de AJSpinning. Cómo tratamos tus datos personales de acuerdo con el RGPD.",
        "content": """
<p>En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), te informamos sobre el tratamiento de tus datos personales.</p>
<h2>Responsable del tratamiento</h2>
<p>AJSpinning — ajspinning.com — info@ajspinning.com</p>
<h2>Datos que recopilamos</h2>
<p>AJSpinning es un sitio web de contenido estático que <strong>no recopila datos personales directamente</strong>. No disponemos de formularios de registro, ni procesamos pagos, ni almacenamos información identificable de los visitantes en nuestros servidores.</p>
<h2>Cookies y tecnologías de seguimiento</h2>
  <p>Este sitio web puede utilizar cookies o tecnologías equivalentes de terceros para el funcionamiento de servicios publicitarios como Google AdSense. Además, almacenamos en el navegador la preferencia de consentimiento para recordar si has aceptado o rechazado las cookies no esenciales. Para más información, consulta nuestra <a href="/politica-cookies/" style="color:var(--c-primary)">Política de Cookies</a>.</p>
<h2>Google AdSense</h2>
<p>AJSpinning utiliza <strong>Google AdSense</strong> para mostrar anuncios en algunas páginas del sitio. Google y otros proveedores terceros pueden usar cookies y tecnologías similares para mostrar anuncios basados en las visitas previas del usuario a esta web o a otros sitios de Internet.</p>
<p>Cuando no existe un consentimiento publicitario explícito, AJSpinning aplica una configuración orientada a reducir la personalización de anuncios en el navegador del usuario.</p>
<p>La utilización de cookies publicitarias por parte de Google permite personalizar anuncios y medir su rendimiento. Si quieres conocer cómo Google trata la información personal en este contexto, puedes consultar la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color:var(--c-primary)">Política de Privacidad de Google</a>.</p>
<p>Los usuarios pueden <strong>desactivar la personalización de anuncios</strong> visitando <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" style="color:var(--c-primary)">https://www.google.com/settings/ads</a>.</p>
<p>Para visitantes del Espacio Económico Europeo, Reino Unido y Suiza, la gestión del consentimiento publicitario se ajusta al mecanismo configurado en Google AdSense y, cuando aplique, a una plataforma de gestión de consentimiento (CMP) certificada por Google. Puedes consultar los requisitos de CMP en <a href="https://support.google.com/adsense/answer/13554116" target="_blank" rel="noopener" style="color:var(--c-primary)">la documentación oficial de Google AdSense</a>.</p>
<p>Para ampliar información sobre cómo Google utiliza los datos cuando se usan sus productos publicitarios, también puedes consultar <a href="https://business.safety.google/privacy/" target="_blank" rel="noopener" style="color:var(--c-primary)">Google Business Data Responsibility</a>.</p>
<h2>Links a terceros (AliExpress)</h2>
<p>Los enlaces de compra dirigen al usuario a AliExpress, que tiene su propia política de privacidad. AJSpinning no controla ni se hace responsable de las prácticas de privacidad de AliExpress.</p>
<h2>Tus derechos</h2>
<p>Tienes derecho a acceder, rectificar, suprimir, limitar u oponerte al tratamiento de tus datos, así como a la portabilidad de los mismos. Para ejercer estos derechos, contacta con nosotros en info@ajspinning.com.</p>
"""
    },
    {
        "slug": "politica-cookies",
        "title": "Política de Cookies | AJSpinning",
        "h1": "Política de Cookies",
        "description": "Política de cookies de AJSpinning. Qué cookies usamos y cómo puedes gestionarlas.",
        "content": """
<p>Este sitio web utiliza cookies para mejorar la experiencia del usuario y con fines de publicidad y análisis. A continuación te explicamos qué cookies utilizamos y para qué.</p>
<h2>¿Qué son las cookies?</h2>
<p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y acciones durante un período de tiempo.</p>
<h2>Tipos de cookies que utilizamos</h2>
<h3>Cookies técnicas (necesarias)</h3>
<p>Son estrictamente necesarias para el funcionamiento del sitio web. No recopilan información personal identificable.</p>
<p>También podemos almacenar tu elección de consentimiento en el navegador mediante <strong>localStorage</strong> o tecnologías equivalentes para recordar si has aceptado o rechazado las cookies no esenciales.</p>
  <h3>Preferencias del sitio</h3>
  <p>AJSpinning puede guardar tu elección sobre cookies no esenciales en <strong>localStorage</strong> o tecnologías equivalentes del navegador. Esta preferencia solo se utiliza para recordar si aceptaste o rechazaste la personalización publicitaria y para no mostrar el aviso en cada página.</p>
  <h3>Cookies publicitarias</h3>
  <p>Utilizamos <strong>Google AdSense</strong> para mostrar anuncios relevantes. Google puede usar cookies para mostrar anuncios personalizados basados en tu historial de navegación. Puedes gestionar tus preferencias de publicidad en <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" style="color:var(--c-primary)">Configuración de anuncios de Google</a>.</p>
<p>Si no aceptas la personalización publicitaria en el banner de cookies, AJSpinning aplica una preferencia de anuncios no personalizados en este navegador, cuando sea técnicamente posible.</p>
<p>Si navegas desde el Espacio Económico Europeo, Reino Unido o Suiza, el consentimiento publicitario se gestiona conforme a los requisitos de Google para estas regiones, mediante el mecanismo configurado en AdSense y CMP certificada cuando aplique. Más información en <a href="https://support.google.com/adsense/answer/13554116" target="_blank" rel="noopener" style="color:var(--c-primary)">requisitos oficiales de CMP para publishers</a>.</p>
<p>Para más información sobre el tratamiento de datos por parte de Google, puedes consultar la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color:var(--c-primary)">Política de Privacidad de Google</a> y la página de <a href="https://business.safety.google/privacy/" target="_blank" rel="noopener" style="color:var(--c-primary)">Business Data Responsibility</a>.</p>
<h2>Cómo gestionar las cookies</h2>
<p>Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envíe una cookie. Consulta la ayuda de tu navegador para saber cómo hacerlo. Ten en cuenta que si deshabilitas las cookies, algunas funciones del sitio pueden no funcionar correctamente.</p>
<h2>Más información</h2>
<p>Para más información sobre nuestra política de privacidad, visita nuestra <a href="/politica-privacidad/" style="color:var(--c-primary)">Política de Privacidad</a>.</p>
"""
    }
]

GUIDE_METADATA = {
    "spinning-para-principiantes": {
        "cluster": "Primeros pasos",
        "level": "Inicial",
        "focus": "Equipo básico, técnica y primeros escenarios",
        "related_category": "canas",
        "faq": [
            ("¿Cuánto cuesta empezar en spinning?", "Con un equipo sencillo y bien elegido puedes empezar entre 50 y 100 euros incluyendo caña, carrete, línea, algunos señuelos y accesorios básicos."),
            ("¿Qué especie es mejor para un principiante?", "Depende de tu zona, pero perca, trucha y lubina costera en escenarios accesibles suelen ser buenas especies para aprender lectura del agua y control del señuelo."),
        ],
    },
    "mejores-senueulos-lucio": {
        "cluster": "Especies y escenarios",
        "level": "Intermedio",
        "focus": "Lucio en embalse, río y aguas con estructura",
        "related_category": "senueulos",
        "faq": [
            ("¿Mejor tamaño de señuelo para lucio?", "En la mayoría de escenarios españoles, moverse entre 10 y 14 cm es un rango muy sólido para empezar a buscar lucio con confianza."),
            ("¿Hace falta usar acero con lucio?", "Sí, en la mayoría de casos conviene montar un bajo resistente a los dientes del lucio para evitar cortes y pérdidas de señuelos."),
        ],
    },
    "mejores-senueulos-lubina": {
        "cluster": "Especies y escenarios",
        "level": "Intermedio",
        "focus": "Lubina desde costa, playa y desembocaduras",
        "related_category": "senueulos",
        "faq": [
            ("¿Qué color funciona mejor para lubina?", "El plateado, blanco y azul suelen funcionar muy bien porque imitan pez pasto habitual como boquerón o sardina."),
            ("¿Cuándo merece la pena pescar lubina en superficie?", "Al amanecer, al atardecer y en jornadas con actividad arriba del agua o espuma marcada en zonas someras."),
        ],
    },
    "como-elegir-carrete-spinning": {
        "cluster": "Equipo y compra",
        "level": "Inicial",
        "focus": "Tallas, ratio, freno y mantenimiento",
        "related_category": "carretes",
        "faq": [
            ("¿Qué talla de carrete es la más versátil?", "La 2500 o 3000 suele ser la talla más versátil para muchas situaciones de spinning en España."),
            ("¿Importa más el ratio o el freno?", "Ambos importan, pero para empezar suele pesar más elegir una talla y un freno adecuados antes que obsesionarse con ratios extremos."),
        ],
    },
    "cana-de-spinning-como-elegir": {
        "cluster": "Equipo y compra",
        "level": "Inicial",
        "focus": "Longitud, potencia, acción y elección por escenario",
        "related_category": "canas",
        "faq": [
            ("¿Qué caña de spinning es más polivalente para empezar?", "En muchos escenarios españoles, una 2,10-2,40 m de potencia ML/M con rango 5-25 g suele ser una base muy versátil."),
            ("¿Telescópica o de dos tramos?", "Si priorizas rendimiento, dos tramos suele dar más finura; si priorizas transporte diario, una buena telescópica puede encajar mejor."),
        ],
    },
    "senuelos-para-trucha-spinning": {
        "cluster": "Especies y escenarios",
        "level": "Intermedio",
        "focus": "Minnow, jerkbait, cucharilla y vinilo para trucha en río",
        "related_category": "senueulos",
        "faq": [
            ("¿Cuál es el mejor señuelo para trucha si solo puedo llevar uno?", "Un minnow de 4 a 6 cm bien presentado en la corriente suele ser la opción más polivalente para trucha en spinning."),
            ("¿Jerkbait o cucharilla para trucha?", "Depende del tramo y la actividad: cucharilla para lectura rápida y corriente clásica, jerkbait cuando necesitas pausas y cambios de dirección más marcados."),
        ],
    },
    "tecnicas-spinning-avanzadas": {
        "cluster": "Técnica y progresión",
        "level": "Avanzado",
        "focus": "Jigging, twitching y montajes finos",
        "related_category": "senueulos",
        "faq": [
            ("¿Qué técnica avanzada conviene dominar primero?", "El twitching y el jigging son dos de las más útiles porque se aplican a muchos escenarios y especies."),
            ("¿Hace falta material muy específico para progresar?", "No necesariamente. Antes de comprar más equipo, suele dar mejor resultado perfeccionar lectura del agua, pausas y control del señuelo."),
        ],
    },
    "calendario-spinning-espana": {
        "cluster": "Planificación",
        "level": "Inicial",
        "focus": "Estaciones, especies y ventanas de actividad",
        "related_category": "senueulos",
        "faq": [
            ("¿Cuál es la mejor estación para spinning en España?", "Otoño y primavera suelen ofrecer ventanas muy buenas, aunque depende mucho de especie, comunidad y tipo de escenario."),
            ("¿Puedo pescar igual todo el año con los mismos señuelos?", "Sí puedes, pero rinde mucho mejor adaptar profundidad, ritmo y perfil del señuelo a la estación y la temperatura del agua."),
        ],
    },
    "como-elegir-senuelo-segun-agua-y-clima": {
        "cluster": "Equipo y compra",
        "level": "Inicial",
        "focus": "Color, vibración, profundidad y condiciones",
        "related_category": "senueulos",
        "faq": [
            ("¿Agua clara significa siempre colores naturales?", "Es la opción más fiable, aunque si el pez está agresivo o hay poca luz puedes salirte de esa regla."),
            ("¿Qué debo cambiar primero: color o profundidad?", "Normalmente la profundidad o el tipo de señuelo. Si no trabajas donde está el pez, el color pasa a segundo plano."),
        ],
    },
    "errores-spinning-principiantes": {
        "cluster": "Primeros pasos",
        "level": "Inicial",
        "focus": "Fallos frecuentes y correcciones prácticas",
        "related_category": "accesorios",
        "faq": [
            ("¿Qué error cuesta más dinero al empezar?", "Comprar equipo y señuelos sin definir escenario principal suele ser el fallo más caro y más común."),
            ("¿Cómo progresar más rápido en spinning?", "Trabajando pocas variables a la vez: un escenario, un par de señuelos y atención a profundidad, ritmo y pausas."),
        ],
    },
    "leer-embalse-lucio-perca": {
        "cluster": "Especies y escenarios",
        "level": "Intermedio",
        "focus": "Puntas, reculas, viento y estructuras en embalse",
        "related_category": "senueulos",
        "faq": [
            ("¿Qué zona mirar primero en un embalse grande?", "Una punta clara, una recula con vida o una estructura que combine profundidad y pez pasto suelen ser grandes puntos de partida."),
            ("¿El viento puede ayudar en embalse?", "Sí. Muchas veces activa una orilla porque empuja comida, oxígeno y pez pasto hacia una zona concreta."),
        ],
    },
    "spinning-costa-espuma-mareas": {
        "cluster": "Especies y escenarios",
        "level": "Intermedio",
        "focus": "Espuma, canales, viento y lectura del mar",
        "related_category": "senueulos",
        "faq": [
            ("¿Hay que lanzar siempre a la espuma?", "No. Lo importante es entender qué borde, salida o canal está usando la corriente y dónde puede colocarse la lubina."),
            ("¿Qué manda más en costa: marea o viento?", "Depende de la zona. En algunos puntos la marea ordena el escenario y en otros el viento y el oleaje generan la oportunidad principal."),
        ],
    },
    "nudos-y-bajos-spinning": {
        "cluster": "Equipo y compra",
        "level": "Intermedio",
        "focus": "Uniones, bajos, grapas y coherencia del montaje",
        "related_category": "hilos",
        "faq": [
            ("¿Hace falta dominar muchos nudos?", "No. Da más resultado repetir muy bien tres o cuatro uniones fiables que conocer diez nudos a medias."),
            ("¿Siempre conviene usar fluorocarbono como bajo?", "Es una opción muy útil, pero la longitud y el material del bajo deben responder al escenario, a la claridad y a la especie objetivo."),
        ],
    },
    "checklist-salida-spinning": {
        "cluster": "Planificación",
        "level": "Inicial",
        "focus": "Preparación de jornada, equipo y seguridad",
        "related_category": "accesorios",
        "faq": [
            ("¿Qué suele olvidarse más un pescador al salir?", "Alicates, repuestos pequeños, licencia actualizada o revisar de verdad el estado del bajo y los nudos antes de empezar."),
            ("¿Conviene llevar muchos señuelos por si acaso?", "Normalmente no. Funciona mejor una caja corta con roles claros que una mochila llena sin plan."),
        ],
    },
    "especies-spinning-espana": {
        "cluster": "Atlas de especies",
        "level": "Inicial",
        "focus": "Mapa general de especies, escenarios y enfoques",
        "related_category": "senueulos",
        "faq": [
            ("¿Qué especie es la más versátil para empezar en España?", "En interior suele ser muy buena idea empezar por perca, trucha o lucio según tu zona; en costa, la lubina sigue siendo la especie escuela más completa."),
            ("¿De verdad entran muchos peces distintos a spinning?", "Sí. Además de los depredadores clásicos, muchas especies oportunistas responden bien a pequeños señuelos si el escenario y el momento acompañan."),
        ],
    },
    "peces-spinning-agua-dulce-espana": {
        "cluster": "Atlas de especies",
        "level": "Intermedio",
        "focus": "Lucio, trucha, bass, lucioperca, perca y siluro",
        "related_category": "senueulos",
        "faq": [
            ("¿Cuál es la mejor especie de agua dulce para aprender?", "Depende de tu zona, pero perca, trucha y black bass suelen acelerar mucho la curva de aprendizaje porque obligan a afinar lectura y presentación sin exigir cajas enormes."),
            ("¿Hace falta una caja distinta para cada especie?", "No al principio. Suele funcionar mejor una caja corta por funciones y después afinarla según el pez y el escenario que más repitas."),
        ],
    },
    "peces-spinning-mar-espana": {
        "cluster": "Atlas de especies",
        "level": "Intermedio",
        "focus": "Lubina, anjova, palometón, espáridos y pelágicos de costa",
        "related_category": "senueulos",
        "faq": [
            ("¿Se puede pescar algo más que lubina a spinning en la costa española?", "Muchísimo más: anjova, palometón, jurel, caballa, llampuga, barracuda, baila y, en spinning ligero, también dorada, sargo u oblada según zona y momento."),
            ("¿Qué especie de mar conviene buscar primero?", "Para la mayoría de pescadores de orilla, lubina y pequeños pelágicos son la mejor escuela porque enseñan lectura del agua y selección de señuelo sin exigir montajes extremos; si pescas puertos o escolleras, el spinning ligero sobre espáridos también forma mucho."),
        ],
    },
    "licencias-pesca-espana": {
        "cluster": "Planificación y progresión",
        "level": "Inicial",
        "focus": "Licencias, permisos y tramitación útil para pescar legalmente en España",
        "related_category": "accesorios",
        "faq": [
            ("¿La licencia de una comunidad me sirve en otra?", "Normalmente no. La regla general es que cada comunidad gestiona su propia licencia, salvo los casos cubiertos por la licencia interautonómica de pesca en aguas continentales."),
            ("¿Licencia y permiso de coto son lo mismo?", "No. La licencia te habilita para pescar en la comunidad, pero un coto, una zona controlada o un tramo especial pueden exigir además un permiso específico."),
        ],
    },
}

GUIDE_CLUSTERS = [
    ("Primeros pasos", ["spinning-para-principiantes", "errores-spinning-principiantes"]),
    ("Equipo y compra", ["como-elegir-carrete-spinning", "cana-de-spinning-como-elegir", "como-elegir-senuelo-segun-agua-y-clima", "nudos-y-bajos-spinning"]),
    ("Atlas de especies", ["especies-spinning-espana", "peces-spinning-agua-dulce-espana", "peces-spinning-mar-espana"]),
    ("Especies y escenarios", ["mejores-senueulos-lucio", "mejores-senueulos-lubina", "senuelos-para-trucha-spinning", "leer-embalse-lucio-perca", "spinning-costa-espuma-mareas"]),
    ("Planificación y progresión", ["calendario-spinning-espana", "tecnicas-spinning-avanzadas", "checklist-salida-spinning", "licencias-pesca-espana"]),
]

GUIDE_IMAGES = {
    "spinning-para-principiantes": {
        "src": "/assets/img/editorial/spinning-principiantes-muelle.webp",
        "alt": "Pescadores practicando spinning desde un muelle al inicio de la jornada",
    },
    "mejores-senueulos-lucio": {
        "src": "/assets/img/editorial/senuelos-spinning-seleccion.webp",
        "alt": "Selección de señuelos artificiales para spinning colocados en fila",
    },
    "mejores-senueulos-lubina": {
        "src": "/assets/img/editorial/lubina-spinning-costa.webp",
        "alt": "Caña de spinning pescando desde costa en mar abierto",
    },
    "como-elegir-carrete-spinning": {
        "src": "/assets/img/editorial/carrete-spinning-detalle.webp",
        "alt": "Detalle de un carrete de spinning con línea cargada",
    },
    "cana-de-spinning-como-elegir": {
        "src": "/assets/img/editorial/spinning-principiantes-muelle.webp",
        "alt": "Caña de spinning preparada para una jornada de pesca desde orilla",
    },
    "senuelos-para-trucha-spinning": {
        "src": "/assets/img/editorial/senuelos-spinning-seleccion.webp",
        "alt": "Selección de minnows, jerkbaits y cucharillas para trucha a spinning",
    },
    "tecnicas-spinning-avanzadas": {
        "src": "/assets/img/editorial/tecnicas-spinning-lance-atardecer.webp",
        "alt": "Caña de spinning preparada para lanzar al atardecer junto al mar",
    },
    "calendario-spinning-espana": {
        "src": "/assets/img/editorial/calendario-spinning-atardecer.webp",
        "alt": "Pescadores de spinning durante una tarde de verano junto al agua",
    },
    "como-elegir-senuelo-segun-agua-y-clima": {
        "src": "/assets/img/editorial/senuelos-agua-clima.webp",
        "alt": "Señuelos artificiales de distintos colores y formas para adaptar la pesca al agua y al clima",
    },
    "errores-spinning-principiantes": {
        "src": "/assets/img/editorial/checklist-salida-spinning-equipo.webp",
        "alt": "Equipo de spinning organizado antes de una salida de pesca",
    },
    "leer-embalse-lucio-perca": {
        "src": "/assets/img/editorial/embalse-spinning-cana-lago.webp",
        "alt": "Caña de spinning apuntando a un embalse en calma durante una jornada de pesca",
    },
    "spinning-costa-espuma-mareas": {
        "src": "/assets/img/editorial/spinning-costa-mar-abierto.webp",
        "alt": "Pescador lanzando a spinning desde costa con mar de fondo",
    },
    "nudos-y-bajos-spinning": {
        "src": "/assets/img/editorial/nudos-bajos-terminales.webp",
        "alt": "Terminal de pesca con anzuelo triple para montajes y bajos de spinning",
    },
    "checklist-salida-spinning": {
        "src": "/assets/img/editorial/checklist-salida-spinning-equipo.webp",
        "alt": "Accesorios y herramientas de spinning preparados sobre una mesa antes de salir a pescar",
    },
    "especies-spinning-espana": {
        "src": "/assets/img/editorial/atlas-especies-spinning-espana.webp",
        "alt": "Pescador en costa rocosa representando la variedad de especies para spinning en España",
    },
    "peces-spinning-agua-dulce-espana": {
        "src": "/assets/img/editorial/peces-agua-dulce-spinning-lucio.webp",
        "alt": "Lucio capturado a spinning en un escenario de agua dulce",
    },
    "peces-spinning-mar-espana": {
        "src": "/assets/img/editorial/peces-mar-spinning-barco.webp",
        "alt": "Pescador de spinning en el mar durante una jornada embarcada",
    },
    "licencias-pesca-espana": {
        "src": "/assets/img/editorial/checklist-salida-spinning-equipo.webp",
        "alt": "Equipo de spinning y documentación preparados antes de una salida de pesca en España",
    },
}

GUIDE_PRODUCT_PLANS = {
    "spinning-para-principiantes": {
        "title": "Equipo recomendado para empezar con criterio",
        "intro": "Una base sensata para empezar a lanzar sin comprar material al azar: una caña cómoda, un carrete equilibrado, algunos señuelos y una opción sencilla para arrancar rápido.",
        "categories": ["combos", "canas", "carretes", "senueulos"],
    },
    "mejores-senueulos-lucio": {
        "title": "Material útil para buscar lucio",
        "intro": "Aquí tienes una selección pensada para mover mejor volumen, trabajar profundidades medias y montar terminales más coherentes cuando buscas peces con boca dura y dientes.",
        "categories": ["senueulos", "hilos", "anzuelos"],
    },
    "mejores-senueulos-lubina": {
        "title": "Señuelos y equipo para lubina desde costa",
        "intro": "Una combinación pensada para playas, espumeros, desembocaduras y puertos: perfiles realistas, líneas finas y cañas que permitan lanzar y leer bien la ola.",
        "categories": ["senueulos", "hilos", "canas"],
    },
    "como-elegir-carrete-spinning": {
        "title": "Carretes y material para afinar el conjunto",
        "intro": "Si esta guía te ha ayudado a entender tallas y ratios, aquí tienes modelos y apoyos de montaje para aterrizar la compra con más criterio.",
        "categories": ["carretes", "hilos", "canas"],
    },
    "cana-de-spinning-como-elegir": {
        "title": "Cañas y combinaciones equilibradas para empezar bien",
        "intro": "Una selección para elegir longitud, potencia y equilibrio con carrete y línea según el escenario donde realmente pescas.",
        "categories": ["canas", "carretes", "combos", "hilos"],
    },
    "senuelos-para-trucha-spinning": {
        "title": "Señuelos y equipo ligero para trucha en río",
        "intro": "Base práctica para mover minnows, cucharillas y microvinilos con mejor control de ángulo, profundidad y ritmo en tramos trucheros.",
        "categories": ["senueulos", "canas", "hilos", "anzuelos"],
    },
    "tecnicas-spinning-avanzadas": {
        "title": "Material para pescar más fino y con más recursos",
        "intro": "Una selección para trabajar pausas, cambios de ritmo, montajes técnicos y escenarios donde el detalle marca la diferencia.",
        "categories": ["senueulos", "hilos", "anzuelos"],
    },
    "calendario-spinning-espana": {
        "title": "Productos versátiles para distintas épocas del año",
        "intro": "No hace falta tener una caja infinita para adaptarte a las estaciones. Esta selección mezcla polivalencia, repuestos útiles y material fácil de mover durante todo el año.",
        "categories": ["senueulos", "combos", "accesorios"],
    },
    "como-elegir-senuelo-segun-agua-y-clima": {
        "title": "Señuelos para ajustar color, perfil y profundidad",
        "intro": "Una selección para trasladar lo que has leído a decisiones reales: cambiar perfil, vibración o profundidad antes de comprar por impulso.",
        "categories": ["senueulos", "hilos", "anzuelos"],
    },
    "errores-spinning-principiantes": {
        "title": "Material para empezar sin caer en errores típicos",
        "intro": "Poco, útil y con sentido: mejor una base corta y coherente que una compra grande sin plan. Estas opciones están elegidas con esa idea.",
        "categories": ["combos", "accesorios", "senueulos"],
    },
    "leer-embalse-lucio-perca": {
        "title": "Equipo para embalse, reculas y estructuras",
        "intro": "Una selección pensada para mover agua, leer puntas y trabajar capas medias y profundas con algo más de control en embalse.",
        "categories": ["senueulos", "hilos", "canas"],
    },
    "spinning-costa-espuma-mareas": {
        "title": "Material para costa, espuma y corrientes",
        "intro": "Si pescas playas abiertas, escolleras o desembocaduras, aquí tienes una mezcla útil de señuelos, línea y cañas con enfoque costero.",
        "categories": ["senueulos", "hilos", "canas"],
    },
    "nudos-y-bajos-spinning": {
        "title": "Líneas, terminales y apoyos para montar mejor",
        "intro": "Productos que encajan con esta guía para afinar bajos, rehacer montajes y mantener el sistema más limpio y fiable en el agua.",
        "categories": ["hilos", "anzuelos", "accesorios"],
    },
    "checklist-salida-spinning": {
        "title": "Lo que conviene llevar preparado antes de salir",
        "intro": "Una selección práctica para no olvidarte de lo importante: pequeños accesorios, repuestos y equipo que resuelven una jornada de pesca real.",
        "categories": ["accesorios", "combos", "hilos"],
    },
    "especies-spinning-espana": {
        "title": "Material polivalente para tocar varias especies",
        "intro": "Si tu pesca cambia según zona o temporada, esta selección busca versatilidad para montar una base útil antes de especializarte.",
        "categories": ["senueulos", "combos", "carretes", "hilos"],
    },
    "peces-spinning-agua-dulce-espana": {
        "title": "Productos para spinning en agua dulce",
        "intro": "Una base pensada para lucio, bass, trucha, perca, lucioperca o siluro según escenario, combinando señuelos, línea y conjunto principal.",
        "categories": ["senueulos", "carretes", "hilos", "canas"],
    },
    "peces-spinning-mar-espana": {
        "title": "Productos para spinning en mar",
        "intro": "Selección útil para costa española: equipos para lubina, pequeños pelágicos y spinning ligero sobre espáridos cuando la situación lo pide.",
        "categories": ["senueulos", "hilos", "canas", "carretes"],
    },
    "licencias-pesca-espana": {
        "title": "Material básico para una salida bien resuelta",
        "intro": "Después de arreglar el papeleo, esto es lo que sí tiene sentido para empezar a pescar sin llevar media casa encima: equipo base, pequeños accesorios y un primer conjunto coherente.",
        "categories": ["combos", "accesorios", "senueulos"],
    },
}

CATEGORY_PRODUCT_RULES = {
    "senueulos": {
        "preferred": ["senuelo", "minnow", "jerkbait", "wobbler", "jig", "swimbait", "crankbait", "vib", "spinnerbait"],
        "blocked": [],
    },
    "carretes": {
        "preferred": ["carrete", "giratorio", "baitcasting", "arrastre"],
        "blocked": ["bolsa", "funda", "mango", "perilla", "repuesto"],
    },
    "canas": {
        "preferred": ["cana", "canas", "telescopica", "carbono", "viaje", "ultraligera", "spinning", "baitcasting"],
        "blocked": ["correas", "cinturones", "calcetin", "cubierta", "protector", "lazos"],
    },
    "combos": {
        "preferred": ["combo", "kit", "juego", "conjunto"],
        "blocked": [],
    },
    "hilos": {
        "preferred": ["linea", "fluorocarbono", "trenzado", "sedal", "leader", "bajo"],
        "blocked": [],
    },
    "anzuelos": {
        "preferred": ["anzuelo", "anzuelos", "jig", "gancho", "cabeza"],
        "blocked": [],
    },
    "accesorios": {
        "preferred": ["caja", "organizador", "accesorios", "impermeable", "aparejos", "herramienta"],
        "blocked": [],
    },
}

# ─── Componentes HTML ─────────────────────────────────────────────────────────

def head(
    title,
    description,
    canonical,
    schema="",
    og_type="website",
    robots=DEFAULT_ROBOTS,
    extra_head="",
    og_image="",
    include_adsense=True,
):
    og_meta = ""
    if og_image:
        og_meta = f"""
    <meta property="og:image" content="{og_image}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="{og_image}">"""
    adsense_block = ""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="{robots}">
  <meta name="author" content="{EDITORIAL_TEAM['name']}">
  <meta name="google-adsense-account" content="{ADSENSE_CLIENT}">
  <meta name="theme-color" content="#0a1f3d">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" href="/assets/img/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png?v={CSS_ASSET_VERSION}">
  <link rel="stylesheet" href="/assets/css/style.css?v={CSS_ASSET_VERSION}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Manrope:wght@400;500;600;700;800&family=Saira+Condensed:wght@500;600;700;800;900&display=swap" rel="stylesheet">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="{canonical}">
    <meta property="og:site_name" content="{SITE_NAME}">
    <meta property="og:type" content="{og_type}">
    {og_meta}
    {adsense_block}
    {extra_head}
    {schema}
  </head>"""


def nav():
    return f"""<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo">
      <img src="/assets/img/logo.png" alt="" class="logo-img" width="27" height="36" aria-hidden="true">
      <span class="logo-text">AJ<strong>Spinning</strong></span>
      </a>
      <nav class="main-nav">
        <a href="/guia/" class="nav-guides">Guías</a>
        <a href="/pesca-spinning/" class="nav-guide">Pesca spinning</a>
        <a href="{INTERACTIVE_GUIDE_URL}" class="nav-tool">Guía interactiva</a>
        <a href="/empieza-aqui/" class="nav-start">Empieza aquí</a>
        <a href="/tienda-de-pesca/" class="nav-products">Criterio de compra</a>
      </nav>
      <button class="nav-toggle" aria-label="Menú">&#9776;</button>
    </div>
  </header>"""


def footer():
    return f"""<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-cols">
      <div class="footer-col">
        <div class="footer-logo">
          <img src="/assets/img/logo.png" alt="" class="footer-logo-img" width="29" height="38" aria-hidden="true">
          <span style="font-family:var(--font-head);font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:-.02em;">AJ<strong style="color:#7ed9f0;">Spinning</strong></span>
        </div>
        <p class="footer-tagline">Tu guía de pesca spinning y casting en España</p>
        <p class="footer-tagline" style="margin-top:12px;color:rgba(255,255,255,.72);max-width:280px;">Contenido práctico, selección honesta y recursos evergreen para pescar mejor y comprar con más criterio.</p>
      </div>
      <div class="footer-col">
        <strong>Rutas editoriales</strong>
        <nav class="footer-nav-col"><a href="/guia/">Todas las guías</a> <a href="/pesca-spinning/">Pesca spinning en España</a> <a href="/empieza-aqui/">Empieza aquí</a> <a href="{INTERACTIVE_GUIDE_URL}">Guía interactiva</a> <a href="/contacto/">Contacto</a></nav>
      </div>
        <div class="footer-col">
          <strong>Rutas para empezar</strong>
          <nav class="footer-nav-col">
            <a href="/empieza-aqui/">Empieza aquí</a>
            <a href="/guia/spinning-para-principiantes/">Spinning para principiantes</a>
            <a href="/guia/errores-spinning-principiantes/">Errores comunes</a>
            <a href="/guia/calendario-spinning-espana/">Calendario de spinning</a>
            <a href="/guia/licencias-pesca-espana/">Licencias de pesca</a>
            <a href="{INTERACTIVE_GUIDE_URL}">Guía interactiva</a>
            <a href="/guia/">Todas las guías</a>
          </nav>
        </div>
      <div class="footer-col">
        <strong>Confianza y contacto</strong>
        <nav class="footer-nav-col">
          <a href="/equipo-editorial/">Equipo editorial</a>
          <a href="/compromiso-calidad/">Compromiso de calidad</a>
          <a href="/sobre-nosotros/">Sobre nosotros</a>
          <a href="/metodologia/">Metodología</a>
          <a href="/politica-editorial/">Política editorial</a>
          <a href="/mapa-web/">Mapa web</a>
          <a href="/contacto/">Contacto</a>
          <a href="/aviso-legal/">Aviso legal</a>
          <a href="/condiciones-uso/">Condiciones de uso</a>
          <a href="/politica-privacidad/">Privacidad</a>
          <a href="/politica-afiliacion/">Afiliación</a>
          <a href="/politica-cookies/">Cookies</a>
        </nav>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-legal">
        Algunos enlaces pueden ser de afiliación. Esto no condiciona nuestras recomendaciones ni supone un coste adicional para ti. © {YEAR} AJSpinning
      </p>
    </div>
  </div>
</footer>
<button type="button" class="back-to-top" data-back-to-top aria-label="Subir al inicio" title="Subir al inicio">
  <span class="back-to-top-icon" aria-hidden="true">↑</span>
</button>
<script src="/assets/js/app.js?v={JS_ASSET_VERSION}"></script>"""


def product_card(p):
    display_title = compact_product_title(p.get("title", ""))
    badge = f'<span class="badge">-{p["discount"]}%</span>' if p.get("discount", 0) >= 5 else ""
    original = (f'<span class="price-original">{p["price_original"]:.2f} €</span>'
                if p.get("price_original", 0) > p.get("price", 0) else "")
    return f"""<article class="product-card">
  <a href="/producto/{p['slug']}/" class="card-link">
    <div class="card-img-wrap">
      <img src="{p['image']}" alt="{display_title}" loading="lazy" width="300" height="300">
      {badge}
    </div>
    <div class="card-body">
      <h3 class="card-title">{display_title}</h3>
      <div class="card-price">
        {original}
        <span class="price-sale">{p['price']:.2f} €</span>
      </div>
    </div>
  </a>
  <a href="/producto/{p['slug']}/" class="btn-buy">
    Ver ficha y análisis →
  </a>
</article>"""


def catalog_product_card(p, *, show_price=True, show_commercial_signals=True):
    display_title = compact_product_title(p.get("title", ""), max_words=16)
    cat_slug = p.get("category_slug", "")
    cat_name = CATEGORIES.get(cat_slug, {}).get("name", "Producto")
    badge = (
        f'<span class="badge">-{p["discount"]}%</span>'
        if show_commercial_signals and p.get("discount", 0) >= 5
        else ""
    )
    original = (
        f'<span class="price-original">{p["price_original"]:.2f} €</span>'
        if show_price and p.get("price_original", 0) > p.get("price", 0)
        else ""
    )
    rating_label = str(p.get("rating", "")).replace(".0%", "%")
    signals = []
    if show_commercial_signals:
        if p.get("discount", 0) >= 20:
            signals.append(f'-{p["discount"]}%')
        if p.get("sales", 0) >= 300:
            signals.append(f'{p["sales"]} compras')
        elif p.get("sales", 0):
            signals.append(f'{p["sales"]} vendidos')
        if rating_label:
            signals.append(f'{rating_label} positivas')
    signal_html = "".join(f'<span class="card-signal">{item}</span>' for item in signals)
    meta_html = f"""<div class="card-meta-row">
      <span class="product-card-cat">{cat_name}</span>
    </div>"""
    if show_price:
        price_html = f"""<div class="card-price">
        {original}
        <span class="price-sale">{p['price']:.2f} €</span>
      </div>"""
    else:
        price_html = '<div class="card-price"><span class="price-note">Ficha editorial y contexto de uso</span></div>'
    signal_row = f'<div class="card-signal-row">{signal_html}</div>' if signal_html else ""
    return f"""<article class="product-card product-card-catalog">
  <a href="/producto/{p['slug']}/" class="card-link">
    <div class="card-img-wrap">
      <img src="{p['image']}" alt="{display_title}" loading="lazy" width="300" height="300">
      {badge}
    </div>
    <div class="card-body">
      {meta_html}
      <h3 class="card-title">{display_title}</h3>
      {signal_row}
      {price_html}
    </div>
  </a>
  <a href="/producto/{p['slug']}/" class="btn-buy">
    Ver ficha y análisis →
  </a>
</article>"""


def serialize_shop_products(products):
    serialized = []
    for p in products:
        cat_slug = p.get("category_slug", "")
        display_title = compact_product_title(p.get("title", ""), max_words=16)
        serialized.append({
            "title": display_title,
            "display_title": display_title,
            "slug": p.get("slug", ""),
            "category_slug": cat_slug,
            "category_name": CATEGORIES.get(cat_slug, {}).get("name", "Producto"),
            "price": p.get("price", 0),
            "price_original": p.get("price_original", 0),
            "discount": p.get("discount", 0),
            "sales": p.get("sales", 0),
            "rating": p.get("rating", ""),
            "image": p.get("image", ""),
        })
    return serialized


def faq_schema(faqs):
    items = ",\n".join(
        f'{{"@type":"Question","name":"{q}","acceptedAnswer":{{"@type":"Answer","text":"{a}"}}}}'
        for q, a in faqs
    )
    return f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{items}]}}
</script>"""


def faq_html(faqs):
    items = "\n".join(
        f"""<div class="faq-item">
  <button class="faq-q" aria-expanded="false">{q}</button>
  <div class="faq-a" hidden><p>{a}</p></div>
</div>"""
        for q, a in faqs
    )
    return f'<div class="faq-list">{items}</div>'


def guide_image_html(slug, class_name="guide-card-media", loading="lazy", tag="span"):
    image = GUIDE_IMAGES.get(slug)
    if not image:
        return ""
    return f"""<{tag} class="{class_name}">
  <img src="{image['src']}" alt="{image['alt']}" loading="{loading}" width="1600" height="900">
</{tag}>"""


def guide_card_html(g, full=False):
    meta = GUIDE_METADATA.get(g["slug"], {})
    level = meta.get("level", "Guía")
    card_class = "guide-card-full" if full else "guide-card"
    title_tag = "h2" if full else "h3"
    description = g["description"] if full else f"{g['description'][:100]}..."
    image_html = guide_image_html(g["slug"])
    return f"""<a href="/guia/{g['slug']}/" class="{card_class}">
  {image_html}
  <div class="guide-card-body">
    <span class="guide-badge">{level} · {g['reading_time']} min</span>
    <{title_tag} class="guide-card-title">{g['title']}</{title_tag}>
    <p class="guide-card-desc">{description}</p>
    <span class="guide-read-more">Leer guía →</span>
  </div>
  </a>"""


def guide_product_score(product):
    title = str(product.get("title", "") or "")
    normalized = "".join(
        ch for ch in unicodedata.normalize("NFKD", title.lower())
        if not unicodedata.combining(ch)
    )
    rules = CATEGORY_PRODUCT_RULES.get(product.get("category_slug", ""), {})
    sales = min(int(product.get("sales", 0) or 0), 1000)
    discount = int(product.get("discount", 0) or 0)
    rating_raw = str(product.get("rating", "") or "").replace("%", "").replace(",", ".")
    try:
        rating = float(rating_raw)
    except ValueError:
        rating = 0.0
    keyword_bonus = sum(220 for term in rules.get("preferred", []) if term in normalized)
    keyword_penalty = sum(280 for term in rules.get("blocked", []) if term in normalized)
    return sales * 0.12 + discount * 8 + rating + keyword_bonus - keyword_penalty


def pick_guide_products(products, categories, limit=4):
    selected = []
    used_slugs = set()
    pools = {}

    valid_categories = [slug for slug in categories if slug in CATEGORIES]
    for slug in valid_categories:
        pool = [p for p in products if p.get("category_slug") == slug]
        pools[slug] = sorted(pool, key=guide_product_score, reverse=True)

    while len(selected) < limit:
        added = False
        for slug in valid_categories:
            pool = pools.get(slug, [])
            while pool and pool[0]["slug"] in used_slugs:
                pool.pop(0)
            if not pool:
                continue
            product = pool.pop(0)
            selected.append(product)
            used_slugs.add(product["slug"])
            added = True
            if len(selected) >= limit:
                break
        if not added:
            break

    if len(selected) < limit:
        fallback = sorted(products, key=guide_product_score, reverse=True)
        for product in fallback:
            if product["slug"] in used_slugs:
                continue
            selected.append(product)
            used_slugs.add(product["slug"])
            if len(selected) >= limit:
                break

    return selected[:limit]


def guide_related_products_html(g, products):
    return ""


def planner_widget_html(context="page"):
    context_class = f" planner-shell-{context}" if context else ""
    return f"""<section class="planner-shell{context_class}" data-planner-root>
  <div class="planner-card">
    <div class="planner-copy">
      <p class="section-kicker">Herramienta AJSpinning</p>
      <h2>Planificador de spinning por especie, agua y luz</h2>
      <p>Selecciona una situación real y obtén una recomendación inicial sobre señuelo, capa de agua, color, ritmo de recogida y la siguiente lectura que te puede ayudar.</p>
    </div>
    <div class="planner-grid">
      <label class="planner-field">
        <span>Especie objetivo</span>
        <select data-planner-input="species">
          <option value="">Selecciona especie</option>
          <option value="lucio">Lucio</option>
          <option value="lucioperca">Lucioperca</option>
          <option value="perca">Perca</option>
          <option value="blackbass">Black bass</option>
          <option value="barbo">Barbo</option>
          <option value="lubina">Lubina</option>
          <option value="anjova">Anjova</option>
          <option value="palometon">Palometón</option>
          <option value="jurel">Jurel</option>
          <option value="caballa">Caballa</option>
          <option value="dorada">Dorada</option>
          <option value="trucha">Trucha</option>
          <option value="siluro">Siluro</option>
        </select>
      </label>
      <label class="planner-field">
        <span>Escenario</span>
        <select data-planner-input="scenario">
          <option value="">Selecciona escenario</option>
          <option value="embalse">Embalse</option>
          <option value="rio">Río</option>
          <option value="costa">Costa</option>
          <option value="desembocadura">Desembocadura</option>
        </select>
      </label>
      <label class="planner-field">
        <span>Estación</span>
        <select data-planner-input="season">
          <option value="">Selecciona estación</option>
          <option value="primavera">Primavera</option>
          <option value="verano">Verano</option>
          <option value="otono">Otoño</option>
          <option value="invierno">Invierno</option>
        </select>
      </label>
      <label class="planner-field">
        <span>Estado del agua</span>
        <select data-planner-input="clarity">
          <option value="">Selecciona claridad</option>
          <option value="clara">Clara</option>
          <option value="media">Con algo de color</option>
          <option value="turbia">Turbia</option>
        </select>
      </label>
      <label class="planner-field">
        <span>Momento del día</span>
        <select data-planner-input="light">
          <option value="">Selecciona luz</option>
          <option value="amanecer">Primeras / últimas luces</option>
          <option value="sol">Plena luz</option>
          <option value="nublado">Cielo cubierto</option>
          <option value="noche">Noche</option>
        </select>
      </label>
    </div>
    <div class="planner-actions">
      <button type="button" class="btn-primary" data-planner-submit>Ver recomendación</button>
      <button type="button" class="btn-secondary planner-reset" data-planner-reset>Reiniciar</button>
    </div>
  </div>
  <div class="planner-result" data-planner-result aria-live="polite">
    <div class="planner-result-empty">
      <p class="planner-result-kicker">Cómo usarla</p>
      <h3>Empieza por una situación real</h3>
      <p>Esta herramienta está pensada para convertir una duda rápida en una primera recomendación útil: por dónde empezar, en qué capa insistir y qué guía abrir después.</p>
      <ul class="mini-checklist">
        <li>Define especie y escenario antes de mirar productos.</li>
        <li>Usa la recomendación como punto de partida, no como una receta cerrada.</li>
        <li>Abre la guía relacionada para afinar la decisión y ajustar el equipo.</li>
      </ul>
    </div>
  </div>
</section>"""


def wait_game_widget_html(context="page"):
    context_class = f" wait-game-shell-{context}" if context else ""
    return f"""<section class="wait-game-shell{context_class}" data-fish-game-root>
  <div class="wait-game-card">
    <div class="wait-game-copy">
      <p class="section-kicker">Paciencia de orilla</p>
      <h2>Minijuego 1 · reflejos en la espera</h2>
      <p>Empieza la espera, mantente atento a la picada y recoge en el momento justo. Es una forma ligera de practicar paciencia y reflejos mientras descansas entre lecturas o decisiones de equipo.</p>
    </div>
    <div class="wait-game-stage">
      <div class="wait-game-water">
        <div class="wait-game-line"></div>
        <div class="wait-game-float" data-fish-game-float></div>
        <div class="wait-game-ripple" data-fish-game-ripple></div>
      </div>
      <div class="wait-game-bitebar" aria-hidden="true"><span data-fish-game-progress></span></div>
      <p class="wait-game-status" data-fish-game-status>Empieza la espera y mantén la calma hasta notar el toque.</p>
    </div>
    <div class="wait-game-actions">
      <button type="button" class="btn-primary" data-fish-game-cast>Empezar</button>
      <button type="button" class="btn-secondary" data-fish-game-hook disabled>Recoger</button>
    </div>
  </div>
  <aside class="wait-game-side">
    <div class="wait-game-scoreboard">
      <p class="wait-game-score-kicker">Marcador</p>
      <div class="wait-game-score-grid">
        <div class="wait-game-score-card"><strong data-fish-game-casts>0</strong><span>Intentos</span></div>
        <div class="wait-game-score-card"><strong data-fish-game-catches>0</strong><span>Capturas</span></div>
        <div class="wait-game-score-card"><strong data-fish-game-streak>0</strong><span>Racha</span></div>
        <div class="wait-game-score-card"><strong data-fish-game-best>--</strong><span>Mejor reacción</span></div>
      </div>
    </div>
  </aside>
</section>
<section class="mini-games-grid">
  <article class="mini-game-card pixel-fishing-card" data-pixel-fishing-root>
    <div class="mini-game-head">
      <p class="section-kicker">Minijuego 2</p>
      <h3>Aventura pixel de pesca</h3>
      <p>Explora un muelle estilo retro, lanza a zonas de agua activa y supera el combate vertical de captura tipo RPG de pesca.</p>
    </div>
    <div class="pixel-fishing-stage">
      <canvas class="pixel-fishing-canvas" data-pixel-fishing-canvas width="320" height="192" aria-label="Juego pixel de pesca en la orilla"></canvas>
      <aside class="pixel-fight-panel" data-pixel-fight-panel hidden>
        <p class="pixel-fight-title">Combate</p>
        <div class="pixel-fight-meter" data-pixel-fight-meter>
          <i class="pixel-fight-catchbar" data-pixel-fight-catchbar></i>
          <i class="pixel-fight-fish" data-pixel-fight-fish></i>
        </div>
        <div class="pixel-fight-progress">
          <i data-pixel-fight-progress></i>
        </div>
      </aside>
      <div class="pixel-catch-reveal" data-pixel-catch-reveal hidden>
        <button type="button" class="pixel-catch-close" data-pixel-catch-close aria-label="Cerrar captura">×</button>
        <canvas class="pixel-catch-sprite" data-pixel-catch-sprite width="96" height="56" aria-hidden="true"></canvas>
        <p class="pixel-catch-name" data-pixel-catch-name>Captura</p>
        <p class="pixel-catch-stars" data-pixel-catch-stars>★☆☆</p>
        <p class="pixel-catch-meta" data-pixel-catch-meta>--</p>
      </div>
      <div class="pixel-touch-hud" data-pixel-touch-hud>
        <button type="button" class="pixel-touch-btn pixel-touch-cast" data-pixel-touch-cast>Lanzar</button>
        <button type="button" class="pixel-touch-btn pixel-touch-hook" data-pixel-touch-hook disabled>Recoger</button>
      </div>
      <div class="pixel-joystick" data-pixel-joystick aria-label="Joystick táctil">
        <i class="pixel-joystick-knob" data-pixel-joystick-knob></i>
      </div>
      <div class="pixel-fishing-meters">
        <div class="pixel-meter">
          <span class="pixel-meter-label">Potencia de lance</span>
          <div class="pixel-meter-track"><i data-pixel-fishing-power></i></div>
        </div>
        <div class="pixel-meter">
          <span class="pixel-meter-label">Progreso de captura</span>
          <div class="pixel-meter-track"><i data-pixel-fishing-fight></i></div>
        </div>
      </div>
      <div class="pixel-fishing-help">
        <span>PC: WASD/Flechas · Espacio para cargar/lanzar</span>
        <span>Móvil: joystick para moverte + botones grandes de lanzar/recoger</span>
        <span>Combate: mantén Recoger para sostener la barra verde sobre el pez</span>
      </div>
      <p class="pixel-fishing-status" data-pixel-fishing-status>Camina hasta la orilla, mira al agua y lanza.</p>
    </div>
    <div class="mini-game-actions">
      <button type="button" class="btn-secondary" data-pixel-fishing-cast>Lanzar</button>
      <button type="button" class="btn-primary" data-pixel-fishing-hook disabled>Recoger</button>
    </div>
    <div class="pixel-fishing-pad" aria-label="Controles táctiles">
      <button type="button" class="pixel-pad-btn pixel-pad-up" data-pixel-move="up" aria-label="Mover arriba">↑</button>
      <button type="button" class="pixel-pad-btn pixel-pad-left" data-pixel-move="left" aria-label="Mover izquierda">←</button>
      <button type="button" class="pixel-pad-btn pixel-pad-right" data-pixel-move="right" aria-label="Mover derecha">→</button>
      <button type="button" class="pixel-pad-btn pixel-pad-down" data-pixel-move="down" aria-label="Mover abajo">↓</button>
    </div>
    <div class="mini-game-score-inline">
      <span><strong data-pixel-fishing-steps>0</strong> pasos</span>
      <span><strong data-pixel-fishing-casts>0</strong> lances</span>
      <span><strong data-pixel-fishing-catches>0</strong> capturas</span>
      <span><strong data-pixel-fishing-best>0</strong> mejor racha</span>
    </div>
    <p class="pixel-fishing-last" data-pixel-fishing-last>Última captura: todavía ninguna.</p>
    <p class="pixel-fishing-log" data-pixel-fishing-log>Colección: todavía vacía.</p>
  </article>
  <article class="mini-game-card" data-cast-game-root>
    <div class="mini-game-head">
      <p class="section-kicker">Minijuego 3</p>
      <h3>Lance preciso</h3>
      <p>Controla el timing y pulsa justo cuando el marcador entre en la ventana verde de impacto.</p>
    </div>
    <div class="cast-game-stage">
      <div class="cast-game-bar" aria-hidden="true">
        <div class="cast-game-target" data-cast-game-target></div>
        <div class="cast-game-marker" data-cast-game-marker></div>
      </div>
      <p class="cast-game-status" data-cast-game-status>Prepara el lance y busca la ventana óptima.</p>
    </div>
    <div class="mini-game-actions">
      <button type="button" class="btn-secondary" data-cast-game-start>Preparar lance</button>
      <button type="button" class="btn-primary" data-cast-game-cast disabled>Lanzar</button>
    </div>
    <div class="mini-game-score-inline mini-game-score-inline-3">
      <span><strong data-cast-game-attempts>0</strong> intentos</span>
      <span><strong data-cast-game-hits>0</strong> clavados</span>
      <span><strong data-cast-game-best>--</strong> mejor precisión</span>
    </div>
  </article>
</section>"""


def slugify_fragment(text):
    text = re.sub(r"<[^>]+>", "", text).strip().lower()
    text = text.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def inject_heading_ids(content):
    headings = []

    def repl(match):
        title = match.group(1)
        heading_id = slugify_fragment(title)
        headings.append((heading_id, re.sub(r"<[^>]+>", "", title)))
        return f'<h2 id="{heading_id}">{title}</h2>'

    enriched = re.sub(r"<h2>(.*?)</h2>", repl, content)
    return enriched, headings


def author_card_html():
    return f"""<div class="author-card">
  <p class="author-kicker">Equipo editorial</p>
  <h3>{EDITORIAL_TEAM['name']}</h3>
  <p>{EDITORIAL_TEAM['bio']}</p>
  <ul class="mini-checklist">
    <li>Contenido centrado en spinning y casting en España</li>
    <li>Selección con contexto de uso y transparencia en afiliación</li>
    <li>Actualización periódica y correcciones editoriales</li>
  </ul>
  <a href="/equipo-editorial/" class="text-link">Conocer el equipo</a>
  <a href="/metodologia/" class="text-link">Cómo trabajamos</a>
</div>"""


def toc_html(headings):
    if not headings:
        return ""
    links = "\n".join(f'<a href="#{hid}">{label}</a>' for hid, label in headings)
    return f"""<aside class="toc-card">
  <p class="toc-title">En esta guía</p>
  <nav class="toc-links">{links}</nav>
</aside>"""


def guide_promo_html(slug):
    meta = GUIDE_METADATA.get(slug, {})
    related_category = meta.get("related_category")
    if not related_category:
        return ""
    category = CATEGORIES.get(related_category, {})
    return f"""<div class="article-promo">
  <p class="article-promo-kicker">Siguiente paso</p>
  <h3>Lleva esta guía a la práctica</h3>
  <p>Después de leer esta explicación, explora la categoría de {category.get('name', 'material')} con contexto de compra y enlaces relacionados.</p>
  <div class="article-promo-actions">
    <a href="/categoria/{related_category}/" class="btn-primary">Ver {category.get('name', 'categoría')} →</a>
    <a href="/metodologia/" class="btn-secondary">Ver metodología</a>
  </div>
</div>"""


def category_intro_html(slug):
    hub = CATEGORY_HUBS.get(slug)
    if not hub:
        return ""
    checklist = "\n".join(f"<li>{item}</li>" for item in hub["checklist"])
    guide_slug = hub["guide_slug"]
    guide = next((g for g in GUIDES if g["slug"] == guide_slug), None)
    guide_link = ""
    if guide:
        guide_link = f'<a href="/guia/{guide_slug}/" class="btn-secondary">Leer guía recomendada</a>'
    return f"""<section class="category-intro container">
  <div class="category-intro-main">
    <p class="section-kicker">Compra con contexto</p>
    <h2>Qué debes revisar antes de elegir {CATEGORIES[slug]['name'].lower()}</h2>
    <p>{hub['summary']}</p>
    <ul class="mini-checklist">{checklist}</ul>
  </div>
  <div class="category-intro-side">
    <div class="info-card">
      <p class="info-card-kicker">Ruta recomendada</p>
      <h3>No empieces por el descuento</h3>
      <p>Primero entiende uso, talla y escenario. Después compara precio y ventas.</p>
      <div class="stack-actions">
        {guide_link}
        <a href="/metodologia/" class="text-link">Cómo seleccionamos</a>
      </div>
    </div>
  </div>
</section>"""


PRODUCT_TITLE_STOPWORDS = {
    "de", "la", "el", "los", "las", "y", "para", "con", "sin", "del", "al", "en", "por",
    "uds", "ud", "pieza", "piezas", "nuevo", "nueva", "mini", "pesca", "spinning",
    "cebo", "cebos", "aparejos", "accesorio", "accesorios", "artificial", "artificiales",
    "wobbler", "crankbait", "jerkbait", "swimbait", "señuelo", "señuelos", "anzuelo",
}

PRODUCT_TITLE_REPLACEMENTS = {
    r"\bca-a\b": "caña",
    r"\bca-as\b": "cañas",
    r"\bse-uelo\b": "señuelo",
    r"\bse-uelos\b": "señuelos",
    r"\bfundici-n\b": "fundición",
    r"\btelesc-pica\b": "telescópica",
    r"\bl-nea\b": "línea",
    r"\bpl-stico\b": "plástico",
    r"\bjap-n\b": "japón",
    r"\br-o\b": "río",
}


def normalize_product_title(title):
    text = re.sub(r"\s+", " ", title or "").strip(" ,.-")
    if not text:
        return ""
    text = re.sub(r"^[\\/|+]+", "", text).strip(" ,.-")
    for pattern, replacement in PRODUCT_TITLE_REPLACEMENTS.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    text = re.sub(r"^\d+\s*(uds?|unids?|piezas?)\b[,\s-]*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^[\\/|+]+", "", text).strip(" ,.-")
    text = re.sub(r"\s{2,}", " ", text).strip(" ,.-")
    return text


def compact_product_title(title, max_words=14):
    cleaned = normalize_product_title(title)
    if not cleaned:
        return "Producto de pesca spinning"
    tokens = cleaned.split()
    if len(tokens) <= max_words:
        return cleaned
    return " ".join(tokens[:max_words]).rstrip(" ,.-") + "…"


def product_keywords(title, limit=4):
    text = re.sub(r"[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]+", " ", (title or "").lower())
    keywords = []
    for token in text.split():
        if len(token) < 4:
            continue
        if token in PRODUCT_TITLE_STOPWORDS:
            continue
        if re.match(r"^\d+$", token):
            continue
        if re.match(r"^\d+(mm|cm|m|g|kg|ml)$", token):
            continue
        if token not in keywords:
            keywords.append(token)
        if len(keywords) == limit:
            break
    return keywords


def price_band_label(price):
    if price <= 8:
        return "entrada económica"
    if price <= 20:
        return "gama de acceso"
    if price <= 45:
        return "gama media"
    return "gama alta"


def product_editorial_blocks(p):
    cat_slug = p.get("category_slug", "")
    category_name = CATEGORIES.get(cat_slug, {}).get("name", "material de spinning")
    price = p.get("price", 0) or 0
    sales = p.get("sales", 0) or 0
    discount = p.get("discount", 0) or 0
    band = price_band_label(price)
    keywords = product_keywords(p.get("title", ""))

    by_category = {
        "senueulos": {
            "yes": [
                "Si quieres cubrir capas de agua concretas sin gastar demasiado.",
                "Si necesitas ampliar colores o tamaños en una caja ya montada.",
                "Si pescas escenarios cambiantes y te interesa probar perfiles distintos.",
            ],
            "no": [
                "Si buscas un único señuelo para todo: primero define especie y escenario.",
                "Si no tienes claro el peso de lance de tu caña actual.",
            ],
            "usage": "Funciona mejor cuando eliges tamaño y color por claridad del agua y momento de luz.",
        },
        "carretes": {
            "yes": [
                "Si necesitas equilibrar una caña ligera o media para jornadas largas.",
                "Si quieres un carrete de reserva para costa o embalse.",
                "Si estás empezando y priorizas coste controlado.",
            ],
            "no": [
                "Si pescas siempre en sal y no vas a hacer mantenimiento periódico.",
                "Si buscas máxima suavidad o precisión de freno de gama técnica.",
            ],
            "usage": "Encaja mejor con líneas y pesos acordes a su talla real, no por precio.",
        },
        "canas": {
            "yes": [
                "Si quieres una caña funcional para escenarios generales en España.",
                "Si necesitas una segunda caña para señuelos de otro rango de peso.",
                "Si priorizas versatilidad frente a especialización extrema.",
            ],
            "no": [
                "Si ya pescas técnica muy concreta y necesitas un blank muy específico.",
                "Si quieres máxima sensibilidad de competición con presupuesto bajo.",
            ],
            "usage": "Antes de comprar, cruza longitud, potencia y acción con tus señuelos reales.",
        },
        "combos": {
            "yes": [
                "Si quieres empezar rápido con equipo completo y compatible.",
                "Si buscas un conjunto de viaje o de respaldo para invitados.",
                "Si priorizas facilidad de uso frente a personalización por piezas.",
            ],
            "no": [
                "Si ya sabes exactamente qué caña y qué carrete quieres por separado.",
                "Si vas a pescar especies grandes con necesidades de potencia concretas.",
            ],
            "usage": "Son prácticos para empezar, pero conviene revisar bien potencia y talla de carrete.",
        },
        "hilos": {
            "yes": [
                "Si quieres ajustar diámetro y resistencia al escenario real.",
                "Si te interesa mejorar sensibilidad con inversión contenida.",
                "Si necesitas renovar línea principal y bajos para temporada.",
            ],
            "no": [
                "Si pescas entre mucha roca o estructura y quieres ir al límite de grosor.",
                "Si no tienes claro qué nudo usar con el diámetro elegido.",
            ],
            "usage": "La relación entre diámetro, resistencia y abrasión manda más que el precio unitario.",
        },
        "anzuelos": {
            "yes": [
                "Si quieres mejorar el ratio de clavada frente a anzuelos de serie.",
                "Si necesitas reponer triples y simples con tallas habituales.",
                "Si montas jigs o vinilos y buscas rotación económica.",
            ],
            "no": [
                "Si no conoces todavía la talla exacta que admite tu señuelo.",
                "Si priorizas pesca sin muerte y necesitas modelos concretos sin arpón.",
            ],
            "usage": "La talla y el grosor adecuados importan más que acumular unidades baratas.",
        },
        "accesorios": {
            "yes": [
                "Si quieres ordenar mejor la caja y perder menos tiempo en orilla.",
                "Si te faltan recambios básicos para no cortar una jornada.",
                "Si buscas soluciones simples de transporte o mantenimiento.",
            ],
            "no": [
                "Si esperas que un accesorio compense carencias de técnica o lectura del agua.",
                "Si ya tienes una organización de equipo estable y no necesitas duplicados.",
            ],
            "usage": "Estos productos mejoran logística y seguridad, pero no sustituyen criterio técnico.",
        },
    }
    profile = by_category.get(cat_slug, by_category["accesorios"])

    strengths = []
    cautions = []
    if discount >= 35:
        strengths.append(f"Descuento alto ({discount}%), útil para probar sin comprometer mucho presupuesto.")
    if sales >= 500:
        strengths.append(f"Volumen de ventas elevado ({sales}), señal de rotación y demanda sostenida.")
    if price <= 12:
        strengths.append("Precio de entrada bajo para cubrir huecos concretos del equipo.")
    if sales and sales < 80:
        cautions.append("Pocas compras acumuladas: conviene revisar variantes y fotos reales del vendedor.")
    if price >= 60:
        cautions.append("Ticket alto: compara garantía, repuestos y política de devolución antes de cerrar.")
    cautions.append("Verifica siempre talla, peso o medida exacta en la ficha de AliExpress antes de pagar.")
    if not strengths:
        strengths.append("Encaja como opción de rotación para ampliar equipo sin bloquear presupuesto.")

    keyword_line = ", ".join(keywords) if keywords else "spinning, costa, embalse, material"
    summary = (
        f"Este producto entra en {category_name.lower()} y está posicionado en {band}. "
        f"En AJSpinning lo tratamos como una opción para pescadores que quieren contexto antes de comprar: "
        f"primero escenario y especie, después material. Señales detectadas en la ficha del vendedor: {keyword_line}."
    )

    return {
        "summary": summary,
        "usage": profile["usage"],
        "yes": profile["yes"],
        "no": profile["no"],
        "strengths": strengths,
        "cautions": cautions,
    }


def product_context_html(p):
    cat_slug = p.get("category_slug", "")
    guide_slug = CATEGORY_HUBS.get(cat_slug, {}).get("guide_slug")
    guide = next((item for item in GUIDES if item["slug"] == guide_slug), None)
    checks = {
        "senueulos": [
            "Comprueba peso, longitud y profundidad de trabajo.",
            "Valora si los anzuelos de serie necesitan mejora.",
            "Piensa en claridad del agua y especie objetivo antes de comprar.",
        ],
        "carretes": [
            "Revisa talla, ratio y freno máximo declarados.",
            "Comprueba si encaja con el peso de tu caña y línea.",
            "Si pescas en sal, prioriza mantenimiento y protección anticorrosión.",
        ],
        "canas": [
            "Confirma potencia, acción y longitud reales.",
            "Piensa si necesitas portabilidad o mejor sensibilidad.",
            "No compres más caña de la que tus señuelos pueden mover.",
        ],
        "combos": [
            "Comprueba que caña y carrete estén equilibrados entre sí.",
            "Revisa longitud, potencia y talla del carrete antes de comprar.",
            "Es una buena opción si quieres empezar sin montar el equipo por piezas.",
        ],
        "hilos": [
            "Elige diámetro y resistencia según especie y escenario.",
            "Valora si necesitas trenzado, nylon o fluorocarbono.",
            "No sacrifiques demasiado diámetro si pescas entre obstáculos.",
        ],
        "anzuelos": [
            "Comprueba talla, grosor y compatibilidad con tu señuelo o montaje.",
            "Revisa si buscas triples, simples o jig heads.",
            "Prioriza afilado y resistencia antes que el precio más bajo.",
        ],
        "accesorios": [
            "Comprueba medidas, compatibilidades y capacidad útil.",
            "Piensa si resuelve una necesidad real de tu equipo.",
            "Prioriza orden, seguridad y durabilidad.",
        ],
    }
    notes = "\n".join(f"<li>{item}</li>" for item in checks.get(cat_slug, []))
    signals = []
    if p.get("sales", 0) >= 500:
        signals.append("Referencia con volumen alto de ventas")
    if p.get("discount", 0) >= 40:
        signals.append("Descuento llamativo, conviene revisar variantes")
    if p.get("price", 0) <= 10:
        signals.append("Producto orientado a presupuesto contenido")
    signal_html = "".join(f'<span class="review-chip">{item}</span>' for item in signals)
    guide_cta = ""
    if guide:
        guide_cta = f'<a href="/guia/{guide_slug}/" class="text-link">Lee antes la guía: {guide["title"]}</a>'

    return f"""<section class="product-context container">
  <div class="product-context-main">
    <p class="section-kicker">Compra informada</p>
    <h2>Qué revisar antes de elegir este producto</h2>
    <div class="review-chip-row">{signal_html}</div>
    <ul class="mini-checklist">{notes}</ul>
    <p class="product-context-note">Las páginas de producto están pensadas como apoyo a las guías y categorías. El precio, stock y variantes pueden cambiar directamente en AliExpress.</p>
    <p class="product-context-note">Revisión editorial humana: actualizamos señales de precio, descuento y ventas de forma periódica. Si detectas errores o cambios relevantes, puedes avisarnos en <a href="/contacto/">contacto</a>.</p>
  </div>
  <div class="product-context-side">
    <div class="info-card">
      <p class="info-card-kicker">Aprende primero</p>
      <h3>El producto importa menos que el contexto</h3>
      <p>Si todavía dudas sobre talla, acción, color o escenario, te conviene revisar una guía antes de comprar.</p>
      <div class="stack-actions">
        {guide_cta}
        <a href="/categoria/{cat_slug}/" class="text-link">Volver a la categoría</a>
      </div>
    </div>
  </div>
</section>"""


# ─── Generadores de páginas ───────────────────────────────────────────────────

def generate_category_page(slug, config, products):
    title       = f"{config['name_plural']} - Pesca Spinning | {SITE_NAME}"
    description = config["desc"][:155]
    canonical   = f"{BASE_URL}/categoria/{slug}/"
    count       = len(products)
    cards       = "\n".join(product_card(p) for p in products)
    content_data = CATEGORY_CONTENT.get(slug, {})
    intro_html = category_intro_html(slug)

    guide_html = ""
    if content_data.get("guide_body"):
        guide_html = f"""<section class="category-guide container">
  <h2>{content_data['guide_title']}</h2>
  <div class="guide-content">{content_data['guide_body']}</div>
</section>"""

    faqs = content_data.get("faq", [])
    faq_section = ""
    if faqs:
        faq_section = f"""<section class="faq-section container">
  <h2>Preguntas frecuentes sobre {config['name'].lower()}</h2>
  {faq_html(faqs)}
</section>
{faq_schema(faqs)}"""

    breadcrumb_schema = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"{config['name_plural']}","item":"{canonical}"}}
]}}</script>"""

    related_guides = [g for g in GUIDES if GUIDE_METADATA.get(g["slug"], {}).get("related_category") == slug][:3]
    guides_html = ""
    if related_guides:
        cards_html = "\n".join(guide_card_html(g) for g in related_guides)
        guides_html = f'<section class="related-guides container"><h2>Guías relacionadas</h2><div class="guide-grid">{cards_html}</div></section>'

    return f"""{head(title, description, canonical, breadcrumb_schema, robots=CATEGORY_ROBOTS, include_adsense=ADSENSE_ON_CATEGORY_PAGES)}
<body>
{nav()}
<main class="page-main">
  <div class="cat-hero">
    <div class="hero-inner">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Inicio</a> › <span>{config['name_plural']}</span>
      </nav>
      <span class="cat-icon">{config['icon']}</span>
      <h1>{config['h1']}</h1>
      <p class="cat-desc">{config['desc']}</p>
      <span class="product-count">{count} productos seleccionados</span>
    </div>
  </div>
  {intro_html}
  {guide_html}
  <section class="product-grid-section container">
    <div class="grid-toolbar">
      <span class="results-label">{count} resultados</span>
      <select class="sort-select" id="sortSelect">
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="discount">Mayor descuento</option>
        <option value="sales">Más vendidos</option>
      </select>
    </div>
    <div class="product-grid" id="productGrid">
      {cards}
    </div>
  </section>
{guides_html}
  {faq_section}
</main>
{footer()}
<script>window.CATEGORY_PRODUCTS = {json.dumps(serialize_shop_products(products), ensure_ascii=False)};</script>
</body>
</html>"""


def generate_shop_page(products):
    canonical = f"{BASE_URL}{SHOP_URL}"
    description = "Tienda de pesca spinning online con filtros por categoría, precio y descuento. Compara cañas, carretes y señuelos con contexto editorial antes de comprar."
    og_image = f"{BASE_URL}/assets/img/editorial/checklist-salida-spinning-equipo.webp"
    sorted_products = sorted(
        products,
        key=lambda p: ((p.get("sales") or 0), (p.get("discount") or 0), -(p.get("price") or 0)),
        reverse=True,
    )
    category_counts = {slug: 0 for slug in CATEGORIES}
    for product in products:
        cat_slug = product.get("category_slug")
        if cat_slug in category_counts:
            category_counts[cat_slug] += 1

    total_products = len(products)
    category_total = sum(1 for count in category_counts.values() if count)
    popular_total = sum(1 for p in products if (p.get("sales") or 0) >= 300)
    discount_total = sum(1 for p in products if (p.get("discount") or 0) >= 20)
    max_price = max(25, int(max((p.get("price") or 0) for p in products) + 1))
    cards = "\n".join(catalog_product_card(p) for p in sorted_products)
    category_options = "\n".join(
        f'<option value="{slug}">{cfg["name"]} ({category_counts.get(slug, 0)})</option>'
        for slug, cfg in CATEGORIES.items()
        if category_counts.get(slug, 0)
    )
    quick_links = "\n".join(
        f'<a href="{SHOP_URL}?categoria={slug}" class="shop-category-chip">{cfg["name"]}</a>'
        for slug, cfg in CATEGORIES.items()
        if category_counts.get(slug, 0)
    )
    schema = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"CollectionPage","name":"Tienda de Pesca Spinning | {SITE_NAME}","url":"{canonical}","description":"{description}"}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"Productos","item":"{canonical}"}}
]}}</script>"""

    return f"""{head(f"Tienda de Pesca Spinning Online | {SITE_NAME}", description, canonical, schema, robots=SHOP_ROBOTS, og_image=og_image, include_adsense=ADSENSE_ON_SHOP_PAGE)}
<body>
{nav()}
<main class="page-main">
  <section class="shop-hero">
    <div class="container shop-hero-layout">
      <div class="shop-hero-copy">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Inicio</a> › <span>Productos</span>
        </nav>
        <p class="section-kicker">Tienda AJSpinning</p>
        <h1>Tienda de pesca spinning con filtros útiles</h1>
        <p class="shop-intro">Busca por nombre, filtra por categoría y precio, y entra en cada ficha para ver análisis editorial antes de ir a la tienda externa.</p>
        <div class="shop-hero-stats">
          <div class="shop-stat">
            <strong>{total_products}</strong>
            <span>productos activos</span>
          </div>
          <div class="shop-stat">
            <strong>{category_total}</strong>
            <span>familias de material</span>
          </div>
          <div class="shop-stat">
            <strong>{discount_total}</strong>
            <span>ofertas del 20%+</span>
          </div>
        </div>
        <div class="shop-category-shortcuts">
          {quick_links}
        </div>
      </div>
      <div class="shop-hero-visual">
        <img src="/assets/img/editorial/checklist-salida-spinning-equipo.webp" alt="Equipo de spinning organizado sobre una mesa para comparar productos con criterio" loading="eager" width="1600" height="900">
        <div class="shop-hero-badge">
          <strong>{popular_total} productos con tracción real</strong>
          <span>Material con 300 o más compras para separar mejor lo experimental de lo que ya rueda.</span>
        </div>
      </div>
    </div>
  </section>

  <section class="shop-page">
    <div class="container shop-shell" data-shop-root>
      <aside class="shop-sidebar">
        <div class="shop-filter-card">
          <p class="section-kicker">Buscar y filtrar</p>
          <h2>Encuentra el producto que encaja contigo</h2>
          <div class="shop-filter-grid">
            <label class="shop-field shop-field-search">
              <span>Buscar producto</span>
              <input type="search" id="shopSearch" placeholder="Ej. minnow, carrete 2500, fluorocarbono">
            </label>
            <label class="shop-field">
              <span>Categoría</span>
              <select id="shopCategory">
                <option value="">Todas las categorías</option>
                {category_options}
              </select>
            </label>
            <label class="shop-field">
              <span>Ordenar por</span>
              <select id="shopSort">
                <option value="featured">Destacados</option>
                <option value="sales">Más vendidos</option>
                <option value="discount">Mayor descuento</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </label>
            <div class="shop-range-block">
              <div class="shop-range-head">
                <span>Precio máximo</span>
                <strong id="shopPriceValue">{max_price} €</strong>
              </div>
              <input type="range" min="0" max="{max_price}" value="{max_price}" step="1" id="shopPrice" class="shop-range">
            </div>
            <label class="shop-field">
              <span>Descuento mínimo</span>
              <select id="shopDiscount">
                <option value="0">Sin mínimo</option>
                <option value="10">10% o más</option>
                <option value="20">20% o más</option>
                <option value="40">40% o más</option>
              </select>
            </label>
            <label class="shop-check">
              <input type="checkbox" id="shopPopular">
              <span>Solo productos con 300+ compras</span>
            </label>
            <button type="button" class="btn-secondary shop-reset-btn" id="shopReset">Limpiar filtros</button>
          </div>
        </div>
        <div class="info-card">
          <p class="info-card-kicker">Compra con contexto</p>
          <h3>Filtra como en una tienda, decide como una guía</h3>
          <p>La compra no empieza en el botón: empieza en el contexto. Por eso cada producto tiene una ficha con señales, límites y escenarios recomendados.</p>
          <div class="stack-actions">
            <a href="{INTERACTIVE_GUIDE_URL}" class="btn-primary">Abrir guía interactiva</a>
            <a href="/guia/" class="text-link">Explorar guías largas</a>
          </div>
        </div>
      </aside>

      <div class="shop-main">
        <div class="shop-results-head">
          <div>
            <p class="section-kicker">Catálogo comparativo</p>
            <h2 class="section-title">Todo el material en una sola vista</h2>
            <p class="section-subtitle">Busca por nombre, filtra por categoría y limpia ruido por precio, descuento o volumen de compras. Después abre la ficha para ver el análisis.</p>
          </div>
          <div class="shop-results-meta">
            <strong id="shopResultsCount">{total_products}</strong>
            <span>productos visibles</span>
          </div>
        </div>
        <div class="shop-active-filters" id="shopActiveFilters" hidden></div>
        <div class="product-grid shop-product-grid" id="shopGrid">
          {cards}
        </div>
        <div class="shop-empty" id="shopEmpty" hidden>
          <p class="section-kicker">Sin coincidencias</p>
          <h3>No hay productos con esos filtros</h3>
          <p>Prueba a ampliar el precio máximo, quitar el descuento mínimo o volver a “todas las categorías”.</p>
        </div>
      </div>
    </div>
  </section>
  <section class="container" style="padding:0 24px 56px;">
    <div class="info-card">
      <p class="section-kicker">Cómo usar esta tienda</p>
      <h2>Tienda de pesca con enfoque editorial, no solo catálogo</h2>
      <p>Si has llegado buscando una tienda de pesca, la diferencia de AJSpinning es el método: primero escenario y especie, después equipo. Así evitas comprar por precio y eliges con más sentido. Para la mayoría de pescadores, el orden correcto es decidir dónde vas a pescar (río, embalse, costa), qué especie priorizas y qué nivel técnico tienes. Solo entonces tiene sentido filtrar cañas, carretes, señuelos y líneas.</p>
      <p>En esta página puedes filtrar como en una tienda online clásica, pero cada producto lleva a una ficha con contexto de uso y límites. Es la manera más práctica de separar una compra útil de una compra impulsiva. Si quieres profundizar antes de filtrar, te recomendamos abrir <a href="/guia/cana-de-spinning-como-elegir/" style="color:var(--c-primary)">cómo elegir caña de spinning</a>, <a href="/guia/como-elegir-carrete-spinning/" style="color:var(--c-primary)">cómo elegir carrete spinning</a> y <a href="/guia/como-elegir-senuelo-segun-agua-y-clima/" style="color:var(--c-primary)">cómo elegir señuelo según agua y clima</a>.</p>
      <p>Si prefieres una visión rápida por familia, entra directamente en <a href="/categoria/canas/" style="color:var(--c-primary)">cañas</a>, <a href="/categoria/carretes/" style="color:var(--c-primary)">carretes</a>, <a href="/categoria/senuelos/" style="color:var(--c-primary)">señuelos</a> o <a href="/categoria/hilos/" style="color:var(--c-primary)">líneas de pesca</a>. Y si todavía no tienes claro por dónde empezar, utiliza la <a href="/guia-interactiva/" style="color:var(--c-primary)">guía interactiva</a> para convertir tu situación de pesca en una primera recomendación concreta.</p>
    </div>
  </section>
</main>
{footer()}
<script>
window.SHOP_PRODUCTS = {json.dumps(serialize_shop_products(sorted_products), ensure_ascii=False)};
window.SHOP_DEFAULTS = {json.dumps({"maxPrice": max_price, "popularSales": 300}, ensure_ascii=False)};
</script>
</body>
</html>"""


def generate_product_page(p, related):
    display_title = compact_product_title(p.get("title", ""), max_words=18)
    title       = f"{display_title[:60]} | {SITE_NAME}"
    description = f"Análisis editorial de {display_title[:70]}: contexto de uso, para quién encaja, límites y compra externa en AliExpress."
    canonical   = f"{BASE_URL}/producto/{p['slug']}/"
    cat_slug    = p.get("category_slug", "")
    cat_cfg     = CATEGORIES.get(cat_slug, {})
    cat_name    = cat_cfg.get("name", "Pesca")

    original_html = ""
    if p.get("price_original", 0) > p.get("price", 0):
        saved = p["price_original"] - p["price"]
        original_html = f"""<span class="price-original-big">{p["price_original"]:.2f} €</span>
        <span class="saving">Ahorras {saved:.2f} € ({p["discount"]}%)</span>"""

    schema = f"""<script type="application/ld+json">
{{
  "@context":"https://schema.org",
  "@type":"Product",
  "name":"{display_title.replace('"', '&quot;')}",
  "image":"{p['image']}",
  "description":"{description}",
  "offers":{{
    "@type":"Offer",
    "priceCurrency":"EUR",
    "price":"{p['price']:.2f}",
    "availability":"https://schema.org/InStock",
    "url":"{canonical}",
    "seller":{{"@type":"Organization","name":"AliExpress"}}
  }},
  "aggregateRating":{{
    "@type":"AggregateRating",
    "ratingValue":"4.5",
    "reviewCount":"{p.get('sales',10)}"
  }}
}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"{cat_name}","item":"{BASE_URL}/categoria/{cat_slug}/"}},
  {{"@type":"ListItem","position":3,"name":"{display_title[:40]}","item":"{canonical}"}}
]}}</script>"""

    tips_by_cat = {
        "senueulos": [
            "Prueba distintas velocidades de recuperación hasta encontrar la que provoca ataques.",
            "Las pausas son claves: la mayoría de picadas ocurren cuando el señuelo está parado.",
            "En agua clara usa colores naturales; en agua turbia, colores vivos.",
            "Considera cambiar los anzuelos de fábrica por unos de mayor calidad (Owner, VMC).",
        ],
        "carretes": [
            "Enjuaga el carrete con agua dulce después de pescar en el mar.",
            "Lubrica el eje del carrete al inicio de cada temporada.",
            "Ajusta el freno a la resistencia del hilo, no a la fuerza del pez.",
            "Llena la bobina hasta 2-3 mm del borde para evitar vueltas falsas.",
        ],
        "canas": [
            "Guarda la caña en su funda para evitar arañazos en los anillos.",
            "Revisa los anillos antes de cada salida: un anillo dañado puede cortar el hilo.",
            "Monta el carrete antes de ir al río para asegurarte de que todo está correcto.",
            "Para distancias largas, una caña más larga (2,70 m+) marca la diferencia.",
        ],
        "accesorios": [
            "Mantén los giratorios y mosquetones engrasados para evitar la corrosión.",
            "Organiza tu caja de señuelos por tipo para encontrar rápido lo que necesitas.",
            "Lleva siempre un surtido de mosquetones y giratorios de recambio.",
            "Los alicates son imprescindibles para desclavar anzuelos de forma segura.",
        ],
        "ropa": [
            "Las gafas polarizadas son más útiles que cualquier otro accesorio de vestuario.",
            "Usa siempre protector solar, incluso en días nublados.",
            "Los colores discretos (verde, azul, marrón) alertan menos a los peces.",
            "Un buff o cuello protege del sol y del viento durante jornadas largas.",
        ],
    }
    tips = tips_by_cat.get(cat_slug, ["Revisa siempre el equipo antes de salir a pescar.", "La constancia y la observación son las claves para mejorar."])
    tips_html = "\n".join(f"<li>{t}</li>" for t in tips)
    editorial = product_editorial_blocks(p)
    yes_html = "\n".join(f"<li>{item}</li>" for item in editorial["yes"])
    no_html = "\n".join(f"<li>{item}</li>" for item in editorial["no"])
    strengths_html = "\n".join(f"<li>{item}</li>" for item in editorial["strengths"])
    cautions_html = "\n".join(f"<li>{item}</li>" for item in editorial["cautions"])
    reviewed_on = TODAY

    related_cards = "\n".join(product_card(r) for r in related[:4]) if related else ""
    related_section = f"""<section class="related-products container">
  <h2>También te puede interesar</h2>
  <div class="product-grid">{related_cards}</div>
</section>""" if related_cards else ""
    context_html = product_context_html(p)

    return f"""{head(title, description, canonical, schema, og_type="product", robots=PRODUCT_ROBOTS, include_adsense=False)}
<body>
{nav()}
<main class="page-main">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Inicio</a> ›
      <a href="/categoria/{cat_slug}/">{cat_name}</a> ›
      <span>{display_title[:45]}...</span>
    </nav>
    <article class="product-detail">
      <div class="product-gallery">
        <img src="{p['image']}" alt="{display_title}" class="main-img" width="500" height="500">
        {'<div class="badge-big">-' + str(p["discount"]) + '% descuento</div>' if p.get("discount",0) >= 5 else ""}
      </div>
      <div class="product-info">
        <p class="product-cat-tag"><a href="/categoria/{cat_slug}/">{cat_name}</a></p>
        <h1 class="product-title">{display_title}</h1>
        <div class="product-pricing">
          <span class="price-big">{p['price']:.2f} €</span>
          {original_html}
        </div>
        <div class="product-meta">
          {'<span class="meta-sales">🛒 ' + str(p.get("sales", 0)) + ' comprados</span>' if p.get("sales") else ""}
          {'<span class="meta-rating">⭐ ' + str(p.get("rating", "")) + '</span>' if p.get("rating") else ""}
          <span class="meta-ship">🚚 Envío gratis a España</span>
        </div>
        <a href="{outbound_path(p['slug'])}" class="btn-buy-big" target="_blank" rel="nofollow noopener sponsored">
          🛒 Comprar en AliExpress
        </a>
        <p class="affiliate-notice">
          Al hacer clic serás redirigido a AliExpress. AJSpinning recibe una comisión sin coste adicional para ti.
        </p>
        <div class="product-analysis">
          <h3>Análisis editorial AJSpinning</h3>
          <p>{editorial['summary']}</p>
          <p>{editorial['usage']}</p>
          <p class="product-analysis-meta">Revisado por {EDITORIAL_TEAM['name']} · {reviewed_on}</p>
        </div>
        <div class="product-fit-grid">
          <div class="product-fit-card">
            <h3>Para quién sí</h3>
            <ul>{yes_html}</ul>
          </div>
          <div class="product-fit-card">
            <h3>Cuándo no es la mejor opción</h3>
            <ul>{no_html}</ul>
          </div>
        </div>
        <div class="product-fit-grid">
          <div class="product-fit-card">
            <h3>Señales positivas de la ficha</h3>
            <ul>{strengths_html}</ul>
          </div>
          <div class="product-fit-card">
            <h3>Puntos a comprobar antes de pagar</h3>
            <ul>{cautions_html}</ul>
          </div>
        </div>
        <div class="product-tips">
          <h3>Consejos de uso en el agua</h3>
          <ul>{tips_html}</ul>
        </div>
      </div>
    </article>
  </div>
  {context_html}
  {related_section}
</main>
{footer()}
</body>
</html>"""


def generate_guide_page(g, products):
    canonical = f"{BASE_URL}/guia/{g['slug']}/"
    meta = GUIDE_METADATA.get(g["slug"], {})
    image = GUIDE_IMAGES.get(g["slug"])
    og_image = f"{BASE_URL}{image['src']}" if image else ""
    cover_html = guide_image_html(g["slug"], class_name="article-cover", loading="eager", tag="figure")
    guide_content, headings = inject_heading_ids(g["content"])
    faq_items = meta.get("faq", [])
    faq_block = ""
    if faq_items:
        faq_block = f"""<section class="faq-section">
  <h2>Preguntas frecuentes</h2>
  {faq_html(faq_items)}
</section>"""

    schema = f"""<script type="application/ld+json">
{{
  "@context":"https://schema.org",
  "@type":"Article",
  "headline":"{g['title']}",
  "description":"{g['description']}",
  "datePublished":"{g['date']}",
  "dateModified":"{TODAY}",
  "author":{{"@type":"Organization","name":"{EDITORIAL_TEAM['name']}"}},
  "publisher":{{"@type":"Organization","name":"{SITE_NAME}","url":"{BASE_URL}"}},
  "mainEntityOfPage":"{canonical}"{',' if og_image else ''}
  {"\"image\":\"" + og_image + "\"" if og_image else ""}
}}
</script>
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"Guías","item":"{BASE_URL}/guia/"}},
  {{"@type":"ListItem","position":3,"name":"{g['title'][:40]}","item":"{canonical}"}}
]}}</script>"""
    if faq_items:
        schema += "\n" + faq_schema(faq_items)

    other_guides = [og for og in GUIDES if og["slug"] != g["slug"]][:3]
    other_html = "\n".join(guide_card_html(og) for og in other_guides)
    toc = toc_html(headings)
    promo = guide_promo_html(g["slug"])
    related_products = guide_related_products_html(g, products)
    level = meta.get("level", "Guía")
    focus = meta.get("focus", "Spinning en España")

    return f"""{head(g['title'], g['description'], canonical, schema, og_type="article", og_image=og_image)}
<body>
{nav()}
<main class="page-main">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Inicio</a> › <a href="/guia/">Guías</a> › <span>{g['title'][:40]}...</span>
    </nav>
    <article class="article-page">
      <header class="article-header">
        <span class="guide-badge">{level} · Guía de pesca</span>
        <h1>{g['title']}</h1>
        <div class="article-meta">
          <span>📅 {g['date']}</span>
          <span>🔄 Actualizado: {TODAY}</span>
          <span>🕐 {g['reading_time']} min de lectura</span>
        </div>
        <div class="article-tags">
          <span class="article-tag">{meta.get('cluster', 'Guía')}</span>
          <span class="article-tag">{focus}</span>
        </div>
        <p class="article-intro">{g['description']}</p>
        {cover_html}
      </header>
      <div class="article-layout">
        <div class="article-main">
          <div class="article-body">
            {guide_content}
          </div>
          {related_products}
          {promo}
          {faq_block}
        </div>
        <div class="article-side">
          {toc}
          {author_card_html()}
        </div>
      </div>
    </article>
    <section class="related-guides">
      <h2>Más guías de pesca spinning</h2>
      <div class="guide-grid">{other_html}</div>
    </section>
  </div>
</main>
{footer()}
</body>
</html>"""


def generate_guides_index():
    canonical = f"{BASE_URL}/guia/"
    description = "Guías completas de pesca spinning y casting para España: técnicas, señuelos, carretes, cañas y todo lo que necesitas saber para pescar mejor."
    schema = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"Guías","item":"{canonical}"}}
]}}</script>"""

    featured_slugs = [
        "spinning-para-principiantes",
        "cana-de-spinning-como-elegir",
        "como-elegir-carrete-spinning",
        "senuelos-para-trucha-spinning",
        "licencias-pesca-espana",
        "especies-spinning-espana",
        "peces-spinning-agua-dulce-espana",
        "peces-spinning-mar-espana"
    ]
    guide_by_slug = {g["slug"]: g for g in GUIDES}
    featured_guides = [guide_by_slug[slug] for slug in featured_slugs if slug in guide_by_slug]
    featured_cards = "\n".join(guide_card_html(g) for g in featured_guides)

    cards = "\n".join(guide_card_html(g, full=True) for g in GUIDES)

    return f"""{head(f"Guías de Pesca Spinning | {SITE_NAME}", description, canonical, schema)}
<body>
{nav()}
<main class="page-main">
  <div class="cat-hero">
    <div class="hero-inner">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Inicio</a> › <span>Guías</span>
      </nav>
      <span class="cat-icon">📖</span>
      <h1>Guías de Pesca Spinning</h1>
      <p class="cat-desc">Técnica, material y escenarios para pescar mejor en España, sin rodeos y con enfoque práctico.</p>
    </div>
  </div>
    <section class="container" style="padding:36px 24px 12px;">
      <div class="section-heading">
        <p class="section-kicker">Empieza aquí</p>
        <h2 class="section-title">Las guías más útiles para empezar y mejorar</h2>
        <p class="section-subtitle">Una selección corta para entender el material, evitar errores comunes y pescar con más criterio.</p>
      </div>
      <div class="guide-grid">{featured_cards}</div>
    </section>
    <section class="container" style="padding:8px 24px 12px;">
      <div class="planner-promo">
        <div class="planner-promo-copy">
          <p class="section-kicker">Herramienta AJSpinning</p>
          <h2>Usa la guía interactiva antes de mirar producto</h2>
          <p>Selecciona especie, escenario, estación, estado del agua y momento del día para obtener una recomendación inicial con técnica, categoría y lectura sugerida.</p>
        </div>
        <div class="stack-actions">
          <a href="{INTERACTIVE_GUIDE_URL}" class="btn-primary">Abrir guía interactiva</a>
          <a href="/empieza-aqui/" class="text-link">Ver ruta recomendada</a>
        </div>
      </div>
    </section>
    <section class="category-intro container">
      <div class="category-intro-main">
        <p class="section-kicker">Qué vas a encontrar</p>
        <h2>Contenido práctico sobre técnica, material y temporadas</h2>
        <p>Estas guías resuelven dudas reales de pescadores que empiezan o quieren afinar mejor equipo y técnica. El objetivo es que encuentres rápido qué leer según tu nivel y tu escenario.</p>
      <ul class="mini-checklist">
        <li>Primeros pasos y errores habituales al empezar</li>
        <li>Cómo elegir señuelos, carretes y cañas con criterio</li>
        <li>Especies, escenarios y calendario de actividad en España</li>
      </ul>
    </div>
    <div class="category-intro-side">
      <div class="info-card">
        <p class="info-card-kicker">Ruta recomendada</p>
        <h3>Si llegas por primera vez, empieza por lo básico</h3>
        <p>Primero revisa la guía de iniciación, después los errores comunes y luego entra en material o especies según lo que necesites.</p>
        <div class="stack-actions">
          <a href="/empieza-aqui/" class="btn-secondary">Ver empieza aquí</a>
          <a href="/metodologia/" class="text-link">Ver metodología</a>
        </div>
      </div>
    </div>
  </section>
  <section class="container" style="padding:16px 20px 60px">
    <div class="section-heading">
      <p class="section-kicker">Biblioteca completa</p>
      <h2 class="section-title">Todas las guías</h2>
      <p class="section-subtitle">Todas las guías principales de AJSpinning en una sola vista.</p>
    </div>
    <div class="guide-grid-full">{cards}</div>
  </section>
</main>
{footer()}
</body>
</html>"""


def generate_static_page(page):
    canonical = f"{BASE_URL}/{page['slug']}/"
    schema = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Inicio","item":"{BASE_URL}/"}},
  {{"@type":"ListItem","position":2,"name":"{page['h1']}","item":"{canonical}"}}
]}}</script>"""
    helper_map = {
        "sobre-nosotros": ("Confianza", "Conoce también nuestra metodología y política editorial para entender cómo trabajamos el contenido y la afiliación."),
        "pesca-spinning": ("Guía base", "Esta página resume la base del spinning en España y te conecta con las guías de equipo, especies y escenarios."),
        "tienda-de-pesca": ("Compra con criterio", "Antes de filtrar productos, revisa especie, escenario y nivel para que la compra sea más corta y coherente."),
        "equipo-editorial": ("Autoría", "Explicamos quién firma AJSpinning y cómo mantenemos una revisión útil y coherente para pescadores en España."),
        "compromiso-calidad": ("Calidad editorial", "Detallamos cómo validamos guías, corregimos errores y mantenemos contenido útil a lo largo del tiempo."),
        "empieza-aqui": ("Ruta recomendada", "Si llegas por primera vez, usa esta página como mapa y apóyate en las guías base antes de ir a productos concretos."),
        "mapa-web": ("Navegación", "Una vista rápida de contenidos para localizar guías, páginas legales y recursos de confianza sin perder contexto."),
        "metodologia": ("Cómo trabajamos", "Explicamos qué revisamos, qué límites tenemos y cómo intentamos aportar valor más allá del enlace de compra."),
        "politica-editorial": ("Transparencia", "La utilidad para el usuario está por delante de la monetización y de cualquier incentivo comercial puntual."),
        "politica-afiliacion": ("Afiliación transparente", "Explicamos cuándo enlazamos productos, qué límites aplicamos y cómo separar contenido útil de interés comercial."),
        "contacto": ("Respuesta", "Los mensajes sobre correcciones, errores o mejoras de contenido tienen prioridad porque ayudan a mejorar la web para todos."),
        "condiciones-uso": ("Uso responsable", "Estas condiciones resumen cómo usar AJSpinning, qué límites tiene el contenido y cómo se aplica la responsabilidad del usuario."),
    }
    helper_title, helper_text = helper_map.get(page["slug"], ("Información", "Consulta también nuestras páginas de confianza y contacto para entender el proyecto."))
    page_classes = ["container", "static-page"]
    layout_classes = ["static-layout"]
    side_classes = ["static-side"]
    show_helper = page["slug"] not in {INTERACTIVE_GUIDE_SLUG, MINIGAME_SLUG}
    if page["slug"] == INTERACTIVE_GUIDE_SLUG:
        page_classes.append("static-page-tool")
        layout_classes.append("static-layout-tool")
        side_classes.append("static-side-tool")
    if page["slug"] == MINIGAME_SLUG:
        page_classes.append("static-page-tool")
        layout_classes.append("static-layout-tool")
        side_classes.append("static-side-tool")
    processed_content = (
        page["content"]
        .replace("{{planner_widget}}", planner_widget_html("page"))
        .replace("{{wait_game_widget}}", wait_game_widget_html("page"))
    )

    page_robots = page.get("robots", DEFAULT_ROBOTS).lower()
    include_adsense = not page_robots.startswith("noindex")
    return f"""{head(page['title'], page['description'], canonical, schema, robots=page.get('robots', DEFAULT_ROBOTS), extra_head=page.get('extra_head', ''), include_adsense=include_adsense)}
<body>
{nav()}
<main class="page-main">
  <div class="{' '.join(page_classes)}">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Inicio</a> › <span>{page['h1']}</span>
    </nav>
    <header class="static-header">
      <p class="section-kicker">AJSpinning</p>
      <h1>{page['h1']}</h1>
      <p class="static-intro">{page['description']}</p>
      <p class="article-meta"><span>🔄 Actualizado: {TODAY}</span></p>
      </header>
      <div class="{' '.join(layout_classes)}">
        <div class="static-content">
          {processed_content}
        </div>
        {f'''<aside class="{' '.join(side_classes)}">
        <div class="info-card">
          <p class="info-card-kicker">{helper_title}</p>
          <h3>Información útil</h3>
          <p>{helper_text}</p>
          <div class="stack-actions">
            <a href="/guia/" class="text-link">Explorar guías</a>
            <a href="/metodologia/" class="text-link">Ver metodología</a>
            <a href="/contacto/" class="text-link">Contactar</a>
          </div>
        </div>
      </aside>''' if show_helper else ''}
    </div>
  </div>
</main>
{footer()}
</body>
</html>"""


def generate_outbound_page(product):
    slug = product.get("slug", "")
    destination = product.get("url", "").strip()
    display_title = compact_product_title(product.get("title", ""), max_words=14)
    canonical = f"{BASE_URL}{outbound_path(slug)}"
    escaped_destination = destination.replace('"', "&quot;")

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url={escaped_destination}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow,max-image-preview:large">
  <title>Redirigiendo a AliExpress | AJSpinning</title>
  <meta name="description" content="Redirección de compra externa desde AJSpinning hacia AliExpress.">
  <link rel="canonical" href="{canonical}">
  <style>
    body {{
      margin: 0;
      font-family: 'Manrope', sans-serif;
      background: #f5f8fc;
      color: #0b1f3a;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }}
    .out-card {{
      max-width: 620px;
      width: 100%;
      background: #fff;
      border: 1px solid #d7e2ef;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 10px 24px rgba(5, 26, 53, 0.08);
    }}
    h1 {{
      margin: 0 0 10px;
      font-size: 1.35rem;
      line-height: 1.2;
    }}
    p {{
      margin: 0 0 12px;
      line-height: 1.65;
      color: #29405e;
    }}
    a {{
      color: #0f6ea7;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <main class="out-card">
    <h1>Te estamos redirigiendo a AliExpress</h1>
    <p><strong>Producto:</strong> {display_title}</p>
    <p>Si no se abre automáticamente, puedes continuar desde este enlace:</p>
    <p><a href="{escaped_destination}" rel="nofollow noopener sponsored">Abrir producto en AliExpress</a></p>
    <p><a href="/contacto/">¿Enlace roto o producto caído? Avísanos aquí</a>.</p>
  </main>
</body>
</html>"""


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 50)
    print("AJSpinning - Generador de paginas SEO")
    print("=" * 50)

    locked_visible_html = load_locked_visible_html()

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    products = data.get("products", [])
    print(f"{len(products)} productos cargados\n")

    by_cat = {slug: [] for slug in CATEGORIES}
    for p in products:
        cat = p.get("category_slug")
        if cat in by_cat:
            by_cat[cat].append(p)

    all_urls = [BASE_URL + "/"]
    pages = 0

    # Páginas de categoría
    CAT_DIR.mkdir(parents=True, exist_ok=True)
    for slug, config in CATEGORIES.items():
        cat_products = by_cat.get(slug, [])
        html = generate_category_page(slug, config, cat_products)
        out = CAT_DIR / slug
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(html, encoding="utf-8")
        print(f"  OK /categoria/{slug}/ ({len(cat_products)} productos)")
        if not CATEGORY_ROBOTS.lower().startswith("noindex"):
            all_urls.append(f"{BASE_URL}/categoria/{slug}/")
        pages += 1

    # Página tipo tienda / catálogo
    shop_dir = ROOT / SHOP_SLUG
    shop_dir.mkdir(parents=True, exist_ok=True)
    (shop_dir / "index.html").write_text(generate_shop_page(products), encoding="utf-8")
    print(f"  OK {SHOP_URL}")
    if not SHOP_ROBOTS.lower().startswith("noindex"):
        all_urls.append(f"{BASE_URL}{SHOP_URL}")
    pages += 1

    # Páginas de producto
    PROD_DIR.mkdir(parents=True, exist_ok=True)
    for child in PROD_DIR.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
    for p in products:
        cat_slug = p.get("category_slug", "")
        related = [r for r in by_cat.get(cat_slug, []) if r["slug"] != p["slug"]][:4]
        html = generate_product_page(p, related)
        out = PROD_DIR / p["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(html, encoding="utf-8")
        pages += 1
    print(f"  OK {len(products)} paginas de producto")

    # Páginas de salida externa (redirección afiliada limpia)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for child in OUT_DIR.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
    for p in products:
        out = OUT_DIR / p["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(generate_outbound_page(p), encoding="utf-8")
        pages += 1
    print(f"  OK {len(products)} paginas /out/ de redirección")

    # Guías
    GUIA_DIR.mkdir(parents=True, exist_ok=True)
    (GUIA_DIR / "index.html").write_text(generate_guides_index(), encoding="utf-8")
    all_urls.append(f"{BASE_URL}/guia/")
    pages += 1
    for g in GUIDES:
        out = GUIA_DIR / g["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(generate_guide_page(g, products), encoding="utf-8")
        all_urls.append(f"{BASE_URL}/guia/{g['slug']}/")
        pages += 1
        print(f"  OK /guia/{g['slug']}/")

    # Páginas estáticas
    for page in STATIC_PAGES:
        out = ROOT / page["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(generate_static_page(page), encoding="utf-8")
        page_robots = page.get("robots", DEFAULT_ROBOTS).lower()
        if not page_robots.startswith("noindex"):
            all_urls.append(f"{BASE_URL}/{page['slug']}/")
        pages += 1
        print(f"  OK /{page['slug']}/")

    # Páginas visibles bloqueadas para conservar el copy humano validado
    all_urls.extend(rewrite_locked_visible_html(locked_visible_html))

    # Evita URLs duplicadas en el sitemap cuando una página se genera y luego se bloquea
    all_urls = list(dict.fromkeys(all_urls))

    # Sitemap
    entries = "\n".join(
        f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>"
        for u in all_urls
    )
    sitemap = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{entries}\n</urlset>'
    SITEMAP.write_text(sitemap, encoding="utf-8")
    print(f"  OK sitemap.xml ({len(all_urls)} URLs)")

    print(f"\n{'=' * 50}")
    print(f"OK {pages} paginas generadas")
    print("Siguiente paso: python scripts/deploy.py")


if __name__ == "__main__":
    main()
