# Pintura no carro — design aprovado

Aprovado pelo usuário em 2026-10-22, depois de conferir as pinturas reais das épocas. É só pintura, sem mudar o modelo: o carro é sempre o RB22. Fonte da verdade visual: Figma, página **"12 · Pintura no carro"** (`172:164`).

## O que muda

- **Sai** o "chip" de tinta abstrato, que só virava o carro em 2026.
- **Entra** o RB22 de perfil desde 2005, vestido com a paleta e o acabamento de cada época.
  - São renders do Blender `pintura_eras_v01/v02.blend`, com a mesma câmera e luz do `brilho_a` (silhueta idêntica, IoU 1,0).
  - Arquivos: `public/pintura/{desktop,mobile}/era_0..3.webp` (~22–33 KB cada).
  - 2026 continua `brilho_a`, com o crossfade para `brilho_b` no fim do pin.
- **Paletas e acabamentos**, conferidos em fontes públicas:

| Época | Base | Acentos | Acabamento |
|---|---|---|---|
| 2005 | azul-marinho | asas prata | brilhante |
| 2010–13 | azul-escuro | bico amarelo e roxo (só a cor, sem marca de patrocinador) | brilhante |
| 2016 | azul | — | fosco |
| 2023 | azul-marinho | — | fosco |

- **Logos:** nas épocas foscas, o par de "Red Bull" pequenos perto do cockpit (que o halo fatiava) foi escondido. No brilhante, o verniz já o apaga.
- **Nota da seção:** "Cores aproximadas · releitura no RB22".

## Pistola de tinta

- **O que acontece:** perto de cada fronteira, de 3/4 de uma época até 1/4 da seguinte, a pintura nova cobre a antiga por uma frente diagonal de cerca de 20°.
  - A frente é presa à rolagem (`--frente` de 0 a 1).
  - Uma névoa clara acompanha a borda.
  - Nos encaixes (meio de cada época) nunca há passada.
- **Implementação:**
  - `pistola(p)` em `eras.ts` calcula a passada;
  - duas camadas de `<picture>`: a base embaixo e a nova com `clip-path: polygon(...)`.
- **Movimento reduzido ou tela que não comporta o pin:** as épocas ficam empilhadas, cada uma com o render dela e um `alt` descritivo.
