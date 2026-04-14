import { PartialType } from '@nestjs/mapped-types';
import { CreateExamStandardDto } from './create-exam-standard.dto';

export class UpdateExamStandardDto extends PartialType(CreateExamStandardDto) {}
