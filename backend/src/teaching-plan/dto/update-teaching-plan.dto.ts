import { PartialType } from '@nestjs/mapped-types';
import { CreateTeachingPlanDto } from './create-teaching-plan.dto';

export class UpdateTeachingPlanDto extends PartialType(CreateTeachingPlanDto) {}
