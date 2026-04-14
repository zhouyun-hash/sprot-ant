import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../school/entities/school.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { Grade } from './entities/grade.entity';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, School, Teacher])],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService],
})
export class GradeModule {}
