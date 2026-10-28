import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export type CampoInvalido = {
  campo: string;
  mensaje: string;
};

/**
 * Recorre el árbol de errores de `class-validator` y arma `{ campo, mensaje }`
 * por cada restricción. Las propiedades anidadas usan notación de puntos,
 * incluidos los índices de arreglos (`items.0.cantidad`).
 */
export function aCamposInvalidos(
  errores: ValidationError[],
  prefijo = '',
): CampoInvalido[] {
  return errores.flatMap((error) => {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    const propios = Object.values(error.constraints ?? {}).map((mensaje) => ({
      campo,
      mensaje,
    }));
    const anidados = aCamposInvalidos(error.children ?? [], campo);
    return [...propios, ...anidados];
  });
}

/**
 * Mismos mensajes que produce Nest por defecto (incluye el prefijo de la ruta
 * en las propiedades anidadas), para no cambiar el contrato de `message`.
 */
function aMensajes(errores: ValidationError[]): string[] {
  return errores.flatMap((error) => aMensajesDeError(error));
}

function aMensajesDeError(
  error: ValidationError,
  rutaPadre?: string,
): string[] {
  if (!error.children || error.children.length === 0) {
    return Object.values(error.constraints ?? {});
  }

  const ruta = rutaPadre
    ? `${rutaPadre}.${error.property}`
    : error.property;
  const mensajes: string[] = [];

  for (const hijo of error.children) {
    if (hijo.children && hijo.children.length > 0) {
      mensajes.push(...aMensajesDeError(hijo, ruta));
    }
    for (const mensaje of Object.values(hijo.constraints ?? {})) {
      mensajes.push(`${ruta}.${mensaje}`);
    }
  }

  return mensajes;
}

/** Pipe global compartido por `main.ts` y los e2e, para validar los DTOs igual que en producción. */
export const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errores) =>
    new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: aMensajes(errores),
      campos: aCamposInvalidos(errores),
    }),
});
