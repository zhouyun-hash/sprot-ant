import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from '../grade/entities/grade.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { School } from './entities/school.entity';
import { Campus } from './entities/campus.entity';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';

@Module({
  imports: [TypeOrmModule.forFeature([School, Campus, Grade, Teacher])],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
