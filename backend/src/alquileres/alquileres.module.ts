import { Module } from '@nestjs/common';
import { AlquileresController } from './alquileres.controller.js';
import { AlquileresService } from './alquileres.service.js';

@Module({
  controllers: [AlquileresController],
  providers: [AlquileresService],
})
export class AlquileresModule {}
