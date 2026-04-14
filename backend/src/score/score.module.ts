import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Student } from '../student/entities/student.entity';
import { Task } from '../task/entities/task.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { ScoreController } from './score.controller';
import { Score } from './entities/score.entity';
import { ScoreService } from './score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Score, Task, Student, SchoolClass, Teacher]),
    AuthModule,
  ],
  controllers: [ScoreController],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
