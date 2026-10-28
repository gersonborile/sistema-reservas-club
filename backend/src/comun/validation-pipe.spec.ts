import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { LoginDto } from '../auth/dto/login.dto.js';
import { RegistroDto } from '../auth/dto/registro.dto.js';
import { aCamposInvalidos, validationPipe } from './validation-pipe.js';

async function validar<T extends object>(
  valor: Record<string, unknown>,
  metatype: new () => T,
): Promise<BadRequestException> {
  try {
    await validationPipe.transform(valor, { type: 'body', metatype });
  } catch (error) {
    if (error instanceof BadRequestException) return error;
    throw error;
  }
  throw new Error('Se esperaba un BadRequestException.');
}

describe('validationPipe', () => {
  it('identifica el campo de un email inválido en el login', async () => {
    const error = await validar(
      { email: 'no-es-un-email', contrasena: 'Socio123!' },
      LoginDto,
    );
    const cuerpo = error.getResponse() as {
      campos: { campo: string; mensaje: string }[];
    };

    expect(cuerpo.campos).toEqual([
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
    ]);
  });

  it('incluye un elemento por cada campo inválido en el registro', async () => {
    const error = await validar(
      {
        nombre: '',
        contacto: '+54 9 11 0000 0000',
        email: 'socio@club.test',
        contrasena: 'corta1',
      },
      RegistroDto,
    );
    const cuerpo = error.getResponse() as {
      campos: { campo: string; mensaje: string }[];
    };

    expect(cuerpo.campos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campo: 'nombre' }),
        expect.objectContaining({ campo: 'contrasena' }),
      ]),
    );
  });

  it('incluye las propiedades no permitidas por el DTO', async () => {
    const error = await validar(
      {
        email: 'socio@club.test',
        contrasena: 'Socio123!',
        rol: 'ADMINISTRADOR',
      },
      LoginDto,
    );
    const cuerpo = error.getResponse() as {
      campos: { campo: string; mensaje: string }[];
    };

    expect(cuerpo.campos).toEqual([
      { campo: 'rol', mensaje: 'property rol should not exist' },
    ]);
  });

  it('conserva statusCode, error y el arreglo message', async () => {
    const error = await validar(
      { email: 'no-es-un-email', contrasena: 'Socio123!' },
      LoginDto,
    );

    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: ['El email no tiene un formato válido.'],
      campos: [
        { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
      ],
    });
  });

  it('usa notación de puntos para propiedades anidadas', () => {
    const anidado: ValidationError = {
      property: 'items',
      constraints: undefined,
      children: [
        {
          property: '0',
          constraints: undefined,
          children: [
            {
              property: 'cantidad',
              constraints: { min: 'La cantidad debe ser mayor que cero.' },
            },
          ],
        },
      ],
    };

    expect(aCamposInvalidos([anidado])).toEqual([
      { campo: 'items.0.cantidad', mensaje: 'La cantidad debe ser mayor que cero.' },
    ]);
  });
});
