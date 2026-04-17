import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Service } from '../../services/entities/service.entity';
import { QrConfig } from '../../qr-config/entities/qr-config.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 150, name: 'full_name', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login' })
  lastLogin: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Category, (category) => category.admin)
  categories: Category[];

  @OneToMany(() => Service, (service) => service.admin)
  services: Service[];

  @OneToMany(() => QrConfig, (qrConfig) => qrConfig.admin)
  qrConfigs: QrConfig[];

  @OneToMany(() => Store, (store) => store.admin)
  stores: Store[];
}
