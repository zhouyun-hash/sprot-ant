import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelpService } from './help.service';
import { CreateHelpArticleDto } from './dto/create-help-article.dto';
import { UpdateHelpArticleDto } from './dto/update-help-article.dto';

@UseGuards(JwtAuthGuard)
@Controller('help-articles')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; category?: string }) {
    return this.helpService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.helpService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHelpArticleDto) {
    return this.helpService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateHelpArticleDto) {
    return this.helpService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.helpService.remove(id);
  }
}
