import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('cms_pages')
export class CmsPage extends AbstractEntity {
  @Column({ length: 500 })
  title: string;

  @Column({ unique: true, length: 500 })
  slug: string;

  @Column({ type: 'json' })
  content: Record<string, unknown>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string | null;

  @Column({ default: true })
  isActive: boolean;
}
