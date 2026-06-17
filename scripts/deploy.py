#!/usr/bin/env python3
# scripts/deploy.py
# Sube el sitio al servidor Sered via FTP (mismo workflow que housezen.es)

import ftplib
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from scripts.config import FTP_CONFIG

# Archivos/dirs que NO se suben al servidor
EXCLUDE = {
    "scripts", "data", ".git", ".gitignore",
    "CLAUDE_CONTEXT.md", "README.md", "__pycache__",
    ".DS_Store", "*.py", "node_modules", "editorial-test",
    "tmp", "{assets"
}

def should_exclude(path: str) -> bool:
    parts = Path(path).parts
    suffix = Path(path).suffix.lower()
    for part in parts:
        if part in EXCLUDE or part.startswith(".") or part.startswith("{"):
            return True
    if len(parts) == 1 and suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        return True
    if path.endswith(".py"):
        return True
    return False


def ftp_mkdir_recursive(ftp: ftplib.FTP, remote_path: str):
    """Crea directorios remotos recursivamente."""
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.mkd(current)
        except ftplib.error_perm:
            pass  # Ya existe


def upload_file(ftp: ftplib.FTP, local_path: Path, remote_path: str):
    """Sube un archivo via FTP."""
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)


def collect_files(base: Path) -> list:
    """Recopila todos los archivos a subir, excluyendo los marcados."""
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
    print("AJSpinning - Deploy FTP a Sered")
    print(f"   Host: {cfg['host']}")
    print(f"   Ruta: {base_remote}")
    print("=" * 50)

    files = collect_files(ROOT)
    print(f"{len(files)} archivos a subir\n")

    print("Conectando...", end=" ", flush=True)
    ftp = ftplib.FTP()
    ftp.connect(cfg["host"], 21, timeout=30)
    ftp.login(cfg["user"], cfg["password"])
    ftp.set_pasv(True)
    print("OK")

    uploaded = 0
    errors = 0

    for local_path, rel in files:
        remote_path = f"{base_remote}/{rel}".replace("\\", "/")
        remote_dir  = "/".join(remote_path.split("/")[:-1])

        try:
            ftp_mkdir_recursive(ftp, remote_dir)
            upload_file(ftp, local_path, remote_path)
            print(f"  OK {rel}")
            uploaded += 1
        except Exception as e:
            print(f"  ERROR {rel}: {e}")
            errors += 1

        time.sleep(0.05)

    ftp.quit()

    print(f"\n{'=' * 50}")
    print(f"Subidos: {uploaded} | Errores: {errors}")
    if errors == 0:
        print("Deploy completado. Sitio en vivo en https://ajspinning.com")


if __name__ == "__main__":
    main()
