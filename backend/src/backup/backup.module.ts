import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupRecord } from './entities/backup-record.entity';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BackupRecord])],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
