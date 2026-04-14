import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; keyword?: string; status?: string; type?: string }) {
    return this.deviceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.deviceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.deviceService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateDeviceDto) {
    return this.deviceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.deviceService.remove(id);
  }

  @Put(':id/restart')
  restart(@Param('id') id: number) {
    return this.deviceService.restart(id);
  }
}
