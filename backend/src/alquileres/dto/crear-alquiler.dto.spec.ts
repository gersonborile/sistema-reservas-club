import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { validationPipe } from '../../comun/validation-pipe.js';
import { CrearAlquilerDto } from './crear-alquiler.dto.js';

const UUID_VALIDO = '11111111-1111-4111-8111-111111111111';

function Metatipo() {
  return {
    type: 'body' as const,
    metatype: undefined as never,
    data: '',
  };
}

const cuerpo = () => ({
  ...Metatipo(),
  metatype: CrearAlquilerDto,
});

describe('CrearAlquilerDto', () => {
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

  it('acepta un cuerpo válido con un item', async () => {
    const dto = await pipe.transform(
      { items: [{ equipamientoId: UUID_VALIDO, cantidad: 2 }] },
      cuerpo(),
    );
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0].equipamientoId).toBe(UUID_VALIDO);
    expect(dto.items[0].cantidad).toBe(2);
  });

  it('rechaza un cuerpo sin items', async () => {
    const mensajes = await rechazo({});
    expect(mensajes.some((m) => m.includes('items'))).toBe(true);
  });

  it('rechaza items vacío', async () => {
    const mensajes = await rechazo({ items: [] });
    expect(mensajes.some((m) => m.includes('items'))).toBe(true);
  });

  it('rechaza una cantidad menor a 1', async () => {
    const mensajes = await rechazo({
      items: [{ equipamientoId: UUID_VALIDO, cantidad: 0 }],
    });
    expect(mensajes.some((m) => m.includes('cantidad'))).toBe(true);
  });

  it('rechaza una cantidad que no es entera', async () => {
    const mensajes = await rechazo({
      items: [{ equipamientoId: UUID_VALIDO, cantidad: 1.5 }],
    });
    expect(mensajes.some((m) => m.includes('cantidad'))).toBe(true);
  });

  it('rechaza un equipamientoId que no es UUID', async () => {
    const mensajes = await rechazo({
      items: [{ equipamientoId: 'no-es-uuid', cantidad: 1 }],
    });
    expect(mensajes.some((m) => m.includes('equipamientoId'))).toBe(true);
  });

  it('rechaza equipamientos repetidos', async () => {
    const mensajes = await rechazo({
      items: [
        { equipamientoId: UUID_VALIDO, cantidad: 1 },
        { equipamientoId: UUID_VALIDO, cantidad: 2 },
      ],
    });
    expect(
      mensajes.some((m) => m.toLowerCase().includes('repetir') || m.includes('items')),
    ).toBe(true);
  });

  it('acepta varios items de equipamientos distintos', async () => {
    const dto = await pipe.transform(
      {
        items: [
          { equipamientoId: UUID_VALIDO, cantidad: 1 },
          {
            equipamientoId: '22222222-2222-4222-8222-222222222222',
            cantidad: 3,
          },
        ],
      },
      cuerpo(),
    );
    expect(dto.items).toHaveLength(2);
  });
});
