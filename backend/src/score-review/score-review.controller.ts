import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ScoreReviewService } from './score-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('score-reviews')
export class ScoreReviewController {
  constructor(private readonly service: ScoreReviewService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id')
  findOne(@Param('id') id: number) { return this.service.findOne(id); }

  @Put(':id/approve')
  approve(@Param('id') id: number, @Req() req: any, @Body() body: { comment?: string }) {
    return this.service.approve(id, req.user?.id, body.comment);
  }

  @Put(':id/reject')
  reject(@Param('id') id: number, @Req() req: any, @Body() body: { comment: string }) {
    return this.service.reject(id, req.user?.id, body.comment);
  }

  @Post()
  create(@Body() body: any) { return this.service.create(body); }
}
