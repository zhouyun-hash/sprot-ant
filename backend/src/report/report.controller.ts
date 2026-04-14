import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';

@Controller('report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('student/:studentId')
  getStudentReport(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.reportService.getOrGenerateStudentReport(studentId);
  }

  @Get('student/:studentId/history')
  getStudentReportHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 10;
    return this.reportService.getStudentReportHistory(studentId, p, ps);
  }

  @Get('student/:studentId/:reportId')
  getStudentReportById(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
  ) {
    return this.reportService.getStudentReportById(studentId, reportId);
  }

  @Post('generate')
  generate() {
    return this.reportService.generateAllReports();
  }
}
