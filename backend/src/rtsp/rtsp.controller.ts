import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RtspService } from './rtsp.service';
import { CreateRtspStreamDto } from './dto/create-rtsp-stream.dto';
import { UpdateRtspStreamDto } from './dto/update-rtsp-stream.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rtsp-streams')
export class RtspController {
  constructor(private readonly rtspService: RtspService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; keyword?: string; status?: string }) {
    return this.rtspService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.rtspService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRtspStreamDto) {
    return this.rtspService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateRtspStreamDto) {
    return this.rtspService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.rtspService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: number) {
    return this.rtspService.testConnection(id);
  }
}
