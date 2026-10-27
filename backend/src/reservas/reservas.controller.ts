import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/index.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import { CrearReservaDto } from './dto/crear-reserva.dto.js';
import { ListarReservasQueryDto } from './dto/listar-reservas.query.js';
import { ReservaPublica } from './reserva-publico.js';
import { ReservasService } from './reservas.service.js';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  crear(
    @CurrentUser() usuario: TokenSesion,
    @Body() dto: CrearReservaDto,
  ): Promise<ReservaPublica> {
    return this.reservasService.crear(usuario, dto);
  }

  @Get('mis')
  listar(
    @CurrentUser() usuario: TokenSesion,
    @Query() filtros: ListarReservasQueryDto,
  ): Promise<ReservaPublica[]> {
    return this.reservasService.listar(usuario, filtros);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancelar(
    @CurrentUser() usuario: TokenSesion,
    @Param('id') id: string,
  ): Promise<ReservaPublica> {
    return this.reservasService.cancelar(usuario, id);
  }
}
