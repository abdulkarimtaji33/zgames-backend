import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { FlashSaleProduct } from './flash-sale-product.entity';

@Entity('flash_sales')
export class FlashSale extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column()
  startsAt: Date;

  @Column()
  endsAt: Date;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => FlashSaleProduct, (p) => p.flashSale, { cascade: true })
  products: FlashSaleProduct[];
}
