import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamProjectService } from './exam-project.service';
import { CreateExamProjectDto } from './dto/create-exam-project.dto';
import { UpdateExamProjectDto } from './dto/update-exam-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exam-projects')
export class ExamProjectController {
  constructor(private readonly service: ExamProjectService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; keyword?: string; category?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExamProjectDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateExamProjectDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: number) { return this.service.remove(id); }

  @Put(':id/toggle')
  toggle(@Param('id') id: number) { return this.service.toggleEnabled(id); }
}
