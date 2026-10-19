import { seSuperponen } from './superposicion.js';

describe('seSuperponen', () => {
  const base = { inicio: '10:00', fin: '11:00' };

  it('no se superpone con turnos contiguos', () => {
    expect(seSuperponen(base, { inicio: '09:00', fin: '10:00' })).toBe(false);
    expect(seSuperponen(base, { inicio: '11:00', fin: '12:00' })).toBe(false);
  });

  it('detecta superposición parcial', () => {
    expect(seSuperponen(base, { inicio: '10:30', fin: '11:30' })).toBe(true);
    expect(seSuperponen(base, { inicio: '09:30', fin: '10:30' })).toBe(true);
  });

  it('detecta superposición total (contenido o contenedor)', () => {
    expect(seSuperponen(base, { inicio: '10:15', fin: '10:45' })).toBe(true);
    expect(seSuperponen(base, { inicio: '09:00', fin: '12:00' })).toBe(true);
  });

  it('detecta superposición de rangos idénticos', () => {
    expect(seSuperponen(base, { inicio: '10:00', fin: '11:00' })).toBe(true);
  });

  it('no se superpone con turnos disjuntos', () => {
    expect(seSuperponen(base, { inicio: '08:00', fin: '09:00' })).toBe(false);
    expect(seSuperponen(base, { inicio: '12:00', fin: '13:00' })).toBe(false);
  });
});
