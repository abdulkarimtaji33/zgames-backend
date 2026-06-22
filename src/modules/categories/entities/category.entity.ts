import {
  Entity,
  Column,
  Tree,
  TreeParent,
  TreeChildren,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
@Tree('materialized-path')
export class Category extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  image: string | null;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string | null;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @TreeParent({ onDelete: 'CASCADE' })
  parent: Category | null;

  @TreeChildren()
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
