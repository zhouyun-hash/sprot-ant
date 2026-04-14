import {
  Body,
  Controller,
  Get,
  Header,
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
import { BatchCreateScoreDto, CreateScoreDto } from './dto/create-score.dto';
import { QueryScoreDto } from './dto/query-score.dto';
import { ReviewScoreDto } from './dto/review-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ScoreService } from './score.service';

@Controller('scores')
@UseGuards(JwtAuthGuard)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  private actor(req: Request & { user: { id: number; role: string } }) {
    return { id: req.user.id, role: req.user.role };
  }

  @Post()
  create(
    @Body() dto: CreateScoreDto | BatchCreateScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.create(dto, this.actor(req));
  }

  @Post('upsert')
  upsert(
    @Body() dto: CreateScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.upsert(dto, this.actor(req));
  }

  @Get('export')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="scores.xlsx"')
  async export(
    @Query() query: QueryScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.buildExportExcel(query, this.actor(req));
  }

  @Get()
  findAll(
    @Query() query: QueryScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.findAll(query, this.actor(req));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.findOne(id, this.actor(req));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.update(id, dto, this.actor(req));
  }

  @Post('review')
  review(
    @Body() dto: ReviewScoreDto,
    @Req() req: Request & { user: { id: number; role: string } },
  ) {
    return this.scoreService.review(dto, this.actor(req));
  }
}
