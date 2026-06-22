import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_downloads')
export class ProductDownload extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ default: true })
  isPublic: boolean;

  @ManyToOne(() => Product, (product) => product.downloads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
