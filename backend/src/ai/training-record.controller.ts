import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTrainingRecordDto } from './dto/create-training-record.dto';
import { AiService } from './ai.service';

@Controller('training-record')
@UseGuards(JwtAuthGuard)
export class TrainingRecordController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  create(
    @Body() dto: CreateTrainingRecordDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.aiService.createTrainingRecord(dto, req.user);
  }
}
