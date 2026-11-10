import { minutosDeHora } from './horarios.js';
import { RangoHorario } from './superposicion.js';

export const APERTURA = '08:00';
export const CIERRE = '22:00';
export const DURACION_MINUTOS = 60;
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

function aHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

/** Franjas fijas del club, derivadas de apertura, cierre y duración. */
export function franjasDelClub(): RangoHorario[] {
  const apertura = minutosDeHora(APERTURA);
  const cierre = minutosDeHora(CIERRE);
  const franjas: RangoHorario[] = [];
  for (
    let inicio = apertura;
    inicio + DURACION_MINUTOS <= cierre;
    inicio += DURACION_MINUTOS
  ) {
    franjas.push({
      inicio: aHora(inicio),
      fin: aHora(inicio + DURACION_MINUTOS),
    });
  }
  return franjas;
}

/** Indica si el par inicio/fin coincide exactamente con una franja del club. */
export function esFranjaDelClub(inicio: string, fin: string): boolean {
  return franjasDelClub().some(
    (franja) => franja.inicio === inicio && franja.fin === fin,
  );
}

function partesEnZona(instante: Date): Record<string, number> {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instante);

  const valores: Record<string, number> = {};
  for (const parte of partes) {
    if (parte.type !== 'literal') {
      valores[parte.type] = Number(parte.value);
    }
  }
  return valores;
}

/** Día `AAAA-MM-DD` vigente en la zona del club para el instante dado. */
export function hoyEnZonaClub(ahora: Date = new Date()): string {
  const valores = partesEnZona(ahora);
  const anio = String(valores.year).padStart(4, '0');
  const mes = String(valores.month).padStart(2, '0');
  const dia = String(valores.day).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function desfaseMinutos(instante: Date): number {
  const valores = partesEnZona(instante);
  const enZonaComoUtc = Date.UTC(
    valores.year,
    valores.month - 1,
    valores.day,
    valores.hour,
    valores.minute,
    valores.second,
  );
  return (enZonaComoUtc - instante.getTime()) / 60000;
}

/**
 * Instante real de inicio de un turno: la fecha literal y la hora se
 * interpretan en la zona del club. El desfase se calcula con `Intl` para
 * ese día, sin asumir un -3 fijo.
 */
export function aInstanteInicio(fecha: Date, horaInicio: string): Date {
  const minutos = minutosDeHora(horaInicio);
  const comoSiFueraUtc = Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    Math.floor(minutos / 60),
    minutos % 60,
  );
  let instante = new Date(
    comoSiFueraUtc - desfaseMinutos(new Date(comoSiFueraUtc)) * 60000,
  );
  instante = new Date(comoSiFueraUtc - desfaseMinutos(instante) * 60000);
  return instante;
}
