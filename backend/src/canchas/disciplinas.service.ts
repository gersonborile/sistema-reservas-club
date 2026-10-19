import { Injectable } from '@nestjs/common';
import { Disciplina } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type DisciplinaPublica = Pick<
  Disciplina,
  'id' | 'nombre' | 'duracionTipicaMinutos' | 'reglas'
>;

/** Disciplinas base del club: datos de solo lectura provistos por el seed. */
@Injectable()
export class DisciplinasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<DisciplinaPublica[]> {
    return this.prisma.disciplina.findMany({
      select: {
        id: true,
        nombre: true,
        duracionTipicaMinutos: true,
        reglas: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }
}
