import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiGradeSubmissionDto } from './dto/ai-grade-submission.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { QueryHomeworkDto } from './dto/query-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { HomeworkService } from './homework.service';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  create(@Body() dto: CreateHomeworkDto) {
    return this.homeworkService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryHomeworkDto, @Req() req: Request & { user: { id: number; role: string } }) {
    return this.homeworkService.findAll(query, req.user);
  }

  @Get(':id/submissions')
  findSubmissions(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.findSubmissions(id);
  }

  @Get(':id')
  findOneForViewer(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.homeworkService.findOneForViewer(id, req.user);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHomeworkDto) {
    return this.homeworkService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.remove(id);
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitHomeworkDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.homeworkService.submit(id, dto, req.user);
  }

  @Post('submission/:submissionId/grade')
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: GradeSubmissionDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.homeworkService.gradeSubmission(submissionId, dto, req.user);
  }

  @Post('submission/:submissionId/ai-grade')
  /**
   * AI 自动评分：
   * - scene=action：使用 videoUrl 调动作识别
   * - scene=skipping/situp：建议传 imageBase64 调对应接口
   * - skipping/situp 未传 imageBase64 时会降级到 action 识别
   */
  aiGradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: AiGradeSubmissionDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.homeworkService.aiGradeSubmission(submissionId, dto, req.user);
  }
}
