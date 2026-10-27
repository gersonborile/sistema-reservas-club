import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { validationPipe } from '../../comun/validation-pipe.js';
import { CrearPagoDto } from './crear-pago.dto.js';

function Metatipo() {
  return {
    type: 'body' as const,
    metatype: undefined as never,
    data: '',
  };
}

const cuerpo = () => ({
  ...Metatipo(),
  metatype: CrearPagoDto,
});

describe('CrearPagoDto', () => {
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

  it('acepta un cuerpo válido', async () => {
    const dto = await pipe.transform(
      { monto: 15.5, metodoPago: 'EFECTIVO' },
      cuerpo(),
    );
    expect(dto.monto).toBe(15.5);
    expect(dto.metodoPago).toBe('EFECTIVO');
  });

  it('rechaza un cuerpo sin monto', async () => {
    const mensajes = await rechazo({ metodoPago: 'EFECTIVO' });
    expect(mensajes.some((m) => m.includes('monto'))).toBe(true);
  });

  it('rechaza un monto cero o negativo', async () => {
    const mensajes = await rechazo({ monto: 0, metodoPago: 'EFECTIVO' });
    expect(mensajes.some((m) => m.includes('monto'))).toBe(true);
  });

  it('rechaza un monto que no es número', async () => {
    const mensajes = await rechazo({ monto: 'grande', metodoPago: 'EFECTIVO' });
    expect(mensajes.some((m) => m.includes('monto'))).toBe(true);
  });

  it('rechaza un monto con más de 2 decimales', async () => {
    const mensajes = await rechazo({ monto: 10.999, metodoPago: 'EFECTIVO' });
    expect(mensajes.some((m) => m.includes('monto'))).toBe(true);
  });

  it('rechaza un cuerpo sin metodoPago', async () => {
    const mensajes = await rechazo({ monto: 15.5 });
    expect(mensajes.some((m) => m.includes('metodoPago'))).toBe(true);
  });

  it('rechaza un metodoPago fuera del enum', async () => {
    const mensajes = await rechazo({ monto: 15.5, metodoPago: 'CRIPTO' });
    expect(mensajes.some((m) => m.includes('metodoPago'))).toBe(true);
  });
});
