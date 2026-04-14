import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpArticle } from './entities/help-article.entity';
import { HelpService } from './help.service';
import { HelpController } from './help.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HelpArticle])],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
