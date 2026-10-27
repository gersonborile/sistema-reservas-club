import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { validationPipe } from '../../comun/validation-pipe.js';
import { CrearReservaDto } from './crear-reserva.dto.js';
import { ListarReservasQueryDto } from './listar-reservas.query.js';

function Metatipo() {
  return {
    type: 'body' as const,
    metatype: undefined as never,
    data: '',
  };
}

const cuerpo = () => ({
  ...Metatipo(),
  metatype: CrearReservaDto,
});

const consulta = () => ({
  type: 'query' as const,
  metatype: ListarReservasQueryDto,
  data: '',
});

describe('CrearReservaDto', () => {
  const pipe = validationPipe as ValidationPipe;

  async function rechazo(cuerpoEnvio: unknown): Promise<string[]> {
    try {
      await pipe.transform(cuerpoEnvio, cuerpo());
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const respuesta = (error as BadRequestException).getResponse() as {
        message: string | string[];
      };
      return Array.isArray(respuesta.message)
        ? respuesta.message
        : [respuesta.message];
    }
    throw new Error('Se esperaba un rechazo');
  }

  it('acepta un cuerpo válido con solo turnoId', async () => {
    const dto = await pipe.transform(
      {
        turnoId: '11111111-1111-4111-8111-111111111111',
      },
      cuerpo(),
    );
    expect(dto.turnoId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('acepta turnoId y usuarioId válidos', async () => {
    const dto = await pipe.transform(
      {
        turnoId: '11111111-1111-4111-8111-111111111111',
        usuarioId: '22222222-2222-4222-8222-222222222222',
      },
      cuerpo(),
    );
    expect(dto.usuarioId).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('rechaza un cuerpo sin turnoId', async () => {
    const mensajes = await rechazo({});
    expect(mensajes.some((m) => m.includes('turnoId'))).toBe(true);
  });

  it('rechaza un turnoId que no es UUID', async () => {
    const mensajes = await rechazo({ turnoId: 'no-es-uuid' });
    expect(mensajes.some((m) => m.includes('turnoId'))).toBe(true);
  });

  it('rechaza un usuarioId que no es UUID', async () => {
    const mensajes = await rechazo({
      turnoId: '11111111-1111-4111-8111-111111111111',
      usuarioId: 'no-es-uuid',
    });
    expect(mensajes.some((m) => m.includes('usuarioId'))).toBe(true);
  });
});

describe('ListarReservasQueryDto', () => {
  const pipe = validationPipe as ValidationPipe;

  async function rechazo(valor: unknown): Promise<string[]> {
    try {
      await pipe.transform(valor, consulta());
    } catch (error) {
      const respuesta = (error as BadRequestException).getResponse() as {
        message: string | string[];
      };
      return Array.isArray(respuesta.message)
        ? respuesta.message
        : [respuesta.message];
    }
    throw new Error('Se esperaba un rechazo');
  }

  it('acepta una consulta sin usuarioId', async () => {
    const dto = await pipe.transform({}, consulta());
    expect(dto.usuarioId).toBeUndefined();
  });

  it('acepta un usuarioId válido', async () => {
    const dto = await pipe.transform(
      { usuarioId: '22222222-2222-4222-8222-222222222222' },
      consulta(),
    );
    expect(dto.usuarioId).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('rechaza un usuarioId que no es UUID', async () => {
    const mensajes = await rechazo({ usuarioId: 'no-es-uuid' });
    expect(mensajes.some((m) => m.includes('usuarioId'))).toBe(true);
  });
});
