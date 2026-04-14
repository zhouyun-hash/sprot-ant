import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TrainingRecord } from '../ai/entities/training-record.entity';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Score } from '../score/entities/score.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { ParentStudentAccess } from '../parent/entities/parent-student-access.entity';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from './entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      User,
      SchoolClass,
      Teacher,
      TrainingRecord,
      Score,
      ParentStudentAccess,
    ]),
    UserModule,
    AuthModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService, TypeOrmModule],
})
export class StudentModule {}
