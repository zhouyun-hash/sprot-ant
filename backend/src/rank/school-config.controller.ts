import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateRankRulesDto } from './dto/update-rank-rules.dto';
import { RankService } from './rank.service';

@Controller('school-config')
@UseGuards(JwtAuthGuard)
export class SchoolConfigController {
  constructor(private readonly rankService: RankService) {}

  @Get('rank-rules')
  getRankRules() {
    return this.rankService.getRankRulesConfig();
  }

  @Put('rank-rules')
  updateRankRules(
    @Body() dto: UpdateRankRulesDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('仅管理员可修改积分规则');
    }
    return this.rankService.updateRankRulesConfig(dto);
  }
}
