import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Student } from '../student/entities/student.entity';
import { TaskCheckin } from './entities/task-checkin.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskCheckin, Student]), AuthModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
