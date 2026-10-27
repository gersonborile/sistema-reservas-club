import {
  Body,
  Controller,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/index.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import { AlquileresService } from './alquileres.service.js';
import { CrearAlquilerDto } from './dto/crear-alquiler.dto.js';
import type { AlquilerPublico } from './alquiler-publico.js';

@ApiTags('alquileres')
@ApiBearerAuth()
@Controller()
export class AlquileresController {
  constructor(private readonly alquileresService: AlquileresService) {}

  @Post('reservas/:id/alquiler')
  @ApiOperation({
    summary:
      'Alquila equipamiento para una reserva CONFIRMADA (usuario: solo propias)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Alquiler creado con items y montos congelados; descuenta stock.',
  })
  @ApiResponse({
    status: 400,
    description: 'items inválidos: vacío, cantidad < 1 o no entera, equipamientoId no UUID o repetido.',
  })
  @ApiResponse({ status: 401, description: 'Sin autenticación.' })
  @ApiResponse({
    status: 403,
    description: 'Reserva ajena a un usuario USUARIO.',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva o equipamiento inexistente (id de reserva no UUID → 404).',
  })
  @ApiResponse({
    status: 409,
    description:
      'Reserva cancelada, equipamiento inactivo, stock insuficiente o ya hay alquiler.',
  })
  crear(
    @CurrentUser() usuario: TokenSesion,
    @Param('id') id: string,
    @Body() dto: CrearAlquilerDto,
  ): Promise<AlquilerPublico> {
    return this.alquileresService.crear(usuario, id, dto);
  }
}
