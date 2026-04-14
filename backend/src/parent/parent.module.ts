import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SchoolClass } from '../class/entities/school-class.entity';
import { HomeworkModule } from '../homework/homework.module';
import { ReportModule } from '../report/report.module';
import { ScoreModule } from '../score/score.module';
import { Student } from '../student/entities/student.entity';
import { StudentModule } from '../student/student.module';
import { Teacher } from '../teacher/entities/teacher.entity';
import { User } from '../user/entities/user.entity';
import { ParentStudentAccess } from './entities/parent-student-access.entity';
import { ParentController } from './parent.controller';
import { ParentStudentAccessService } from './parent-student-access.service';
import { ParentService } from './parent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Student, ParentStudentAccess, SchoolClass, Teacher]),
    AuthModule,
    StudentModule,
    ReportModule,
    HomeworkModule,
    ScoreModule,
  ],
  controllers: [ParentController],
  providers: [ParentService, ParentStudentAccessService],
  exports: [ParentService, ParentStudentAccessService],
})
export class ParentModule {}
