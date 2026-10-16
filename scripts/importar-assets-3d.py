"""Importa os renders e os dados de câmera do Blender para a web.

Uso: python -I scripts/importar-assets-3d.py "D:/Projeto RedBull - Arquivos Brutos (Blender)/07_quadros-para-figma"
"""
import json
import sys
from pathlib import Path

from PIL import Image

ORIGEM = Path(sys.argv[1])
RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
DATA = RAIZ / "src" / "data"
CAMPOS_POSE = ("posicao_m", "alvo_m", "fov_vertical_graus", "shift_x", "shift_y", "resolucao")


def webp(png: Path, destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    Image.open(png).convert("RGB").save(destino, "WEBP", quality=86, method=6)
    print(f"{destino.relative_to(RAIZ)}  {destino.stat().st_size // 1024} KB")


def salvar(nome: str, dados: dict) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / nome).write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


for aparelho in ("desktop", "mobile"):
    for i in range(6):
        webp(ORIGEM / "showroom" / aparelho / f"sr_0{i}.png", PUBLIC / "showroom" / aparelho / f"sr_0{i}.webp")
    for corte in "ABC":
        for modo in ("curva", "reta"):
            webp(ORIGEM / "aero" / aparelho / f"{corte}_{modo}.png", PUBLIC / "aero" / aparelho / f"{corte}_{modo}.webp")

sr = json.loads((ORIGEM / "showroom" / "showroom_cameras.json").read_text(encoding="utf-8"))
salvar("showroom-cameras.json", {
    "hdri_rotacao_z_graus": sr["hdri_rotacao_z_graus"],
    "hdri_intensidade": sr["hdri_intensidade"],
    "cameras": {ap: [{k: c[k] for k in CAMPOS_POSE} for _, c in sorted(cams.items())] for ap, cams in sr["cameras"].items()},
})

aero = json.loads((ORIGEM / "aero" / "aero_cameras.json").read_text(encoding="utf-8"))
salvar("aero-cameras.json", {ap: {n: {k: c[k] for k in CAMPOS_POSE} for n, c in cams.items() if n in ("A", "C")} for ap, cams in aero["cameras"].items()})

hs = json.loads((ORIGEM / "showroom" / "hotspots.json").read_text(encoding="utf-8"))
salvar("hotspots.json", {ap: [{peca: v["visivel"] for peca, v in pecas.items()} for _, pecas in sorted(paradas.items())] for ap, paradas in hs.items()})

perfil = json.loads((ORIGEM / "aero" / "perfil.json").read_text(encoding="utf-8"))
PECAS = ("plano_principal_fixo", "tras_flap1", "tras_flap2")
salvar("perfil.json", {
    ap: {
        "resolucao": d["resolucao"],
        **{modo: {p: {k: d[modo][p][k] for k in ("bordo_de_ataque", "bordo_de_fuga")} for p in PECAS} for modo in ("curva", "reta")},
        "dobradica_flap2": d["curva"]["tras_flap2"]["dobradica"],
    }
    for ap, d in perfil.items() if ap in ("desktop", "mobile")
})
print("ok")
