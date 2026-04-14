import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseSchedule, SchoolClass, Teacher])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class CourseScheduleModule {}
