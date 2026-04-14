import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';

import { Score } from '../score/entities/score.entity';

import { Student } from '../student/entities/student.entity';

import { SimulationController } from './simulation.controller';

import { SimulationService } from './simulation.service';



@Module({

  imports: [TypeOrmModule.forFeature([Student, Score]), AuthModule],

  controllers: [SimulationController],

  providers: [SimulationService],

})

export class SimulationModule {}

