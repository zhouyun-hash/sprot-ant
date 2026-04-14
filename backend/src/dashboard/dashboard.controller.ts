import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  overview() {
    return this.dashboardService.getOverview();
  }

  @Get('grade-compare')
  gradeCompare() {
    return this.dashboardService.getGradeCompare();
  }

  @Get('project-trend')
  projectTrend() {
    return this.dashboardService.getProjectTrend();
  }

  @Get('top-students')
  topStudents(@Query('pointFactor') pointFactor?: string) {
    const factor = pointFactor ? Number(pointFactor) : 1;
    return this.dashboardService.getTopStudents(factor);
  }
}
