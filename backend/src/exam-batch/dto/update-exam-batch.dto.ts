import { PartialType } from '@nestjs/mapped-types';
import { CreateExamBatchDto } from './create-exam-batch.dto';

export class UpdateExamBatchDto extends PartialType(CreateExamBatchDto) {}
