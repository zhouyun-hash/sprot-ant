import { PartialType } from '@nestjs/mapped-types';
import { CreateExercisePrescriptionDto } from './create-exercise-prescription.dto';

export class UpdateExercisePrescriptionDto extends PartialType(CreateExercisePrescriptionDto) {}
