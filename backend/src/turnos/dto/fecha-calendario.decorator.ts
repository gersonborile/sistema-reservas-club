import { registerDecorator, ValidationOptions } from 'class-validator';
import { aFechaUtc } from '../horarios.js';

/** Valida que la cadena empiece con una fecha de calendario real (AAAA-MM-DD). */
export function EsFechaCalendario(opciones?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esFechaCalendario',
      target: object.constructor,
      propertyName,
      options: opciones,
      validator: {
        validate(valor: unknown): boolean {
          if (typeof valor !== 'string') {
            return false;
          }
          try {
            aFechaUtc(valor);
            return true;
          } catch {
            return false;
          }
        },
      },
    });
  };
}
