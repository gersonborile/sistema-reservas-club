import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CanchasModule } from './canchas/canchas.module.js';
import { EquipamientoModule } from './equipamiento/equipamiento.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CanchasModule,
    EquipamientoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
