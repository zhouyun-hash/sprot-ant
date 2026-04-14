import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachingResource } from './entities/teaching-resource.entity';
import { ResourceLibraryService } from './resource-library.service';
import { ResourceLibraryController } from './resource-library.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeachingResource])],
  controllers: [ResourceLibraryController],
  providers: [ResourceLibraryService],
  exports: [ResourceLibraryService],
})
export class ResourceLibraryModule {}
