import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamProject } from './entities/exam-project.entity';
import { ExamProjectService } from './exam-project.service';
import { ExamProjectController } from './exam-project.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamProject])],
  controllers: [ExamProjectController],
  providers: [ExamProjectService],
  exports: [ExamProjectService],
})
export class ExamProjectModule {}
