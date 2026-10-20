export const FORMATO_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const FORMATO_HORA_ENTRADA = /^(\d{1,2}):(\d{2})$/;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Normaliza una hora al formato `HH:mm` para persistir y responder.
 * Devuelve el valor tal cual cuando no es una hora válida, para que la
 * validación del DTO responda 400.
 */
export function normalizarHora(valor: unknown): unknown {
  if (typeof valor !== 'string') {
    return valor;
  }
  const entrada = valor.trim();
  const coincidencia = FORMATO_HORA_ENTRADA.exec(entrada);
  if (!coincidencia) {
    return valor;
  }
  const horas = Number(coincidencia[1]);
  if (horas > 23) {
    return valor;
  }
  return `${String(horas).padStart(2, '0')}:${coincidencia[2]}`;
}

/**
 * Convierte una fecha ISO al `Date` UTC del día escrito en la cadena.
 * Usa el día literal (no el día UTC del instante) para que un turno de
 * medianoche no se corra de fecha al cruzar husos horarios.
 */
export function aFechaUtc(fecha: string): Date {
  const coincidencia = FORMATO_FECHA.exec(fecha);
  if (!coincidencia) {
    throw new RangeError(`Fecha inválida: ${fecha}`);
  }
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    resultado.getUTCFullYear() !== anio ||
    resultado.getUTCMonth() !== mes - 1 ||
    resultado.getUTCDate() !== dia
  ) {
    throw new RangeError(`Fecha inválida: ${fecha}`);
  }
  return resultado;
}

/** Formatea un `Date` como `AAAA-MM-DD` para responder en la API. */
export function aFechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Indica si la fecha es anterior al día de hoy en UTC. */
export function esFechaPasada(fecha: Date): boolean {
  const ahora = new Date();
  const hoyUtc = Date.UTC(
    ahora.getUTCFullYear(),
    ahora.getUTCMonth(),
    ahora.getUTCDate(),
  );
  return fecha.getTime() < hoyUtc;
}

/** Convierte una hora `HH:mm` a minutos desde medianoche. */
export function minutosDeHora(hora: string): number {
  const coincidencia = FORMATO_HORA_ENTRADA.exec(hora.trim());
  if (!coincidencia) {
    throw new RangeError(`Hora inválida: ${hora}`);
  }
  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) {
    throw new RangeError(`Hora inválida: ${hora}`);
  }
  return horas * 60 + minutos;
}

/**
 * Instante de inicio de un turno: `fecha` + `horaInicio` interpretados en UTC.
 * Es el instante que usan "turno pasado" y la ventana de cancelación.
 * Valida la hora como `HH:mm` y la fecha con `aFechaUtc`.
 */
export function aInstanteInicioUtc(fecha: Date, horaInicio: string): Date {
  const minutos = minutosDeHora(horaInicio);
  const dia = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth();
  const diaMes = fecha.getUTCDate();
  return new Date(
    Date.UTC(dia, mes, diaMes, Math.floor(minutos / 60), minutos % 60),
  );
}
