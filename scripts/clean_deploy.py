#!/usr/bin/env python3
# scripts/clean_deploy.py
# Borra TODO el contenido remoto y sube el sitio limpio (sin WordPress)

import ftplib
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from scripts.config import FTP_CONFIG

EXCLUDE = {
    "scripts", "data", ".git", ".gitignore",
    "CLAUDE_CONTEXT.md", "README.md", "__pycache__",
    ".DS_Store", "*.py", "node_modules"
}

def should_exclude(path: str) -> bool:
    parts = Path(path).parts
    for part in parts:
        if part in EXCLUDE or part.startswith("."):
            return True
    if path.endswith(".py"):
        return True
    return False


def ftp_delete_recursive(ftp: ftplib.FTP, remote_path: str):
    """Borra recursivamente un directorio remoto."""
    try:
        items = []
        ftp.retrlines(f"LIST {remote_path}", items.append)
    except Exception:
        return

    for item in items:
        parts = item.split(None, 8)
        if len(parts) < 9:
            continue
        name = parts[8]
        if name in (".", ".."):
            continue
        full_path = f"{remote_path}/{name}".replace("//", "/")
        is_dir = item.startswith("d")
        if is_dir:
            ftp_delete_recursive(ftp, full_path)
            try:
                ftp.rmd(full_path)
                print(f"  🗑️  DIR  {full_path}")
            except Exception as e:
                print(f"  ⚠️  No se pudo borrar dir {full_path}: {e}")
        else:
            try:
                ftp.delete(full_path)
                print(f"  🗑️  {full_path}")
            except Exception as e:
                print(f"  ⚠️  No se pudo borrar {full_path}: {e}")


def ftp_mkdir_recursive(ftp: ftplib.FTP, remote_path: str):
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.mkd(current)
        except ftplib.error_perm:
            pass


def upload_file(ftp: ftplib.FTP, local_path: Path, remote_path: str):
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)


def collect_files(base: Path) -> list:
    files = []
    for path in base.rglob("*"):
        if path.is_file():
            rel = str(path.relative_to(base))
            if not should_exclude(rel):
                files.append((path, rel))
    return files


def main():
    cfg = FTP_CONFIG
    base_remote = cfg["remote_path"].rstrip("/")

    print("=" * 50)
    print("🧹 AJSpinning — Clean Deploy (borra WordPress)")
    print(f"   Host: {cfg['host']}")
    print(f"   Ruta: {base_remote}")
    print("=" * 50)

    print("🔌 Conectando...", end=" ", flush=True)
    ftp = ftplib.FTP()
    ftp.connect(cfg["host"], 21, timeout=30)
    ftp.login(cfg["user"], cfg["password"])
    ftp.set_pasv(True)
    print("OK\n")

    # FASE 1: Borrar todo el contenido remoto
    print("🗑️  Borrando contenido antiguo (WordPress)...")
    ftp_delete_recursive(ftp, base_remote)
    print("\n✅ Servidor limpio\n")

    # FASE 2: Subir archivos nuevos
    files = collect_files(ROOT)
    print(f"📁 Subiendo {len(files)} archivos nuevos...")

    uploaded = 0
    errors = 0

    for local_path, rel in files:
        remote_path = f"{base_remote}/{rel}".replace("\\", "/")
        remote_dir  = "/".join(remote_path.split("/")[:-1])

        try:
            ftp_mkdir_recursive(ftp, remote_dir)
            upload_file(ftp, local_path, remote_path)
            print(f"  ✅ {rel}")
            uploaded += 1
        except Exception as e:
            print(f"  ❌ {rel}: {e}")
            errors += 1

        time.sleep(0.05)

    ftp.quit()

    print(f"\n{'=' * 50}")
    print(f"✅ Subidos: {uploaded} | ❌ Errores: {errors}")
    if errors == 0:
        print("🎉 Sitio limpio y en vivo en https://ajspinning.com")


if __name__ == "__main__":
    main()
