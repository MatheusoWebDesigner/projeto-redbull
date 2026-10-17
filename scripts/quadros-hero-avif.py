"""Gera os quadros da Hero em AVIF (qualidade 50, ~32% menores que os WebP) a partir dos PNG do Blender.

Os WebP continuam como reserva para navegadores sem AVIF. Uso:
python -I scripts/quadros-hero-avif.py "D:/Projeto RedBull - Arquivos Brutos (Blender)/03_renders-hero-sequencia-completa"
"""
import sys
from pathlib import Path

from PIL import Image

ORIGEM = Path(sys.argv[1])
DESTINO = Path(__file__).resolve().parent.parent / "public" / "hero" / "frames"

for aparelho in ("desktop", "mobile"):
    tamanho = Image.open(DESTINO / aparelho / "f_001.webp").size
    total = 0
    for i in range(1, 241):
        im = Image.open(ORIGEM / aparelho / f"hero_{i:04d}.png").convert("RGB").resize(tamanho, Image.LANCZOS)
        saida = DESTINO / aparelho / f"f_{i:03d}.avif"
        im.save(saida, "AVIF", quality=50, speed=4)
        total += saida.stat().st_size
    print(f"{aparelho} {tamanho}: {total / 1024 / 1024:.2f} MB")
