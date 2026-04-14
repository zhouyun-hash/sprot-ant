import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGradeDto } from './create-grade.dto';

/** 编辑年级时不可修改所属学校（仅能通过删除/重建变更，避免跨校误改） */
export class UpdateGradeDto extends PartialType(OmitType(CreateGradeDto, ['schoolId'] as const)) {}
