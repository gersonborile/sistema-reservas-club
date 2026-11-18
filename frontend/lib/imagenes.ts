export const IMAGEN_HERO = "/img/hero.webp";

export const IMAGEN_POR_DEFECTO = "/img/disciplinas/default.webp";

const IMAGENES_DISCIPLINAS: Record<string, string> = {
  tenis: "/img/disciplinas/tenis.webp",
  futbol: "/img/disciplinas/futbol.webp",
  padel: "/img/disciplinas/padel.webp",
};

/**
 * Normaliza el nombre de una disciplina para usarlo como clave de imagen:
 * minúsculas, sin tildes, sin espacios repetidos y sin espacios en los bordes.
 */
export function normalizarDisciplina(nombre: string): string {
  return nombre
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Ruta local de la imagen de una disciplina. Si no hay una imagen específica
 * devuelve la imagen por defecto, que puede no existir todavía.
 */
export function imagenDisciplina(nombre: string): string {
  const clave = normalizarDisciplina(nombre);
  return IMAGENES_DISCIPLINAS[clave] ?? IMAGEN_POR_DEFECTO;
}
