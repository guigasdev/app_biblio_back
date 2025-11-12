import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [ImageModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}


