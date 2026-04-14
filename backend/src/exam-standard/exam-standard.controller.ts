import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamStandardService } from './exam-standard.service';
import { CreateExamStandardDto } from './dto/create-exam-standard.dto';
import { UpdateExamStandardDto } from './dto/update-exam-standard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exam-standards')
export class ExamStandardController {
  constructor(private readonly service: ExamStandardService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; projectId?: number; gender?: string; version?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExamStandardDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateExamStandardDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: number) { return this.service.remove(id); }
}
