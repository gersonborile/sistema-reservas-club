import {
  APERTURA,
  CIERRE,
  DURACION_MINUTOS,
  aInstanteInicio,
  esFranjaDelClub,
  franjasDelClub,
  hoyEnZonaClub,
} from './horario-club.js';

describe('franjasDelClub', () => {
  it('devuelve las 14 franjas de 08:00 a 22:00', () => {
    const franjas = franjasDelClub();

    expect(franjas).toHaveLength(14);
    expect(franjas[0]).toEqual({ inicio: '08:00', fin: '09:00' });
    expect(franjas[13]).toEqual({ inicio: '21:00', fin: '22:00' });
  });

  it('las franjas son consecutivas y sin margen', () => {
    const franjas = franjasDelClub();

    for (let i = 1; i < franjas.length; i += 1) {
      expect(franjas[i].inicio).toBe(franjas[i - 1].fin);
    }
  });

  it('deriva el horario de las constantes del club', () => {
    expect(APERTURA).toBe('08:00');
    expect(CIERRE).toBe('22:00');
    expect(DURACION_MINUTOS).toBe(60);
  });
});

describe('esFranjaDelClub', () => {
  it('acepta la primera y la última franja', () => {
    expect(esFranjaDelClub('08:00', '09:00')).toBe(true);
    expect(esFranjaDelClub('21:00', '22:00')).toBe(true);
  });

  it('rechaza horarios fuera de apertura y cierre', () => {
    expect(esFranjaDelClub('07:00', '08:00')).toBe(false);
    expect(esFranjaDelClub('22:00', '23:00')).toBe(false);
  });

  it('rechaza un inicio desalineado', () => {
    expect(esFranjaDelClub('08:30', '09:30')).toBe(false);
  });

  it('rechaza una duración distinta de 60 minutos', () => {
    expect(esFranjaDelClub('09:00', '10:30')).toBe(false);
  });
});

describe('hoyEnZonaClub', () => {
  it('a las 00:30 UTC todavía es el día anterior en Argentina', () => {
    expect(hoyEnZonaClub(new Date('2026-11-10T00:30:00Z'))).toBe('2026-11-09');
  });
});

describe('aInstanteInicio', () => {
  it('interpreta la hora del turno en la zona del club', () => {
    const instante = aInstanteInicio(
      new Date(Date.UTC(2026, 10, 10)),
      '10:00',
    );

    expect(instante.toISOString()).toBe('2026-11-10T13:00:00.000Z');
  });
});
