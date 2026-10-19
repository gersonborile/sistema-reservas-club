import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { ListarTurnosQueryDto } from './dto/listar-turnos.query.js';
import { TurnoPublico } from './turno-publico.js';
import { TurnosService } from './turnos.service.js';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Public()
  @Get()
  listar(@Query() filtros: ListarTurnosQueryDto): Promise<TurnoPublico[]> {
    return this.turnosService.listar(filtros);
  }

  @Public()
  @Get(':id')
  porId(@Param('id') id: string): Promise<TurnoPublico> {
    return this.turnosService.porId(id);
  }
}
