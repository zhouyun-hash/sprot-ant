import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { BadgeAward } from './entities/badge-award.entity';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, BadgeAward])],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
