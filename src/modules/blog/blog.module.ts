import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { BlogAuthor } from './entities/blog-author.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogAuthor, BlogCategory])],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
