import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CanchasModule } from './canchas/canchas.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReservasModule } from './reservas/reservas.module.js';
import { TurnosModule } from './turnos/turnos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CanchasModule,
    TurnosModule,
    ReservasModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
