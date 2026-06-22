import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_authors')
export class BlogAuthor extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ nullable: true, type: 'text' })
  avatar: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @OneToMany(() => BlogPost, (post) => post.author)
  posts: BlogPost[];
}
