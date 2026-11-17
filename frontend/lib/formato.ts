const MONEDA = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Precio en pesos argentinos, sin decimales cuando el backend lo entrega entero. */
export function formatearMoneda(valor: number): string {
  return MONEDA.format(Number.isFinite(valor) ? valor : 0);
}

/** "60 min" para una duración positiva; `null` si no hay duración válida. */
export function formatearDuracion(minutos: number | null | undefined): string | null {
  if (typeof minutos !== "number" || !Number.isFinite(minutos) || minutos <= 0) {
    return null;
  }
  return `${minutos} min`;
}
