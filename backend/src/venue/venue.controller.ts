import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number; keyword?: string; status?: string }) {
    return this.venueService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.venueService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVenueDto) {
    return this.venueService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateVenueDto) {
    return this.venueService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.venueService.remove(id);
  }
}
