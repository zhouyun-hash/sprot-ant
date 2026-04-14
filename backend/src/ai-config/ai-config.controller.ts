import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { CreateAiConfigDto } from './dto/create-ai-config.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { CreateAiModelDto } from './dto/create-ai-model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  /* ---- /ai-configs ---- */

  @Get('ai-configs')
  findAll(@Query() query: { page?: number; size?: number; keyword?: string; category?: string; status?: string }) {
    return this.aiConfigService.findAll(query);
  }

  @Get('ai-configs/:id')
  findOne(@Param('id') id: number) {
    return this.aiConfigService.findOne(id);
  }

  @Post('ai-configs')
  create(@Body() dto: CreateAiConfigDto) {
    return this.aiConfigService.create(dto);
  }

  @Put('ai-configs/:id')
  update(@Param('id') id: number, @Body() dto: UpdateAiConfigDto) {
    return this.aiConfigService.update(id, dto);
  }

  @Delete('ai-configs/:id')
  remove(@Param('id') id: number) {
    return this.aiConfigService.remove(id);
  }

  /* ---- /ai-models ---- */

  @Get('ai-models')
  findAllModels(@Query() query: { page?: number; size?: number }) {
    return this.aiConfigService.findAllModels(query);
  }

  @Post('ai-models')
  createModel(@Body() dto: CreateAiModelDto) {
    return this.aiConfigService.createModel(dto);
  }

  @Delete('ai-models/:id')
  removeModel(@Param('id') id: number) {
    return this.aiConfigService.removeModel(id);
  }
}
