import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SelfTrainingDto } from './dto/self-training.dto';
import { AiService } from './ai.service';

/** 与部分端上约定的 `/api/ai/*` 路径兼容 */
@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class ApiAiController {
  constructor(private readonly aiService: AiService) {}

  @Post('self-training')
  selfTraining(
    @Body() dto: SelfTrainingDto,
    @Req() req: Request & { user: { id: number; role: string; username: string } },
  ) {
    return this.aiService.selfTraining(dto, req.user);
  }
}
