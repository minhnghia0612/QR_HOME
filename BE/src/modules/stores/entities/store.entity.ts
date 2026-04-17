import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Admin } from '../../auth/entities/admin.entity';
import { Category } from '../../categories/entities/category.entity';
import { Service } from '../../services/entities/service.entity';
import { QrConfig } from '../../qr-config/entities/qr-config.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', name: 'admin_id' })
  adminId: string;

  @ManyToOne(() => Admin, (admin) => admin.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];

  @OneToMany(() => Service, (service) => service.store)
  services: Service[];

  @OneToMany(() => QrConfig, (qrConfig) => qrConfig.store)
  qrConfigs: QrConfig[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
