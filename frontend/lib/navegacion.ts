/** Arma la URL de login conservando la ruta actual como destino de retorno. */
export function rutaLoginConRetorno(rutaActual: string): string {
  const retorno = rutaActual.startsWith("/") ? rutaActual : "/";
  return `/login?redirigir=${encodeURIComponent(retorno)}`;
}

/**
 * Devuelve una ruta interna segura para volver después del login, o `null`
 * si el valor falta, no empieza con `/` o apunta a otro origen.
 */
export function rutaRetornoSegura(valor: string | null | undefined): string | null {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) {
    return null;
  }
  if (valor.includes("\\")) return null;
  try {
    const url = new URL(valor, "http://localhost");
    if (url.origin !== "http://localhost") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
