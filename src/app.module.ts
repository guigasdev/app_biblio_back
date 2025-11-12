import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { HomeModule } from './home/home.module';
import { ImageModule } from './image/image.module';
  
@Module({
  imports: [AuthModule, UserModule, EventModule, HomeModule, ImageModule, PrismaModule, ConfigModule.forRoot({isGlobal:true})],
})
export class AppModule {}
