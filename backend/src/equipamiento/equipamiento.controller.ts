import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Public, Roles } from '../auth/index.js';
import { RolUsuario } from '../generated/prisma/client.js';
import { ActualizarEquipamientoDto } from './dto/actualizar-equipamiento.dto.js';
import { CrearEquipamientoDto } from './dto/crear-equipamiento.dto.js';
import { ListarEquipamientoQueryDto } from './dto/listar-equipamiento.query.dto.js';
import { EquipamientoPublico } from './equipamiento-publico.js';
import { EquipamientoService } from './equipamiento.service.js';

@Controller('equipamiento')
export class EquipamientoController {
  constructor(private readonly equipamientoService: EquipamientoService) {}

  @Public()
  @Get()
  listar(
    @Query() query: ListarEquipamientoQueryDto,
  ): Promise<EquipamientoPublico[]> {
    return this.equipamientoService.listar(query);
  }

  @Public()
  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string): Promise<EquipamientoPublico> {
    return this.equipamientoService.detalle(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() dto: CrearEquipamientoDto): Promise<EquipamientoPublico> {
    return this.equipamientoService.crear(dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Put(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEquipamientoDto,
  ): Promise<EquipamientoPublico> {
    return this.equipamientoService.actualizar(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.equipamientoService.eliminar(id);
  }
}
