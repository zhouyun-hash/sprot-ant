import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryRankDto } from './dto/query-rank.dto';
import { RankService } from './rank.service';

@Controller('rank')
@UseGuards(JwtAuthGuard)
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Get()
  getRank(@Query() query: QueryRankDto) {
    return this.rankService.getRank(query);
  }
}
