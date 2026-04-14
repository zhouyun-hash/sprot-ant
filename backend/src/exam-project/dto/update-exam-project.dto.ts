import { PartialType } from '@nestjs/mapped-types';
import { CreateExamProjectDto } from './create-exam-project.dto';

export class UpdateExamProjectDto extends PartialType(CreateExamProjectDto) {}
