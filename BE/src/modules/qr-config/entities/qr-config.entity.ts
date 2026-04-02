import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from '../../auth/entities/admin.entity';

export enum QrStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  INACTIVE = 'inactive',
}

export enum CurrencyUnit {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
}

export enum CustomerUiSize {
  LARGE = 'large',
  NORMAL = 'normal',
  COMPACT = 'compact',
}

@Entity('qr_config')
export class QrConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: QrStatus,
    default: QrStatus.INACTIVE,
  })
  status: QrStatus;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'qr_url' })
  qrUrl: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'generated_at' })
  generatedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'spa_name' })
  spaName: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'spa_address' })
  spaAddress: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'spa_phone' })
  spaPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'spa_email' })
  spaEmail: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'spa_logo' })
  spaLogo: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'banner_url' })
  bannerUrl: string | null;

  @Column({ type: 'text', nullable: true, name: 'welcome_message' })
  welcomeMessage: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'background_color',
  })
  backgroundColor: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'classic', name: 'theme_id' })
  themeId: string;

  @Column({
    type: 'enum',
    enum: CurrencyUnit,
    default: CurrencyUnit.VND,
    name: 'currency_unit',
  })
  currencyUnit: CurrencyUnit;

  @Column({ type: 'varchar', length: 20, default: '#0253CD', name: 'primary_color' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 20, default: '#5E0B61', name: 'secondary_color' })
  secondaryColor: string;

  @Column({ type: 'varchar', length: 100, default: 'Inter', name: 'font_family' })
  fontFamily: string;

  @Column({
    type: 'enum',
    enum: CustomerUiSize,
    default: CustomerUiSize.NORMAL,
    name: 'customer_ui_size',
  })
  customerUiSize: CustomerUiSize;

  @Column({ type: 'uuid', name: 'admin_id', nullable: true })
  adminId: string;

  @ManyToOne(() => Admin, (admin) => admin.qrConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;
}
