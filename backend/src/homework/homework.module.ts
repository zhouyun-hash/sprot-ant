import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import { HomeworkSubmission } from './entities/homework-submission.entity';
import { Homework } from './entities/homework.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homework, HomeworkSubmission, Student, User]),
    AuthModule,
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
