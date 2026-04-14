import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadgeService } from './badge.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';

@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get()
  findAll() {
    return this.badgeService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBadgeDto) {
    return this.badgeService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.badgeService.remove(id);
  }

  @Post('award')
  awardBadge(@Body() dto: AwardBadgeDto) {
    return this.badgeService.awardBadge(dto);
  }

  @Get('student/:studentId')
  getStudentBadges(@Param('studentId') studentId: number) {
    return this.badgeService.getStudentBadges(studentId);
  }
}
