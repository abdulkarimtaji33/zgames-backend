import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { ProductVideo } from './product-video.entity';
import { ProductSpecification } from './product-specification.entity';
import { ProductFaq } from './product-faq.entity';
import { ProductDownload } from './product-download.entity';

export enum ProductType {
  SIMPLE = 'simple',
  VARIABLE = 'variable',
  BUNDLE = 'bundle',
  GIFT_CARD = 'gift_card',
  DIGITAL = 'digital',
  PREORDER = 'preorder',
  LIMITED = 'limited',
}

export enum ProductPlatform {
  PS5 = 'ps5',
  PS4 = 'ps4',
  XBOX_SERIES_X = 'xbox_series_x',
  XBOX_ONE = 'xbox_one',
  NINTENDO_SWITCH = 'nintendo_switch',
  PC = 'pc',
  MULTI = 'multi',
  N_A = 'n_a',
}

export enum ProductRegion {
  UAE = 'uae',
  KSA = 'ksa',
  QATAR = 'qatar',
  KUWAIT = 'kuwait',
  BAHRAIN = 'bahrain',
  INTERNATIONAL = 'international',
  GLOBAL = 'global',
}

export enum ProductGenre {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  FIGHTING = 'fighting',
  HORROR = 'horror',
  RACING = 'racing',
  SHOOTER = 'shooter',
  SPORTS = 'sports',
  STRATEGY = 'strategy',
  RPG = 'rpg',
  SIMULATION = 'simulation',
  N_A = 'n_a',
}

@Entity('products')
export class Product extends AbstractEntity {
  @Column({ length: 500 })
  name: string;

  @Column({ unique: true, length: 500 })
  slug: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.SIMPLE })
  type: ProductType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  brandId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  publisher: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  developer: string | null;

  @Column({
    type: 'enum',
    enum: ProductPlatform,
    default: ProductPlatform.N_A,
  })
  platform: ProductPlatform;

  @Column({ type: 'enum', enum: ProductRegion, default: ProductRegion.GLOBAL })
  region: ProductRegion;

  @Column({ type: 'enum', enum: ProductGenre, default: ProductGenre.N_A })
  genre: ProductGenre;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'text' })
  shortDescription: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  salePrice: number | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  costPrice: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  weight: number;

  @Column({ type: 'json', nullable: true })
  dimensions: { length: number; width: number; height: number } | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  releaseDate: Date | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  preorderDepositAmount: number | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isNew: boolean;

  @Column({ default: false })
  isPreorder: boolean;

  @Column({ default: false })
  isComingSoon: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string | null;

  @Column({ nullable: true, type: 'text' })
  metaKeywords: string | null;

  @Column({ nullable: true, type: 'text' })
  ogImage: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Brand, (brand) => brand.products, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (i) => i.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVideo, (v) => v.product, { cascade: true })
  videos: ProductVideo[];

  @OneToMany(() => ProductSpecification, (s) => s.product, { cascade: true })
  specifications: ProductSpecification[];

  @OneToMany(() => ProductFaq, (f) => f.product, { cascade: true })
  faqs: ProductFaq[];

  @OneToMany(() => ProductDownload, (d) => d.product, { cascade: true })
  downloads: ProductDownload[];

  @ManyToMany(() => Product)
  @JoinTable({ name: 'product_related' })
  relatedProducts: Product[];

  @ManyToMany(() => Product)
  @JoinTable({ name: 'product_upsells' })
  upsellProducts: Product[];

  @ManyToMany(() => Product)
  @JoinTable({ name: 'product_crosssells' })
  crossSellProducts: Product[];
}
