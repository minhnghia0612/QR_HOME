import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async findAll(query: QueryServiceDto, adminId?: string): Promise<{
    items: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<Service> = this.serviceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category');

    if (adminId) {
      qb.andWhere('service.adminId = :adminId', { adminId });
    } else if (query.adminId) {
      qb.andWhere('service.adminId = :adminId', { adminId: query.adminId });
    }

    // Search by name
    if (query.search) {
      qb.andWhere('LOWER(service.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Filter by category
    if (query.categoryId) {
      qb.andWhere('service.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    // Filter by status
    if (query.isActive !== undefined) {
      qb.andWhere('service.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    // Filter by label
    if (query.label) {
      switch (query.label) {
        case 'best_seller':
          qb.andWhere('service.isBestSeller = :flag', { flag: true });
          break;
        case 'new_service':
          qb.andWhere('service.isNewService = :flag', { flag: true });
          break;
        case 'combo':
          qb.andWhere('service.isCombo = :flag', { flag: true });
          break;
      }
    }

    qb.orderBy('service.sortOrder', 'ASC')
      .addOrderBy('service.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllActive(query: QueryServiceDto, adminId?: string): Promise<{
    items: Service[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const activeQuery = { ...query, isActive: true };
    return this.findAll(activeQuery, adminId);
  }

  async findOne(id: string, adminId?: string): Promise<Service> {
    const where: any = { id };
    if (adminId) where.adminId = adminId;
    
    const service = await this.serviceRepo.findOne({
      where,
      relations: ['category'],
    });
    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return service;
  }

  async create(dto: CreateServiceDto, adminId: string): Promise<Service> {
    const service = this.serviceRepo.create({ ...dto, adminId });
    return this.serviceRepo.save(service);
  }

  async update(id: string, dto: UpdateServiceDto, adminId: string): Promise<Service> {
    const service = await this.findOne(id, adminId);
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async remove(id: string, adminId: string): Promise<void> {
    const service = await this.findOne(id, adminId);
    await this.serviceRepo.remove(service);
  }

  async countActive(adminId: string): Promise<number> {
    return this.serviceRepo.count({ where: { isActive: true, adminId } });
  }

  async countAll(adminId: string): Promise<number> {
    return this.serviceRepo.count({ where: { adminId } });
  }
}
