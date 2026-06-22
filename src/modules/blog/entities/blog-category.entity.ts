import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_categories')
export class BlogCategory extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => BlogPost, (post) => post.category)
  posts: BlogPost[];
}
