import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConfig } from './entities/ai-config.entity';
import { AiModel } from './entities/ai-model.entity';
import { AiConfigService } from './ai-config.service';
import { AiConfigController } from './ai-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiConfig, AiModel])],
  controllers: [AiConfigController],
  providers: [AiConfigService],
  exports: [AiConfigService],
})
export class AiConfigModule {}
