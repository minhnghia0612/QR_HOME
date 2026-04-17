import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

@Entity('traffic_logs')
export class TrafficLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'service_id' })
  serviceId: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @Column({ type: 'uuid', name: 'admin_id', nullable: true })
  adminId: string | null;

  @Column({ type: 'uuid', name: 'store_id', nullable: true })
  storeId: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'visited_at' })
  visitedAt: Date;

  @ManyToOne(() => Service, (service) => service.trafficLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service | null;
}
