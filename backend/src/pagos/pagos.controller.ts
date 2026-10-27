import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolUsuario } from '../generated/prisma/client.js';
import { CurrentUser, Roles } from '../auth/index.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagosService } from './pagos.service.js';
import type { PagoPublico } from './pago-publico.js';

@ApiTags('pagos')
@ApiBearerAuth()
@Controller()
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('reservas/:id/pagos')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registra el pago de una reserva (solo admin, reserva CONFIRMADA)',
  })
  @ApiResponse({ status: 201, description: 'Pago creado en estado PENDIENTE.' })
  @ApiResponse({ status: 400, description: 'monto o metodoPago inválidos.' })
  @ApiResponse({ status: 403, description: 'No es ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  @ApiResponse({ status: 409, description: 'Reserva cancelada o ya con pago.' })
  registrar(
    @Param('id') id: string,
    @Body() dto: CrearPagoDto,
  ): Promise<PagoPublico> {
    return this.pagosService.registrar(id, dto);
  }

  @Get('reservas/:id/pagos')
  @ApiOperation({
    summary: 'Consulta el pago de una reserva (usuario: solo propias)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pago con monto, metodoPago, estado y fechaPago.',
  })
  @ApiResponse({ status: 403, description: 'Reserva ajena.' })
  @ApiResponse({ status: 404, description: 'Reserva o pago no encontrado.' })
  obtenerDeReserva(
    @CurrentUser() usuario: TokenSesion,
    @Param('id') id: string,
  ): Promise<PagoPublico> {
    return this.pagosService.obtenerDeReserva(usuario, id);
  }

  @Patch('pagos/:id/pagar')
  @HttpCode(HttpStatus.OK)
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Confirma el cobro: PENDIENTE → PAGADO (solo admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pago PAGADO con fechaPago registrada.',
  })
  @ApiResponse({ status: 403, description: 'No es ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Transición inválida: el pago no está PENDIENTE.',
  })
  pagar(@Param('id') id: string): Promise<PagoPublico> {
    return this.pagosService.pagar(id);
  }

  @Patch('pagos/:id/anular')
  @HttpCode(HttpStatus.OK)
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Anula un pago PENDIENTE o PAGADO: pasa a ANULADO (solo admin)',
  })
  @ApiResponse({ status: 200, description: 'Pago ANULADO (estado terminal).' })
  @ApiResponse({ status: 403, description: 'No es ADMINISTRADOR.' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
  @ApiResponse({ status: 409, description: 'El pago ya está ANULADO.' })
  anular(@Param('id') id: string): Promise<PagoPublico> {
    return this.pagosService.anular(id);
  }
}
