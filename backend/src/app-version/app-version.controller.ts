import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppVersionService } from './app-version.service';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';

@UseGuards(JwtAuthGuard)
@Controller('app-versions')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  findAll() {
    return this.appVersionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.appVersionService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAppVersionDto) {
    return this.appVersionService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateAppVersionDto) {
    return this.appVersionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.appVersionService.remove(id);
  }
}
