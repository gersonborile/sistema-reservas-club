import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { DisponibilidadQueryDto } from './dto/disponibilidad.query.js';
import { TurnoPublico } from './turno-publico.js';
import { TurnosService } from './turnos.service.js';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly turnosService: TurnosService) {}

  @Public()
  @Get()
  consultar(
    @Query() filtros: DisponibilidadQueryDto,
  ): Promise<TurnoPublico[]> {
    return this.turnosService.disponibles(filtros);
  }
}
