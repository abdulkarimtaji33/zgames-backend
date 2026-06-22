import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('brands')
export class Brand extends AbstractEntity {
  @Column({ unique: true, length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  logo: string | null;

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

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
