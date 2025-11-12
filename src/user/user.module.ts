import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [ImageModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
