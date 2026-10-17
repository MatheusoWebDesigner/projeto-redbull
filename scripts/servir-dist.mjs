// Servidor estático mínimo, sem dependências, que aplica os cabeçalhos do vercel.json.
// Serve para provar a CSP e o cache localmente, antes de publicar.
//
// Uso: node scripts/servir-dist.mjs [pasta=dist] [porta=4200]
// Escuta só em 127.0.0.1. Não é servidor de produção.
import { createServer } from 'node:http';
import { readFileSync, createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, join, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_PROJETO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = resolve(RAIZ_PROJETO, process.argv[2] ?? 'dist');
const PORTA = Number(process.argv[3] ?? 4200);
const config = JSON.parse(readFileSync(join(RAIZ_PROJETO, 'vercel.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

// Converte o "source" da Vercel (sintaxe path-to-regexp) numa RegExp ancorada.
// Cobre o que o vercel.json usa: grupos "( … )" passam como regex; ":nome" vira um segmento.
function paraRegex(source) {
  let re = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '(') {
      let nivel = 0, j = i;
      for (; j < source.length; j++) {
        if (source[j] === '\\') { j++; continue; }
        if (source[j] === '(') nivel++;
        if (source[j] === ')' && --nivel === 0) break;
      }
      re += source.slice(i, j + 1);
      i = j;
    } else if (c === '\\') {
      re += source.slice(i, i + 2);
      i++;
    } else if (c === ':') {
      const m = /^:[A-Za-z_]\w*/.exec(source.slice(i));
      re += '([^/]+)';
      i += m[0].length - 1;
    } else {
      re += c.replace(/[.*+?^${}|[\]]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

const REGRAS = (config.headers ?? []).map((r) => ({ re: paraRegex(r.source), headers: r.headers }));

// Como na Vercel: todas as regras que casam se aplicam, na ordem; a última vence em chave repetida.
function cabecalhos(caminho) {
  const saida = {};
  for (const { re, headers } of REGRAS) if (re.test(caminho)) for (const { key, value } of headers) saida[key.toLowerCase()] = value;
  return saida;
}

async function arquivo(caminho) {
  let alvo = resolve(PASTA, '.' + caminho);
  // Nunca sai da pasta servida (path traversal).
  if (alvo !== PASTA && !alvo.startsWith(PASTA + sep)) return null;
  try {
    let s = await stat(alvo);
    if (s.isDirectory()) { alvo = join(alvo, 'index.html'); s = await stat(alvo); }
    return s.isFile() ? { alvo, tamanho: s.size } : null;
  } catch { return null; }
}

const servidor = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }).end(); return; }
  let caminho;
  try { caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (caminho.includes('\0')) { res.writeHead(400).end(); return; }

  const achado = await arquivo(caminho);
  const extras = cabecalhos(caminho);
  if (!achado) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', ...extras }).end('404'); return; }

  res.writeHead(200, {
    'content-type': MIME[extname(achado.alvo).toLowerCase()] ?? 'application/octet-stream',
    'content-length': achado.tamanho,
    ...extras,
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(achado.alvo).pipe(res);
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`servindo ${PASTA} em http://127.0.0.1:${PORTA} com ${REGRAS.length} regras de cabeçalho do vercel.json`);
});
