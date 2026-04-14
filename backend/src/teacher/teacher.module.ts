import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ParentModule } from '../parent/parent.module';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { TeacherController } from './teacher.controller';
import { TeacherParentAccessController } from './teacher-parent-access.controller';
import { TeacherService } from './teacher.service';
import { SchoolClass } from '../class/entities/school-class.entity';
import { School } from '../school/entities/school.entity';
import { Student } from '../student/entities/student.entity';
import { Teacher } from './entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User, School, SchoolClass, Student]),
    UserModule,
    AuthModule,
    ParentModule,
  ],
  controllers: [TeacherController, TeacherParentAccessController],
  providers: [TeacherService],
  exports: [TeacherService, TypeOrmModule],
})
export class TeacherModule {}
