import {
  Controller,
  ForbiddenException,
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
import { QueryAlertDto } from './dto/query-alert.dto';
import { AlertService } from './alert.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  getAlerts(
    @Query() query: QueryAlertDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ForbiddenException('仅教师或管理员可查看预警');
    }
    return this.alertService.getAlerts(query, req.user);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ForbiddenException('仅教师或管理员可处理预警');
    }
    return this.alertService.resolveAlert(id, req.user);
  }
}
