import { PartialType } from '@nestjs/mapped-types';
import { CreateTeachingResourceDto } from './create-teaching-resource.dto';

export class UpdateTeachingResourceDto extends PartialType(CreateTeachingResourceDto) {}
