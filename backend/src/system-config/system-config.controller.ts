import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemConfigService } from './system-config.service';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';

@UseGuards(JwtAuthGuard)
@Controller('system-configs')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.configService.findAll(category);
  }

  @Get(':key')
  getValue(@Param('key') key: string) {
    return this.configService.getValue(key);
  }

  @Post()
  create(@Body() dto: CreateSystemConfigDto) {
    return this.configService.create(dto);
  }

  @Put(':key')
  setValue(@Param('key') key: string, @Body('value') value: string) {
    return this.configService.setValue(key, value);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.configService.remove(id);
  }
}
