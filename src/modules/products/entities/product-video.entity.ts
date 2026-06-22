import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

export enum VideoType {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  UPLOAD = 'upload',
}

@Entity('product_videos')
export class ProductVideo extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'enum', enum: VideoType, default: VideoType.YOUTUBE })
  type: VideoType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.videos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
