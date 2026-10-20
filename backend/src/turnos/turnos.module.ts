import { Module } from '@nestjs/common';
import { DisponibilidadController } from './disponibilidad.controller.js';
import { TurnosController } from './turnos.controller.js';
import { TurnosService } from './turnos.service.js';

@Module({
  controllers: [TurnosController, DisponibilidadController],
  providers: [TurnosService],
})
export class TurnosModule {}
