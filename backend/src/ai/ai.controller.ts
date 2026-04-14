import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAiResultDto } from './dto/create-ai-result.dto';
import { CreateAiSessionDto } from './dto/create-ai-session.dto';
import { SelfTrainingDto } from './dto/self-training.dto';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('session')
  createSession(@Body() dto: CreateAiSessionDto) {
    return this.aiService.createSession(dto);
  }

  @Post('result')
  createResult(@Body() dto: CreateAiResultDto) {
    return this.aiService.createResult(dto);
  }

  @Get('session/:sessionId/status')
  getSessionStatus(@Param('sessionId') sessionId: string) {
    return this.aiService.getSessionStatus(sessionId);
  }

  @Delete('session/:sessionId')
  endSession(@Param('sessionId') sessionId: string) {
    return this.aiService.endSession(sessionId);
  }

  @Post('self-training')
  selfTraining(
    @Body() dto: SelfTrainingDto,
    @Req() req: Request & { user: { id: number; role: string; username: string } },
  ) {
    return this.aiService.selfTraining(dto, req.user);
  }
}
