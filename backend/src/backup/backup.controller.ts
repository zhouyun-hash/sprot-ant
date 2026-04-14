import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';

@UseGuards(JwtAuthGuard)
@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  findAll(@Query() query: { page?: number; size?: number }) {
    return this.backupService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateBackupDto) {
    return this.backupService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.backupService.remove(id);
  }
}
