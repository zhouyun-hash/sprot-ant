import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisePrescription } from './entities/exercise-prescription.entity';
import { ExercisePrescriptionService } from './exercise-prescription.service';
import { ExercisePrescriptionController } from './exercise-prescription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExercisePrescription])],
  controllers: [ExercisePrescriptionController],
  providers: [ExercisePrescriptionService],
  exports: [ExercisePrescriptionService],
})
export class ExercisePrescriptionModule {}
