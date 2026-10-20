import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolUsuario } from '../generated/prisma/client.js';
import { ActualizarTurnoDto } from './dto/actualizar-turno.dto.js';
import { CrearTurnoDto } from './dto/crear-turno.dto.js';
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

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() dto: CrearTurnoDto): Promise<TurnoPublico> {
    return this.turnosService.crear(dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch(':id')
  modificar(
    @Param('id') id: string,
    @Body() dto: ActualizarTurnoDto,
  ): Promise<TurnoPublico> {
    return this.turnosService.modificar(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id') id: string): Promise<void> {
    return this.turnosService.eliminar(id);
  }
}
