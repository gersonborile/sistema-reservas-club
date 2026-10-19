const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Evita consultar la base con ids que no son UUID, que responderían 500. */
export function esUuid(valor: string): boolean {
  return FORMATO_UUID.test(valor);
}
