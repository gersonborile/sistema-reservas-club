import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/index.js';
import { DisciplinaPublica, DisciplinasService } from './disciplinas.service.js';

@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Public()
  @Get()
  listar(): Promise<DisciplinaPublica[]> {
    return this.disciplinasService.listar();
  }
}
