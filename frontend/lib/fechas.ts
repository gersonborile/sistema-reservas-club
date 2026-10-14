const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DIAS_ABBREV = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function parsearFecha(fecha: string): Date | null {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

/** Fecha ISO local (AAAA-MM-DD), independiente del huso del navegador. */
export function obtenerFechaLocalHoy(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Fecha ISO (AAAA-MM-DD) a "DD/MM"; devuelve el valor original si no es válida. */
export function formatearFecha(fecha: string): string {
  const date = parsearFecha(fecha);
  if (!date) return fecha;
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** Fecha corta con día abreviado ("Mié 07/10"); devuelve el valor original si no es válida. */
export function formatearFechaAbreviada(fecha: string): string {
  const date = parsearFecha(fecha);
  if (!date) return fecha;
  return `${DIAS_ABBREV[date.getDay()]} ${formatearFecha(fecha)}`;
}

/** Nombre del día de la semana en español; cadena vacía si la fecha no es válida. */
export function diaSemana(fecha: string): string {
  const date = parsearFecha(fecha);
  if (!date) return "";
  return DIAS[date.getDay()];
}

/** Hora "HH:MM" una hora después, en el mismo formato. */
export function sumarUnaHora(hora: string): string {
  const [horaStr, minutosStr] = hora.split(":");
  const horaNum = Number(horaStr);
  if (Number.isNaN(horaNum)) return hora;
  const siguiente = (horaNum + 1) % 24;
  return `${String(siguiente).padStart(2, "0")}:${(minutosStr ?? "00").padStart(2, "0")}`;
}
