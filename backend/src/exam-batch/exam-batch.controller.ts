import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamBatchService } from './exam-batch.service';
import { CreateExamBatchDto } from './dto/create-exam-batch.dto';
import { UpdateExamBatchDto } from './dto/update-exam-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exam-batches')
export class ExamBatchController {
  constructor(private readonly service: ExamBatchService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExamBatchDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateExamBatchDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: number) { return this.service.remove(id); }
}
