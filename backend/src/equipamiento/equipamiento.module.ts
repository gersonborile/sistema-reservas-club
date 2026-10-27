import { Module } from '@nestjs/common';
import { EquipamientoController } from './equipamiento.controller.js';
import { EquipamientoService } from './equipamiento.service.js';

@Module({
  controllers: [EquipamientoController],
  providers: [EquipamientoService],
})
export class EquipamientoModule {}
