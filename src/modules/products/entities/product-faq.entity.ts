import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_faqs')
export class ProductFaq extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.faqs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
