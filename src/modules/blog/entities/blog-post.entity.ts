import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { BlogAuthor } from './blog-author.entity';
import { BlogCategory } from './blog-category.entity';

export enum BlogPostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
}

@Entity('blog_posts')
export class BlogPost extends AbstractEntity {
  @Column({ length: 500 })
  title: string;

  @Column({ unique: true, length: 500 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  excerpt: string | null;

  @Column({ type: 'json' })
  content: Record<string, unknown>;

  @Column({ type: 'varchar', length: 36, nullable: true })
  authorId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @Column({ type: 'enum', enum: BlogPostStatus, default: BlogPostStatus.DRAFT })
  status: BlogPostStatus;

  @Column({ nullable: true, type: 'text' })
  featuredImage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string | null;

  @Column({ nullable: true, type: 'json' })
  tags: string[] | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  scheduledAt: Date | null;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToOne(() => BlogAuthor, (author) => author.posts, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: BlogAuthor | null;

  @ManyToOne(() => BlogCategory, (cat) => cat.posts, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: BlogCategory | null;
}
