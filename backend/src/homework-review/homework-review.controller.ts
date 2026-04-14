import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HomeworkReviewService } from './homework-review.service';
import { CreateHomeworkCorrectionDto } from './dto/create-homework-correction.dto';
import { UpdateHomeworkCorrectionDto } from './dto/update-homework-correction.dto';

@UseGuards(JwtAuthGuard)
@Controller('homework-corrections')
export class HomeworkReviewController {
  constructor(private readonly homeworkReviewService: HomeworkReviewService) {}

  @Get()
  findAll(
    @Query() query: {
      page?: number;
      size?: number;
      status?: string;
      submissionId?: number;
    },
  ) {
    return this.homeworkReviewService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.homeworkReviewService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHomeworkCorrectionDto) {
    return this.homeworkReviewService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateHomeworkCorrectionDto) {
    return this.homeworkReviewService.update(id, dto);
  }
}
