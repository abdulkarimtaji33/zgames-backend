import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Wishlist } from './wishlist.entity';

@Entity('wishlist_items')
export class WishlistItem extends AbstractEntity {
  @Column()
  wishlistId: string;

  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wishlistId' })
  wishlist: Wishlist;
}
