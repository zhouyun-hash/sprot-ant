import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RtspStream } from './entities/rtsp-stream.entity';
import { RtspService } from './rtsp.service';
import { RtspController } from './rtsp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RtspStream])],
  controllers: [RtspController],
  providers: [RtspService],
  exports: [RtspService],
})
export class RtspModule {}
