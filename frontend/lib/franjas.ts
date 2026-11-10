export const APERTURA = "08:00";
export const CIERRE = "22:00";
export const DURACION_MINUTOS = 60;

export type Franja = {
  inicio: string;
  fin: string;
};

function aMinutos(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function aHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

/** Franjas fijas del club, igual que el backend. */
export function franjasDelClub(): Franja[] {
  const apertura = aMinutos(APERTURA);
  const cierre = aMinutos(CIERRE);
  const franjas: Franja[] = [];
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

/**
 * Horario con el que se abre la edición de un turno: si el inicio es una
 * franja del club, el fin es siempre el de esa franja (corrige turnos viejos
 * de otra duración); si no lo es, queda vacío para que el admin elija una.
 */
export function horarioParaEditar(horaInicio: string): {
  horaInicio: string;
  horaFin: string;
} {
  const franja = franjasDelClub().find((f) => f.inicio === horaInicio);
  return franja
    ? { horaInicio: franja.inicio, horaFin: franja.fin }
    : { horaInicio: "", horaFin: "" };
}
