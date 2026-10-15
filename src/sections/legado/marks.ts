export const CONSTRUTORES = [2010, 2011, 2012, 2013, 2022, 2023] as const;
export const PILOTOS = [2010, 2011, 2012, 2013, 2021, 2022, 2023, 2024] as const;

export interface Marco { ano: number; x: number; construtores: boolean; pilotos: boolean }

export function titleMarks(inicio: number, fim: number, construtores: readonly number[], pilotos: readonly number[]): Marco[] {
  const total = fim - inicio;
  return Array.from({ length: total + 1 }, (_, i) => {
    const ano = inicio + i;
    return { ano, x: i / total, construtores: construtores.includes(ano), pilotos: pilotos.includes(ano) };
  });
}
