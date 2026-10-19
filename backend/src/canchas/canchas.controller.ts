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
import { CanchaPublica } from './cancha-publica.js';
import { CanchasService } from './canchas.service.js';
import { CreateCanchaDto } from './dto/create-cancha.dto.js';
import { ListarCanchasQueryDto } from './dto/listar-canchas.query.dto.js';
import { UpdateCanchaDto } from './dto/update-cancha.dto.js';

@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Public()
  @Get()
  listar(@Query() query: ListarCanchasQueryDto): Promise<CanchaPublica[]> {
    return this.canchasService.listar(query);
  }

  @Public()
  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string): Promise<CanchaPublica> {
    return this.canchasService.detalle(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() dto: CreateCanchaDto): Promise<CanchaPublica> {
    return this.canchasService.crear(dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Put(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCanchaDto,
  ): Promise<CanchaPublica> {
    return this.canchasService.actualizar(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.canchasService.eliminar(id);
  }
}
