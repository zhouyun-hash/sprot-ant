import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamStandard } from './entities/exam-standard.entity';
import { ExamStandardService } from './exam-standard.service';
import { ExamStandardController } from './exam-standard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamStandard])],
  controllers: [ExamStandardController],
  providers: [ExamStandardService],
  exports: [ExamStandardService],
})
export class ExamStandardModule {}
