import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AiRecord } from '../ai/entities/ai-record.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { Alert } from './entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, AiRecord, Teacher]), AuthModule],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
