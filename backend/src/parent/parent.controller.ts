import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryHomeworkDto } from '../homework/dto/query-homework.dto';
import { SubmitHomeworkDto } from '../homework/dto/submit-homework.dto';
import { QueryScoreDto } from '../score/dto/query-score.dto';
import { ApplyParentAccessDto } from './dto/apply-parent-access.dto';
import { ParentService } from './parent.service';
import { ParentStudentAccessService } from './parent-student-access.service';

type ReqUser = Request & { user: { id: number; role: string } };

@Controller('parent')
@UseGuards(JwtAuthGuard)
export class ParentController {
  constructor(
    private readonly parentService: ParentService,
    private readonly accessService: ParentStudentAccessService,
  ) {}

  @Get('children')
  children(@Req() req: ReqUser) {
    return this.parentService.getChildren(req.user.id);
  }

  /** 提交绑定申请（学号+身份证号须与学校登记一致） */
  @Post('access-requests')
  applyAccess(@Req() req: ReqUser, @Body() dto: ApplyParentAccessDto) {
    return this.accessService.apply(req.user.id, dto.studentNo, dto.idCard);
  }

  @Get('access-requests/me')
  myAccessRequests(@Req() req: ReqUser) {
    return this.accessService.listMyRequests(req.user.id);
  }

  @Get('students/:studentId/stats-week')
  statsWeek(@Param('studentId', ParseIntPipe) studentId: number, @Req() req: ReqUser) {
    return this.parentService.statsWeek(studentId, req.user.id);
  }

  @Get('students/:studentId/activity-trend')
  activityTrend(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: ReqUser,
  ) {
    return this.parentService.activityTrend(studentId, req.user.id);
  }

  @Get('students/:studentId/report/history')
  reportHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: ReqUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 50;
    return this.parentService.reportHistory(studentId, req.user.id, p, ps);
  }

  @Get('students/:studentId/report')
  report(@Param('studentId', ParseIntPipe) studentId: number, @Req() req: ReqUser) {
    return this.parentService.report(studentId, req.user.id);
  }

  @Get('students/:studentId/scores')
  studentScores(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: QueryScoreDto,
    @Req() req: ReqUser,
  ) {
    return this.parentService.studentScores(studentId, req.user.id, query);
  }

  @Get('students/:studentId/scores-best')
  scoresBest(@Param('studentId', ParseIntPipe) studentId: number, @Req() req: ReqUser) {
    return this.parentService.bestPhysicalScores(studentId, req.user.id);
  }

  @Get('students/:studentId/homework')
  homeworkList(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: QueryHomeworkDto,
    @Req() req: ReqUser,
  ) {
    return this.parentService.homeworkList(studentId, query, req.user.id);
  }

  @Get('students/:studentId/homework/:homeworkId')
  homeworkDetail(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('homeworkId', ParseIntPipe) homeworkId: number,
    @Req() req: ReqUser,
  ) {
    return this.parentService.homeworkDetail(homeworkId, studentId, req.user.id);
  }

  @Post('students/:studentId/homework/:homeworkId/submit')
  homeworkSubmit(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('homeworkId', ParseIntPipe) homeworkId: number,
    @Body() dto: SubmitHomeworkDto,
    @Req() req: ReqUser,
  ) {
    return this.parentService.homeworkSubmit(homeworkId, studentId, dto, req.user.id);
  }
}
