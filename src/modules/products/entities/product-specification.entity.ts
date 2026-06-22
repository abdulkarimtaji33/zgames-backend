import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_specifications')
export class ProductSpecification extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ length: 255 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.specifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
