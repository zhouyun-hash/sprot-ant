import { PartialType } from '@nestjs/mapped-types';
import { CreateExamPlanDto } from './create-exam-plan.dto';

export class UpdateExamPlanDto extends PartialType(CreateExamPlanDto) {}
