import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsPage } from './entities/cms-page.entity';
import { CmsPagesService } from './cms-pages.service';
import { CmsPagesController } from './cms-pages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CmsPage])],
  providers: [CmsPagesService],
  controllers: [CmsPagesController],
  exports: [CmsPagesService],
})
export class CmsPagesModule {}
