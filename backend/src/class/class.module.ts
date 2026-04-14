import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Grade } from '../grade/entities/grade.entity';
import { School } from '../school/entities/school.entity';
import { Score } from '../score/entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { SchoolClass } from './entities/school-class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClass,
      Student,
      Teacher,
      School,
      Grade,
      Score,
    ]),
    AuthModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
