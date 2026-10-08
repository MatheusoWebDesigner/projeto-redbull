# Hero — Prompts para o Gemini (3 imagens + 2 vídeos)

Narrativa: a câmera faz um arco em volta do carro — **frente (parado) → lateral (em velocidade) → traseira (indo embora)**.
O carro aponta/anda sempre para a **direita** do quadro. O **terço esquerdo fica sempre vazio e escuro** (é onde o texto da landing troca).

| Frame | Capítulo do texto na landing |
|---|---|
| Imagem 1 — início | 01 "Uma nova era." |
| Imagem 2 — meio | 02 "Red Bull Ford DM01" · 03 "50% elétrico" |
| Imagem 3 — fim | 04 "RB22" |

## Bloco de estilo (já incluso em cada prompt)

```
Cinematic automotive photography, photorealistic, shot on ARRI Alexa with a 35mm anamorphic lens, 16:9 widescreen. Subject: a 2026-regulation Formula 1 car — narrower and shorter than previous generations, slim sidepods, simple wide front wing, halo, 18-inch wheels with black unbranded tyres. Livery: glossy deep racing blue with crisp white accent lines, small red and yellow accent stripes, exposed matte black carbon fibre on the floor and wings, mirror-like clear-coat reflections. No readable text, no logos, no sponsor names, no numbers. Driver helmet plain dark, no face visible. Composition: the car occupies the center and right side of the frame; the left third of the frame is clean, dark negative space with nothing in it. Color grade: deep navy shadows, cool highlights, subtle warm red rim light. Night atmosphere.
```

## Imagem 1 — Início (parado, revelação)

```
[BLOCO DE ESTILO]
Scene: the car sits stationary inside a dark, minimalist hangar, almost entirely in shadow. A single thin horizontal strip of light reveals only the nose, the front wing and the glossy curves of the bodywork, with reflections gliding across the blue paint. Light haze near the floor; wet black concrete reflects the car. Camera low, about 1 metre above the ground, three-quarter front view, the car's nose pointing toward the lower right of the frame. Mood: anticipation, the silence before ignition.
```

## Imagem 2 — Meio (em velocidade)

Anexe a Imagem 1 como referência.

```
Use the exact same car and livery as the attached reference image.
[BLOCO DE ESTILO]
Scene: the car at full speed on a wet night street circuit, travelling from left to right. Panning tracking shot at the same speed as the car, side profile seen slightly from the front. The car body is tack sharp; the background is motion-blurred streaks of blue and white city lights. A subtle electric-blue energy glow near the rear of the car, rain spray from the rear tyres, a few sparks under the floor. The car sits center-right; the left third is dark, blurred background.
```

## Imagem 3 — Fim (indo embora, hero)

Anexe a Imagem 1 como referência.

```
Use the exact same car and livery as the attached reference image.
[BLOCO DE ESTILO]
Scene: low-angle three-quarter rear view of the car pulling away toward the right side of the frame as it exits a tunnel of light. Red rear rain light glowing, heat haze from the exhaust, light streaks trailing behind it and fading into darkness. Background almost black with a soft navy gradient. Calm, premium hero framing; the whole car visible and sharp, placed center-right. Left third empty and dark.
```

## Vídeo A — Imagem 1 → Imagem 2 (primeiro e último frame)

```
Continuous single shot, no cuts. The car ignites; strip lights in the hangar switch on one after another; the car launches forward, and the camera smoothly orbits from the front three-quarter view to a side tracking shot as the car leaves the hangar onto a wet night street circuit. Smooth, steady camera at constant speed, no shake, no flashes, no strobing, no text. Keep the left third of the frame dark and empty.
```

## Vídeo B — Imagem 2 → Imagem 3 (primeiro e último frame)

```
Continuous single shot, no cuts. The camera keeps tracking alongside the car, then slowly drifts behind it into a low rear three-quarter view as the car pulls away and passes through a tunnel of light, leaving light trails. Smooth, steady motion at constant speed, no shake, no flashes, no strobing, no text. Keep the left third of the frame dark and empty.
```

## Regras de qualidade (por causa do scroll)

- O vídeo vai avançar e voltar conforme a rolagem: **sem cortes, sem flashes, sem tremida**. Flash pisca feio quando o usuário rola devagar.
- Movimento de câmera constante e suave vale mais que ação intensa.
- Sempre 16:9, na maior resolução disponível.
- Sem logos ou textos: a IA deforma letras, e marca registrada fica de fora.
- Se o carro mudar muito entre as imagens, regere a 2 e a 3 anexando a 1 como referência.
