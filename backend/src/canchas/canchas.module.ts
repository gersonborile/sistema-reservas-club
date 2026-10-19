import { Module } from '@nestjs/common';
import { CanchasController } from './canchas.controller.js';
import { CanchasService } from './canchas.service.js';
import { DisciplinasController } from './disciplinas.controller.js';
import { DisciplinasService } from './disciplinas.service.js';

@Module({
  controllers: [CanchasController, DisciplinasController],
  providers: [CanchasService, DisciplinasService],
})
export class CanchasModule {}
