import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { WishlistItem } from './wishlist-item.entity';

@Entity('wishlists')
export class Wishlist extends AbstractEntity {
  @Column({ unique: true })
  customerId: string;

  @OneToMany(() => WishlistItem, (item) => item.wishlist, { cascade: true })
  items: WishlistItem[];
}
