import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkCorrectionDto } from './create-homework-correction.dto';

export class UpdateHomeworkCorrectionDto extends PartialType(CreateHomeworkCorrectionDto) {}
