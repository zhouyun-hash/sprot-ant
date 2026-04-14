import { PartialType } from '@nestjs/mapped-types';
import { CreateRtspStreamDto } from './create-rtsp-stream.dto';

export class UpdateRtspStreamDto extends PartialType(CreateRtspStreamDto) {}
