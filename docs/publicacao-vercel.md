# Publicação na Vercel

O site é estático: a Vercel roda `npm run build` e publica a pasta `dist/`.
Toda a configuração está no `vercel.json`, na raiz do repositório. Não é preciso configurar nada no painel além do que está abaixo.

## Passo a passo

1. **Suba o branch para o GitHub** (o `main`, depois do merge, ou o branch que você quiser publicar).
2. Entre em [vercel.com](https://vercel.com) com a conta do GitHub e clique em **Add New… → Project**.
3. Em **Import Git Repository**, escolha este repositório. Se ele não aparecer, clique em **Adjust GitHub App Permissions** e libere **só este repositório**, não a conta inteira.
4. Na tela de configuração:
   - **Framework Preset:** Vite (já vem do `vercel.json`);
   - **Root Directory:** deixe a raiz;
   - **Build, Output e Install:** não mexa, o `vercel.json` já define;
   - **Environment Variables:** **nenhuma**. O site não usa segredo, chave nem API.
5. Clique em **Deploy**. Em um ou dois minutos sai o endereço `https://<nome>.vercel.app`.
6. Em **Settings → General → Node.js Version**, deixe **22.x** ou mais novo (o Vite 8 exige).
7. *(Recomendado)* Em **Settings → General → Vercel Toolbar**, desligue a barra nos *Preview Deployments*. Ela injeta um script de `vercel.live`, que a CSP bloqueia de propósito; sem desligar, os previews mostram erros de CSP no console. A produção não tem a barra.
8. *(Opcional)* Domínio próprio: **Settings → Domains → Add**, e siga as instruções de DNS. O certificado HTTPS é automático.

Daqui em diante, cada `git push` no branch de produção publica sozinho. Os outros branches viram previews com endereço próprio.

## Como conferir os cabeçalhos depois de publicar

No terminal:

```bash
curl -sI https://<seu-endereco>/ | grep -iE "content-security|strict-transport|x-content-type|x-frame|referrer|permissions|cross-origin|cache-control"
curl -sI https://<seu-endereco>/models/rb22.glb | grep -iE "content-type|cache-control"
```

Ou no Chrome: **F12 → Network → recarregue → clique no documento → Headers → Response Headers**.

O que conferir:

- o documento (`/`) tem `Cache-Control: public, max-age=0, must-revalidate`;
- os arquivos em `/assets/` têm `max-age=31536000, immutable`;
- **F12 → Console** fica sem nenhuma mensagem "Content Security Policy" ao rolar a página inteira;
- o 3D do Showroom e do DM01 aparece.

Para uma nota geral, cole o endereço em [securityheaders.com](https://securityheaders.com).

## Testar antes de publicar

```bash
npm run build
node scripts/servir-dist.mjs        # serve dist/ em http://127.0.0.1:4200 com os cabeçalhos do vercel.json
```

Abra o endereço, role a página inteira e confira o console. Ctrl+C encerra.

## O que cada cabeçalho faz

| Cabeçalho | O que faz |
|---|---|
| `Content-Security-Policy` | Só deixa rodar script, CSS, fonte, imagem e conexão do próprio site; bloqueia script injetado. |
| ↳ `script-src 'self' 'wasm-unsafe-eval'` | Scripts só do site; `wasm-unsafe-eval` libera **só** WebAssembly (o decodificador Draco do 3D), não `eval` de JavaScript. |
| ↳ `worker-src 'self' blob:` | O Draco roda num Worker criado a partir de um Blob. |
| ↳ `style-src-attr 'unsafe-inline'` | Libera só atributos `style="…"` (as cores das eras e o atraso das marcas do Legado); folhas e `<style>` continuam só do site. |
| ↳ `frame-ancestors 'none'` | Ninguém consegue embutir o site num `<iframe>` (contra clickjacking). |
| `Strict-Transport-Security` | Navegador passa a usar sempre HTTPS neste domínio por 2 anos. |
| `X-Content-Type-Options: nosniff` | Navegador não "adivinha" o tipo do arquivo; um arquivo que não é script nunca roda como script. |
| `X-Frame-Options: DENY` | O mesmo que `frame-ancestors`, para navegadores antigos. |
| `Referrer-Policy` | Ao sair para outro site, envia só o domínio, nunca o caminho completo. |
| `Permissions-Policy` | Desliga câmera, microfone, localização, pagamento, sensores e afins, que o site não usa. |
| `Cross-Origin-Opener-Policy` | Isola a janela do site de janelas abertas por outros sites. |
| `Cross-Origin-Resource-Policy` | Outros sites não conseguem carregar os arquivos daqui (modelos 3D, imagens) nas páginas deles. |
| `Cache-Control` em `/assets/` | Arquivos com hash no nome ficam um ano no cache; mudou o conteúdo, muda o nome. |
| `Cache-Control` em `hero/`, `models/`, `env/`… | Cache de 1 dia e mais 7 servindo a cópia antiga enquanto busca a nova. **Ao trocar um desses arquivos, troque também o nome.** |
| `Cache-Control` no `index.html` | Sempre confere com o servidor, então uma publicação nova aparece na hora. |

## Se algo quebrar depois de publicar

- **Erro de CSP no console:** copie a mensagem. Não afrouxe a política com `'unsafe-inline'` ou `'unsafe-eval'` em `script-src`; descubra qual recurso foi bloqueado e libere só ele.
- **3D não carrega:** confira no Network se `/models/*.glb` e `/assets/draco_decoder-*.wasm` respondem 200.
- **Voltar uma publicação:** **Deployments → escolha uma anterior → ⋯ → Promote to Production**.
