import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './entities/category.entity';
import { Translation } from '../translation/entities/translation.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Translation)
    private readonly translationRepo: Repository<Translation>,
    private readonly storesService: StoresService,
  ) {}

  async findAll(adminId?: string, storeId?: string): Promise<Category[]> {
    const resolvedStoreId = await this.storesService.resolveStoreId(adminId as any, storeId);
    const items = await this.categoryRepo.find({
      where: { storeId: resolvedStoreId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    await this.attachTranslations(items);
    return items;
  }

  async findActive(adminId?: string, storeId?: string): Promise<Category[]> {
    const resolvedStoreId = await this.storesService.resolveStoreId(adminId as any, storeId);
    const items = await this.categoryRepo.find({
      where: { isActive: true, storeId: resolvedStoreId },
      order: { sortOrder: 'ASC' },
    });

    await this.attachTranslations(items);
    return items;
  }

  async findOne(id: string, adminId?: string): Promise<Category> {
    const where: any = { id };
    if (adminId) where.adminId = adminId;
    
    const category = await this.categoryRepo.findOne({ where });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    await this.attachTranslations([category]);
    return category;
  }

  async create(dto: CreateCategoryDto, adminId: string, storeId?: string): Promise<Category> {
    const resolvedStoreId = await this.storesService.resolveStoreId(adminId, storeId);

    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name, storeId: resolvedStoreId },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Category already exists',
        existingCategory: existing,
      });
    }

    const { locales, ...dtoWithoutLocales } = dto;
    const category = this.categoryRepo.create({
      ...dtoWithoutLocales,
      adminId,
      storeId: resolvedStoreId,
    });
    const saved = await this.categoryRepo.save(category);
    
    if (locales) {
      await this.saveTranslations(saved.id, locales);
    }
    
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateCategoryDto, adminId: string): Promise<Category> {
    const category = await this.findOne(id, adminId);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { name: dto.name, storeId: category.storeId },
      });

      if (existing) {
        throw new ConflictException({
          message: 'Category name already exists',
          existingCategory: existing,
        });
      }
    }

    const { locales, ...dtoWithoutLocales } = dto;
    Object.assign(category, dtoWithoutLocales);
    const saved = await this.categoryRepo.save(category);
    
    if (locales !== undefined) {
      await this.saveTranslations(id, locales);
    }

    return this.findOne(id);
  }

  private async attachTranslations(items: Category[]): Promise<void> {
    if (!items.length) return;
    const itemIds = items.map((i) => i.id);
    const translations = await this.translationRepo.find({
      where: { entityType: 'CATEGORY', entityId: In(itemIds) },
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

  private async saveTranslations(entityId: string, localesData?: Record<string, any>) {
    if (!localesData) return;
    
    await this.translationRepo.delete({ entityType: 'CATEGORY', entityId });

    const newTranslations: Translation[] = [];
    for (const [lang, data] of Object.entries(localesData)) {
      if (!data) continue;
      
      const t = this.translationRepo.create({
        entityType: 'CATEGORY',
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
    const category = await this.findOne(id, adminId);
    await this.categoryRepo.remove(category);
  }
}
