import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceLibraryService } from './resource-library.service';
import { CreateTeachingResourceDto } from './dto/create-teaching-resource.dto';
import { UpdateTeachingResourceDto } from './dto/update-teaching-resource.dto';

@UseGuards(JwtAuthGuard)
@Controller('teaching-resources')
export class ResourceLibraryController {
  constructor(private readonly resourceLibraryService: ResourceLibraryService) {}

  @Get()
  findAll(
    @Query() query: {
      page?: number;
      size?: number;
      keyword?: string;
      type?: string;
      category?: string;
    },
  ) {
    return this.resourceLibraryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.resourceLibraryService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeachingResourceDto) {
    return this.resourceLibraryService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateTeachingResourceDto) {
    return this.resourceLibraryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.resourceLibraryService.remove(id);
  }
}
