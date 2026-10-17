# Teste manual com leitor de tela — landing RB22

As ferramentas automáticas (Lighthouse, axe) e os testes de ponta a ponta já passaram. Eles não dizem **o que o leitor
de tela fala**. Este roteiro cobre isso: cerca de 40 minutos no computador e 30 minutos no iPhone.

Faça as duas rodadas:

| Rodada | Leitor | Navegador | Aparelho |
|---|---|---|---|
| A | NVDA (versão 2024.1 ou mais nova) | Firefox | Windows |
| B | VoiceOver | Safari | iPhone |

Anote cada problema na tabela **Registro**, no fim deste arquivo. Na dúvida, anote mesmo assim: é mais barato descartar
uma anotação do que esquecer um problema.

---

## 1. Antes de começar

1. Abra o site publicado. Para testar localmente, rode `npm run dev` e abra `http://localhost:5173/`.
2. **NVDA:**
   - Menu do NVDA → Preferências → Configurações → Fala: confirme que a voz é em português.
   - Em Preferências → Configurações → Fala, deixe "Nível de símbolos e pontuação" em **"alguns"** (o padrão).
3. **iPhone:**
   - Ajustes → Acessibilidade → VoiceOver: ligue.
   - Atalho: três toques no botão lateral.
   - Idioma da fala: português (Brasil).
4. Anote, no topo do Registro, a versão do leitor, do navegador e do sistema.

### Comandos que você vai usar

| O que fazer | NVDA + Firefox | VoiceOver + iPhone |
|---|---|---|
| Ler a partir daqui | `Insert` + `↓` | Dois dedos deslizando para baixo |
| Parar a fala | `Ctrl` | Dois dedos tocando uma vez |
| Próximo item | `↓` | Deslizar um dedo para a direita |
| Próximo título | `H` (`Shift` + `H` volta) | Rotor em "Títulos" e deslizar para baixo |
| Próximo marco (região) | `D` | Rotor em "Marcos" e deslizar para baixo |
| Lista de títulos | `Insert` + `F7` → "Títulos" | Rotor em "Títulos" |
| Próximo controle | `Tab` | Rotor em "Controles de formulário" |
| Ativar | `Enter` ou `Espaço` | Dois toques |

O **rotor** do VoiceOver: gire dois dedos na tela, como quem gira um botão.

---

## 2. Passada rápida: títulos e regiões (5 min)

### 2.1 Página

Ao abrir, você deve ouvir: **"RB22 — Uma nova era | Projeto conceitual"**, em voz portuguesa.

### 2.2 Títulos

No NVDA, abra a lista de títulos (`Insert` + `F7` → Títulos); no iPhone, use o rotor em "Títulos". A ordem esperada:

```
1  Uma nova era.
2    Feito em casa. · 50% elétrico. · RB22.
2    Manifesto
2    Showroom 3D
3      O carro. Por inteiro. · Asa dianteira · Cockpit e halo · Sidepods · Assoalho · Asa traseira ativa
2    Aerodinâmica ativa
3      Duas asas. Duas personalidades. · Mesma asa, outro ângulo. · As duas juntas.
2    Red Bull Ford DM01
3      50% fogo. 50% faísca. · Fogo. · Faísca. · Meio a meio.
2    Mais leve. Mais curto. Mais esperto.
3      Peso mínimo · Entre-eixos máximo · Largura · Arrasto (aprox.) · MGU-K · Recuperados por volta (aprox.) · Combustível sustentável · DRS
2    Pintura
3      A estreia. · Os anos dos títulos. · O fosco. · A assinatura. · O brilho voltou.
2    Construído por uma equipe. Não por um nome.
2    Te dá asas.
2    Projeto · Créditos · Dados
```

**Confirme:**
- [ ] **T1:** nenhum título é lido duas vezes, nem letra por letra. Atenção a "Uma nova era.", que tem uma cópia visual animada escondida.
- [ ] **T2 (caixa alta via CSS):** títulos que aparecem em MAIÚSCULAS na tela são lidos como palavras normais. Exemplos: "Manifesto", "Peso mínimo", "Fogo." e "O brilho voltou.". O leitor **não** deve soletrar ("M-A-N-I…") nem dizer "maiúscula" antes de cada letra. Siglas como "DRS" e "MGU-K" podem ser soletradas: isso é esperado.

### 2.3 Regiões (marcos)

Use `D` no NVDA ou o rotor "Marcos" no iPhone. Você deve encontrar:
- **principal**;
- regiões com o nome de cada seção ("Apresentação do RB22", "Manifesto", "Showroom 3D"…);
- duas **navegações** ("Peças do carro" e "Eras da pintura");
- **informações de conteúdo** (o rodapé).

- [ ] **T3:** todas as regiões têm nome falado, nenhuma aparece como "região" sem nome.

---

## 3. Leitura contínua, seção por seção (30 min)

Volte ao topo (`Ctrl` + `Home` no NVDA; no iPhone, toque na barra de status). Leia item a item com `↓` ou deslizando para
a direita. A coluna "Confirme" lista o que precisa sair certo.

### 3.1 Abertura e carregamento

Deve ouvir:
- **"Pular introdução, link"**;
- **"Carregando a experiência, barra de progresso"**, com uma porcentagem. Some depois de carregar.

**Confirme:**
- [ ] **A1:** o carregamento não fica repetindo a porcentagem sem parar enquanto você lê.
- [ ] **A2:** ative "Pular introdução". O leitor deve ir para **"Manifesto"** e continuar a leitura dali. Depois, volte ao topo.

### 3.2 Hero ("Apresentação do RB22")

Deve ouvir:
- a imagem "O carro de Fórmula 1 RB22, azul com os touros da Red Bull, acelera por um túnel de luz.";
- "01 / 04", o título nível 1 "Uma nova era." e o texto;
- os capítulos 02, 03 e 04, cada um com título nível 2.

**Confirme:**
- [ ] **H1:** os quatro capítulos são lidos em ordem, mesmo os que estão invisíveis na tela naquele momento.
- [ ] **H2:** a telemetria ("km/h", "rpm", "marcha") **não** é lida.

### 3.3 Manifesto

Deve ouvir:
- título "Manifesto";
- **a frase inteira uma vez** ("Pela primeira vez, a Red Bull faz o carro e o motor… DM01, de Dietrich Mateschitz.");
- a assinatura "Red Bull Ford Powertrains · Milton Keynes · 2026" e a frase da parceria com a Ford.

**Confirme:**
- [ ] **M1:** a frase não é lida palavra por palavra em itens separados, nem duas vezes.

### 3.4 Showroom 3D

Deve ouvir:
- título "Showroom 3D";
- seis paradas, cada uma com título nível 3, texto e uma lista de definições (por exemplo, "entre-eixos · −200 mm, 3.400 mm");
- a navegação "Peças do carro", com os botões "01 Asa dianteira" a "05 Asa traseira ativa".

**Confirme:**
- [ ] **S1 (artigos com opacidade 0 no palco fixado):** as **seis** paradas são lidas, em ordem, embora na tela só uma apareça por vez.
- [ ] **S2:** com o leitor parado na parada 3, por exemplo, anote **o que aparece na tela**. Pode ser outra parada: na rolagem por leitor de tela isso é aceitável, mas registre como baixo.
- [ ] **S3 (sinal de menos):** "−200 mm", "−100 mm", "−30%" e "−55%" são lidos como **"menos 200 milímetros"** ou "menos 200 mm". Não pode virar silêncio nem "traço".
- [ ] **S4:** no `Tab` (NVDA) ou no rotor de controles (iPhone):
  - o primeiro controle do Showroom é o link "Ver a aerodinâmica ativa", que pertence à última parada;
  - ao focá-lo, a tela deve rolar até a parada 05.

  Anote se isso confunde.
- [ ] **S5:** ative o botão "03 Sidepods". A tela vai para a parada 3, e o botão passa a ser anunciado como **"etapa atual"** (ou "atual").

### 3.5 Aerodinâmica ativa

Deve ouvir:
- título "Aerodinâmica ativa" e três etapas com título nível 3;
- o cartão "Modo curva · padrão", com "Pressão aerodinâmica, Alta" e "Arrasto, Alta";
- o grupo **"Modo das asas"**, com "Modo curva, botão de opção, marcado, 1 de 2".

**Confirme:**
- [ ] **E1 (anúncio do cartão):** no grupo "Modo das asas", ative **"Modo reta"** (NVDA: `→` ou `Espaço`; iPhone: dois toques):
  - o leitor deve anunciar o cartão novo **uma vez**: "Modo reta…", com o texto e os níveis;
  - não pode haver anúncio duplicado nem a leitura inteira repetida;
  - volte para "Modo curva" e confirme o mesmo.
- [ ] **E2:** enquanto você só lê o texto, **sem** mexer no seletor, o cartão não deve interromper a leitura com anúncios sozinho. Anote se ele interromper.
- [ ] **E3 ("≈" em texto visível):** no **movimento reduzido** (seção 4), a legenda diz "flap superior ≈ 30° mais deitado". Anote como o "≈" é lido:
  - "aproximadamente" é o ideal;
  - "quase igual" é aceitável;
  - silêncio é problema médio.

### 3.6 Red Bull Ford DM01

Deve ouvir:
- título "Red Bull Ford DM01" e as etapas "50% fogo. 50% faísca.", "Fogo.", "Faísca." e "Meio a meio.";
- valores como **"V6 1.6 L turbo, cerca de 400 kW"**, "MGU-K (era 120 kW), 350 kW" e "recuperados por volta, cerca de 8,5 MJ";
- "Mais de 1.000 cv combinados, cerca de 750 kW".

**Confirme:**
- [ ] **D1 (contadores lidos uma vez):** cada valor é lido **uma única vez**, com o número final. Não pode haver "0 kW", "137 kW" etc., nem "aproximadamente 400 kW 400 kW".
- [ ] **D2 ("≈"):** nesta seção o "≈" visível é trocado por "cerca de". Confirme que você **não** ouve "quase igual a".
- [ ] **D3:** a lista das peças (V6 1.6 turbo, Turbo, MGU-K, Bateria, Eletrônica de controle) é lida uma vez, não duas.

### 3.7 Em números

Deve ouvir:
- título "Mais leve. Mais curto. Mais esperto." e "O RB22 resumido em oito números.";
- uma lista de **8 itens**, cada um com "01 / 08", o valor ("768 kg"), o título nível 3 ("Peso mínimo") e a descrição.

**Confirme:**
- [ ] **N1 (contadores):** cada valor é lido uma vez, com o número final. "−55%" é lido como "menos 55%", e o cartão DRS como "zero".
- [ ] **N2:** "01 / 08" vira algo compreensível, como "01 barra 08". Anote como ficou.

### 3.8 Pintura

Deve ouvir:
- título "Pintura" e "Cores aproximadas";
- cinco eras, cada uma com o ano ("2005 · RB1"), título nível 3, texto, a lista "Cores aproximadas de 2005" e o acabamento;
- a navegação "Eras da pintura", com cinco botões.

**Confirme:**
- [ ] **P1 (hex das cores):** cada amostra é lida como "Azul-marinho, #102154". Anote **como o código é falado** ("cerquilha um zero dois…", "número 102154"…). Se ficar longo ou confuso a ponto de atrapalhar a leitura, registre como médio. A correção seria esconder o hex do leitor.
- [ ] **P2 (anúncio da era):** na navegação "Eras da pintura", ative o botão "2026 RB22". Depois que a tela parar, o leitor deve anunciar **"2026 · RB22: O brilho voltou."** uma vez.
- [ ] **P3:** na era 2026, a imagem é lida como "O RB22 de perfil, em azul brilhante com o touro vermelho e o sol amarelo.".

### 3.9 Legado

Deve ouvir:
- título "Construído por uma equipe. Não por um nome." e o texto;
- uma lista de definições: "títulos de construtores, 6", "títulos de pilotos, 8", "vitórias até o fim de 2025, 130" e "ano da estreia, 2005";
- a imagem "Títulos de construtores em 2010, 2011, 2012, 2013, 2022 e 2023; títulos de pilotos de 2010 a 2013 e de 2021 a 2024.".

**Confirme:**
- [ ] **L1 (contadores):** os números são lidos uma vez, já com o valor final, inclusive se você chegar na seção antes de a animação terminar.

### 3.10 Fechamento e rodapé

Deve ouvir:
- título "Te dá asas.", o texto e o botão **"Voltar ao topo"**;
- no rodapé, "Projeto", "Créditos" e "Dados", com os textos.

**Confirme:**
- [ ] **F1 (foco no h1 depois de "Voltar ao topo"):** ative "Voltar ao topo". Quando a página parar no início, o leitor deve dizer **"Uma nova era., título nível 1"**, e a leitura seguinte (`↓`) continua dali. Não pode ficar em silêncio nem continuar no rodapé.
- [ ] **F2:** o botão "Ver estudo de caso" **não** aparece (ele só existe quando o link for definido).

---

## 4. Movimento reduzido (10 min, só a passada rápida)

Ligue a preferência de reduzir movimento e recarregue a página:
- **Windows:** Configurações → Acessibilidade → Efeitos visuais → desligue "Efeitos de animação". O Firefox obedece.
- **iPhone:** Ajustes → Acessibilidade → Movimento → ligue "Reduzir movimento".

Refaça a seção 2 (títulos e regiões) e leia Showroom, Aero e DM01.

**Confirme:**
- [ ] **R1:** não há barra de progresso de carregamento, e a página já começa no conteúdo.
- [ ] **R2:** a ordem dos títulos é a mesma da seção 2.2.
- [ ] **R3:**
  - o Showroom não tem a navegação "Peças do carro";
  - a Aero mostra os dois cartões ("Modo curva" e "Modo reta") e não tem seletor;
  - a Pintura não tem a navegação "Eras da pintura".

  Isso é esperado: tudo aparece de uma vez.
- [ ] **R4:** faça o item **E3** ("≈" na legenda da Aero).

---

## 5. Só no iPhone

- [ ] **I1:** com um dedo deslizando para a direita do começo ao fim, você chega ao rodapé **sem travar** em nenhuma seção. Atenção aos palcos fixados do Showroom, da Aero, do DM01 e da Pintura.
- [ ] **I2:** com o rotor em "Títulos", pular de título em título rola a tela até o texto lido.
- [ ] **I3:** com o zoom do iOS ligado (três dedos, dois toques), o texto continua inteiro, sem cortes.

---

## Registro

Ambiente:
- NVDA versão:
- Firefox versão:
- Windows:
- iOS:
- Data:

Gravidade:
- **bloqueia:** não dá para acessar o conteúdo ou a função;
- **dificulta:** dá, mas com esforço ou confusão;
- **incomoda:** detalhe.

| Item (ex.: E1) | Leitor + navegador | O que você ouviu (literal) | O que era esperado | Gravidade |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

Itens que passaram sem problema: marque o `[x]` acima. Ao terminar, devolva este arquivo, ou só a tabela, para a correção.
