import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('logs')
  logs(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;
    return this.syncService.getLogs(p, ps);
  }

  @Post('trigger')
  trigger() {
    return this.syncService.triggerManualSync();
  }

  @Get('external/asset-summary')
  assetSummary() {
    return this.syncService.getExternalAssetSummary();
  }

  @Get('external/safety-events')
  safetyEvents() {
    return this.syncService.getExternalSafetyEvents();
  }
}
