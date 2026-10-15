export interface ParsedValue { prefix: string; number: number; decimals: number; suffix: string }

/** "3.400" → 3400 · "8,5" → 8,5 (1 casa) · "−55%" → sinal "−", 55, sufixo "%". */
export function parseValue(text: string): ParsedValue {
  const m = /^([−+-]?)([\d.]+)(?:,(\d+))?(.*)$/.exec(text.trim());
  if (!m) throw new Error(`Valor não numérico: ${text}`);
  const inteiro = Number(m[2].replace(/\./g, ''));
  const decimais = m[3] ?? '';
  return { prefix: m[1], number: decimais ? Number(`${inteiro}.${decimais}`) : inteiro, decimals: decimais.length, suffix: m[4] };
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Texto do contador no instante t (0 → 1), já no formato pt-BR. */
export function countFrame(v: ParsedValue, t: number): string {
  const k = easeOut(Math.min(1, Math.max(0, t)));
  const n = v.number * k;
  const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: v.decimals, maximumFractionDigits: v.decimals });
  return `${n > 0 ? v.prefix : ''}${fmt.format(n)}${v.suffix}`;
}
