import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { TrafficLog } from '../../traffic/entities/traffic-log.entity';
import { Admin } from '../../auth/entities/admin.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'short_description' })
  shortDescription?: string | null;

  @Column({ type: 'int', default: 60, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: false, name: 'has_variants' })
  hasVariants: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'variant_options' })
  variantOptions?: Array<{ name: string; price: number }> | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_from' })
  priceFrom?: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_to' })
  priceTo?: number | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'boolean', default: false, name: 'is_best_seller' })
  isBestSeller: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_new_service' })
  isNewService: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_combo' })
  isCombo: boolean;

  @Column({ type: 'simple-array', nullable: true, name: 'special_tags' })
  specialTags?: string[] | null;


  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'uuid', name: 'admin_id', nullable: true })
  adminId: string;

  @ManyToOne(() => Admin, (admin) => admin.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => Category, (category) => category.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => TrafficLog, (log) => log.service)
  trafficLogs: TrafficLog[];
}
