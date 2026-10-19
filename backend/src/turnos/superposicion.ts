import { minutosDeHora } from './horarios.js';

export type RangoHorario = {
  inicio: string;
  fin: string;
};

/**
 * Dos rangos semiabiertos `[inicio, fin)` se superponen cuando
 * `inicioA < finB && inicioB < finA`: los turnos contiguos no se solapan.
 */
export function seSuperponen(
  rangoA: RangoHorario,
  rangoB: RangoHorario,
): boolean {
  const inicioA = minutosDeHora(rangoA.inicio);
  const finA = minutosDeHora(rangoA.fin);
  const inicioB = minutosDeHora(rangoB.inicio);
  const finB = minutosDeHora(rangoB.fin);
  return inicioA < finB && inicioB < finA;
}
