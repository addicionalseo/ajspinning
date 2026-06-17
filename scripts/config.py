# scripts/config.py
# ⚠️  NO subir este archivo al servidor FTP

ALIEXPRESS_CONFIG = {
    "app_key":    "511228",
    "app_secret": "OK1ich6jFk5KlnZSs3eXScT16Xcc222i",
    "tracking_id": "ajspinning",
    "endpoint":   "https://api-sg.aliexpress.com/sync",
}

FTP_CONFIG = {
    "host":     "host.cpse58.eu",
    "user":     "ajspinning@ajspinning.com",
    "password": "Agencywebeo2025",
    "remote_path": "/",
}

SITE_CONFIG = {
    "base_url":    "https://ajspinning.com",
    "site_name":   "AJSpinning",
    "tagline":     "Expertos en Pesca Spinning y Casting",
    "lang":        "es",
    "currency":    "EUR",
}

# Categorías: slug -> configuración de búsqueda API
CATEGORIES = {
    "senueulos": {
        "name":     "Señuelos",
        "name_plural": "Señuelos de Pesca",
        "keywords": "fishing lure minnow wobbler crankbait",
        "desc":     "Los mejores señuelos artificiales para pesca spinning y casting. Minnows, wobblers, crankbaits y más.",
        "h1":       "Señuelos para Pesca Spinning y Casting",
        "icon":     "🎣",
        "show_in_nav": True,
        "max_products": 60,
    },
    "carretes": {
        "name":     "Carretes",
        "name_plural": "Carretes de Pesca",
        "keywords": "fishing reel spinning reel casting reel",
        "desc":     "Carretes de spinning y casting de alta precisión. Relación de recuperación óptima para cada técnica.",
        "h1":       "Carretes de Spinning y Casting",
        "icon":     "🔄",
        "show_in_nav": True,
        "max_products": 40,
    },
    "canas": {
        "name":     "Cañas",
        "name_plural": "Cañas de Pesca",
        "keywords": "fishing rod spinning rod casting rod",
        "desc":     "Cañas de spinning y casting para todos los niveles. Desde ultraligeras hasta potentes cañas de lanzado.",
        "h1":       "Cañas de Spinning y Casting",
        "icon":     "🎿",
        "show_in_nav": True,
        "max_products": 40,
    },
    "combos": {
        "name":     "Combos",
        "name_plural": "Combos de Pesca",
        "keywords": "fishing rod reel combo spinning combo",
        "desc":     "Combos de caña y carrete para empezar a pescar spinning con un equipo equilibrado y listo para usar.",
        "h1":       "Combos de Caña y Carrete para Spinning",
        "icon":     "🎒",
        "show_in_nav": False,
        "max_products": 20,
    },
    "hilos": {
        "name":     "Líneas",
        "name_plural": "Líneas de Pesca",
        "keywords": "braided fishing line fluorocarbon fishing line",
        "desc":     "Líneas trenzadas, fluorocarbono y bajos para spinning. Sensibilidad, resistencia y diámetro para cada escenario.",
        "h1":       "Líneas de Pesca para Spinning",
        "icon":     "🧵",
        "show_in_nav": False,
        "max_products": 20,
    },
    "anzuelos": {
        "name":     "Anzuelos",
        "name_plural": "Anzuelos de Pesca",
        "keywords": "fishing hooks treble hooks jig head",
        "desc":     "Anzuelos triples, simples y jig heads para spinning. Repuestos y montajes para mejorar señuelos y vinilos.",
        "h1":       "Anzuelos y Jig Heads para Spinning",
        "icon":     "🪝",
        "show_in_nav": False,
        "max_products": 20,
    },
    "accesorios": {
        "name":     "Accesorios",
        "name_plural": "Accesorios de Pesca",
        "keywords": "fishing tackle box hooks fishing accessories",
        "desc":     "Todo lo necesario para complementar tu equipo: cajas, anzuelos, plomos, destorcedores y más.",
        "h1":       "Accesorios de Pesca Spinning",
        "icon":     "🧰",
        "show_in_nav": True,
        "max_products": 60,
    },
}
