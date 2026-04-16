import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Service } from './entities/service.entity';
import { Translation } from '../translation/entities/translation.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Translation)
    private readonly translationRepo: Repository<Translation>,
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

    const sortBy = query.sortBy === 'sortOrder' ? 'service.sortOrder' : 'service.createdAt';
    const sortDirection = query.sortDirection === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortBy, sortDirection)
      .addOrderBy('service.sortOrder', 'ASC')
      .addOrderBy('service.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Attach translations
    if (items.length > 0) {
      const itemIds = items.map((i) => i.id);
      const translations = await this.translationRepo.find({
        where: { entityType: 'SERVICE', entityId: In(itemIds) },
      });

      for (const item of items) {
        const itemTranslations = translations.filter((t) => t.entityId === item.id);
        const locales: Record<string, any> = {};
        for (const t of itemTranslations) {
          if (t.key === 'content') {
            try { locales[t.lang] = JSON.parse(t.value); } catch {}
          }
        }
        (item as any).locales = locales;
      }
    }

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

    // Load translations
    const translations = await this.translationRepo.find({
      where: { entityType: 'SERVICE', entityId: service.id },
    });
    const locales: Record<string, any> = {};
    for (const t of translations) {
      if (t.key === 'content') {
        try { locales[t.lang] = JSON.parse(t.value); } catch {}
      }
    }
    (service as any).locales = locales;

    return service;
  }

  private normalizeVariantOptions(
    raw: unknown,
  ): Array<{ name: string; price: number }> {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => ({
        name: String(item?.name || '').trim(),
        price: Number(item?.price),
      }))
      .filter((item) => item.name && Number.isFinite(item.price));
  }

  private validateAndNormalizePayload(
    dto: CreateServiceDto | UpdateServiceDto,
    current?: Service,
  ): Partial<Service> {
    const hasVariants = dto.hasVariants ?? current?.hasVariants ?? false;
    const normalizedVariants = this.normalizeVariantOptions(
      dto.variantOptions ?? current?.variantOptions,
    );

    if (hasVariants) {
      if (!normalizedVariants.length) {
        throw new BadRequestException(
          'At least one variant option is required when product variants are enabled',
        );
      }

      normalizedVariants.forEach((option) => {
        if (!option.name) {
          throw new BadRequestException('Variant option name is required');
        }
        if (!Number.isFinite(option.price) || option.price <= 0) {
          throw new BadRequestException('Variant option price must be greater than 0');
        }
      });
    }

    const nextPrice = hasVariants
      ? Math.min(...normalizedVariants.map((v) => v.price))
      : Number(dto.price ?? current?.price);

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const { locales, ...dtoWithoutLocales } = dto;
    const payload: Partial<Service> = {
      ...dtoWithoutLocales,
      hasVariants,
      variantOptions: hasVariants ? normalizedVariants : null,
      price: nextPrice,
      shortDescription:
        dto.shortDescription !== undefined
          ? String(dto.shortDescription || '').trim() || null
          : current?.shortDescription ?? null,
    };

    if (hasVariants) {
      payload.priceFrom = null;
      payload.priceTo = null;
    } else {
      payload.priceFrom = dto.priceFrom ?? null;
      payload.priceTo = dto.priceTo ?? null;
    }

    return payload;
  }

  async create(dto: CreateServiceDto, adminId: string): Promise<Service> {
    const existing = await this.serviceRepo.findOne({
      where: { name: dto.name, adminId },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Service already exists',
        existingService: existing,
      });
    }

    const payload = this.validateAndNormalizePayload(dto);

    if (
      payload.priceFrom !== undefined &&
      payload.priceFrom !== null &&
      payload.priceTo !== undefined &&
      payload.priceTo !== null &&
      Number(payload.priceFrom) >= Number(payload.priceTo)
    ) {
      throw new BadRequestException('Price from must be less than price to');
    }

    const service = this.serviceRepo.create({
      ...(payload as Partial<Service>),
      adminId,
    } as Partial<Service>);
    
    const saved = await this.serviceRepo.save(service);
    await this.saveTranslations(saved.id, dto.locales);
    
    return this.findOne(saved.id, adminId);
  }

  async update(id: string, dto: UpdateServiceDto, adminId: string): Promise<Service> {
    const service = await this.findOne(id, adminId);

    if (dto.name && dto.name !== service.name) {
      const existing = await this.serviceRepo.findOne({
        where: { name: dto.name, adminId },
      });

      if (existing) {
        throw new ConflictException({
          message: 'Service name already exists',
          existingService: existing,
        });
      }
    }

    const payload = this.validateAndNormalizePayload(dto, service);

    // When categoryId changes, clear loaded relation to avoid old relation overriding FK on save.
    if (
      payload.categoryId &&
      payload.categoryId !== service.categoryId
    ) {
      service.categoryId = payload.categoryId;
      delete (service as any).category;
    }

    const nextPriceFrom = payload.priceFrom ?? service.priceFrom;
    const nextPriceTo = payload.priceTo ?? service.priceTo;
    if (
      nextPriceFrom !== undefined &&
      nextPriceFrom !== null &&
      nextPriceTo !== undefined &&
      nextPriceTo !== null &&
      Number(nextPriceFrom) >= Number(nextPriceTo)
    ) {
      throw new BadRequestException('Price from must be less than price to');
    }

    Object.assign(service, payload);
    const saved = await this.serviceRepo.save(service);
    await this.saveTranslations(id, dto.locales);

    return this.findOne(id, adminId);
  }

  private async saveTranslations(entityId: string, localesData?: Record<string, any>) {
    if (!localesData) return;
    
    // Clear old locales for this service (replace all strategy)
    await this.translationRepo.delete({ entityType: 'SERVICE', entityId });

    const newTranslations: Translation[] = [];
    for (const [lang, data] of Object.entries(localesData)) {
      if (!data) continue;
      
      const t = this.translationRepo.create({
        entityType: 'SERVICE',
        entityId,
        lang,
        key: 'content',
        value: JSON.stringify(data),
      });
      newTranslations.push(t);
    }

    if (newTranslations.length > 0) {
      await this.translationRepo.save(newTranslations);
    }
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
