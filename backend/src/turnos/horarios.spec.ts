import {
  aFechaIso,
  aFechaUtc,
  aInstanteInicioUtc,
  esFechaPasada,
  normalizarHora,
} from './horarios.js';

describe('normalizarHora', () => {
  it('normaliza a HH:mm con cero a la izquierda', () => {
    expect(normalizarHora('8:00')).toBe('08:00');
    expect(normalizarHora('09:5')).toBe('09:5');
    expect(normalizarHora('18:30')).toBe('18:30');
    expect(normalizarHora(' 23:59 ')).toBe('23:59');
  });

  it('deja pasar valores inválidos para que el DTO los rechace', () => {
    expect(normalizarHora('24:00')).toBe('24:00');
    expect(normalizarHora('12:60')).toBe('12:60');
    expect(normalizarHora('no-es-hora')).toBe('no-es-hora');
    expect(normalizarHora(undefined)).toBeUndefined();
  });
});

describe('aFechaUtc', () => {
  it('interpreta el día literal de la cadena, sin corrimiento por huso', () => {
    const fecha = aFechaUtc('2026-09-15');
    expect(fecha.toISOString()).toBe('2026-09-15T00:00:00.000Z');
    expect(fecha.getUTCFullYear()).toBe(2026);
    expect(fecha.getUTCMonth()).toBe(8);
    expect(fecha.getUTCDate()).toBe(15);
  });

  it('un turno a medianoche conserva la fecha del día al persistir y leer', () => {
    const fecha = aFechaUtc('2026-03-01');
    const persistida = new Date(fecha.getTime());
    expect(aFechaIso(persistida)).toBe('2026-03-01');
  });

  it('rechaza fechas con formato inválido o día inexistente', () => {
    expect(() => aFechaUtc('15/09/2026')).toThrow(RangeError);
    expect(() => aFechaUtc('2026-02-30')).toThrow(RangeError);
  });
});

describe('esFechaPasada', () => {
  it('considera pasada una fecha anterior a hoy y no pasada la de hoy', () => {
    const hoy = new Date();
    const hoyUtc = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()),
    );
    const ayer = new Date(hoyUtc.getTime() - 24 * 60 * 60 * 1000);

    expect(esFechaPasada(ayer)).toBe(true);
    expect(esFechaPasada(hoyUtc)).toBe(false);
  });
});

describe('aInstanteInicioUtc', () => {
  it('combina fecha y hora de inicio en UTC', () => {
    const instante = aInstanteInicioUtc(new Date(Date.UTC(2026, 9, 15)), '21:30');
    expect(instante.toISOString()).toBe('2026-10-15T21:30:00.000Z');
  });

  it('un turno a medianoche cae en la medianoche del día de la fecha', () => {
    const instante = aInstanteInicioUtc(new Date(Date.UTC(2026, 2, 1)), '00:00');
    expect(instante.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('funciona igual al correr la prueba en cualquier huso horario', () => {
    const instante = aInstanteInicioUtc(new Date(Date.UTC(2026, 5, 9)), '12:00');
    expect(instante.toISOString()).toBe('2026-06-09T12:00:00.000Z');
  });

  it('rechaza horas con formato inválido', () => {
    expect(() =>
      aInstanteInicioUtc(new Date(Date.UTC(2026, 0, 1)), '24:00'),
    ).toThrow(RangeError);
    expect(() =>
      aInstanteInicioUtc(new Date(Date.UTC(2026, 0, 1)), 'no-es-hora'),
    ).toThrow(RangeError);
  });
});
