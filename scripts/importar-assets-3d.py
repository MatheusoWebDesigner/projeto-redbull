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

# ---------------------------------------------------------------- Fase 5: DM01 e Pintura
for aparelho in ("desktop", "mobile"):
    for e in range(4):
        webp(ORIGEM / "dm01" / aparelho / f"E{e}.png", PUBLIC / "dm01" / aparelho / f"E{e}.webp")
    for nome in ("brilho_a", "brilho_b"):
        webp(ORIGEM / "pintura" / aparelho / f"{nome}.png", PUBLIC / "pintura" / aparelho / f"{nome}.webp")


def tj(v):
    """Blender (Z para cima) -> Three.js: (x, y, z) -> (x, z, -y)."""
    return [v[0], v[2], -v[1] + 0.0]


ex = json.loads((ORIGEM / "dm01" / "explosao.json").read_text(encoding="utf-8"))
cams = json.loads((ORIGEM / "dm01" / "dm01_cameras.json").read_text(encoding="utf-8"))
pecas = {}
for grupo in ("pecas", "subpecas"):
    for chave, p in ex[grupo].items():
        pecas[p["objeto"]] = {"chave": chave, **{e: p[f"{e}_threejs"] for e in ("E1", "E2", "E3")}, "E0": [0, 0, 0]}
salvar("dm01.json", {
    "pecas": pecas,
    "grupos": ex["grupos_E3"],
    "cabos": [{
        "nome": c["nome"], "raio": c["raio_m"],
        "de": {"objeto": c["de"]["objeto"], "ponto": tj(c["de"]["ponto_E0_m"]), "direcao": tj(c["de"]["direcao"])},
        "para": {"objeto": c["para"]["objeto"], "ponto": tj(c["para"]["ponto_E0_m"]), "direcao": tj(c["para"]["direcao_chegada"])},
    } for c in ex["cabos_hv"]],
    "cameras": {ap: {k: c[k] for k in CAMPOS_POSE} for ap, c in cams["cameras"].items()},
    "hdri": {"rotacao_z_graus": 285, "intensidade": cams["hdri_intensidade"]},
    # dm01_v02.blend + 05_scripts/dm01_comum_v01.py (LUZ e EMIS por estado)
    "luzes": [
        {"nome": "softbox_teto", "pos": [-0.15, 0.0, 3.0], "euler": [0, 0, 0], "tam": [3.6, 1.7], "cor": [0.93, 0.96, 1.0], "watts": {"E0": 650, "E1": 650, "E2": 650, "E3": 480}},
        {"nome": "recorte_tras", "pos": [-0.6, -3.2, 1.7], "euler": [65.8, 0, -8.0], "tam": [2.4, 0.8], "cor": [0.75, 0.84, 1.0], "watts": {"E0": 220, "E1": 220, "E2": 220, "E3": 170}},
        {"nome": "luz_quente_termico", "pos": [1.7, 1.6, 1.4], "euler": [61.9, 0, 144.3], "tam": [1.6, 1.0], "cor": [1.0, 0.4, 0.12], "watts": {"E0": 0, "E1": 0, "E2": 0, "E3": 190}},
        {"nome": "luz_fria_eletrico", "pos": [-2.7, -0.3, 1.4], "euler": [55.6, 0, -79.7], "tam": [1.6, 1.0], "cor": [0.28, 0.45, 1.0], "watts": {"E0": 0, "E1": 0, "E2": 0, "E3": 380}},
    ],
    "emissao": {
        "dm01_escape_quente": {"E0": 1.0, "E1": 1.15, "E2": 1.15, "E3": 1.9},
        "dm01_turbina_quente": {"E0": 1.0, "E1": 1.15, "E2": 1.15, "E3": 1.9},
        "dm01_emissao_azul": {"E0": 1.0, "E1": 1.0, "E2": 1.0, "E3": 1.6},
    },
})
print("ok fase 5")
