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

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Translation)
    private readonly translationRepo: Repository<Translation>,
  ) {}

  async findAll(adminId: string): Promise<Category[]> {
    const items = await this.categoryRepo.find({
      where: { adminId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    if (items.length > 0) {
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

    return items;
  }

  async findActive(adminId: string): Promise<Category[]> {
    const items = await this.categoryRepo.find({
      where: { isActive: true, adminId },
      order: { sortOrder: 'ASC' },
    });

    if (items.length > 0) {
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

    return items;
  }

  async findOne(id: string, adminId?: string): Promise<Category> {
    const where: any = { id };
    if (adminId) where.adminId = adminId;
    
    const category = await this.categoryRepo.findOne({ where });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const translations = await this.translationRepo.find({
      where: { entityType: 'CATEGORY', entityId: category.id },
    });
    const locales: Record<string, any> = {};
    for (const t of translations) {
      if (t.key === 'content') {
        try { locales[t.lang] = JSON.parse(t.value); } catch {}
      }
    }
    (category as any).locales = locales;

    return category;
  }

  async create(dto: CreateCategoryDto, adminId: string): Promise<Category> {
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name, adminId },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Category already exists',
        existingCategory: existing,
      });
    }

    const { locales, ...dtoWithoutLocales } = dto;
    const category = this.categoryRepo.create({ ...dtoWithoutLocales, adminId });
    const saved = await this.categoryRepo.save(category);
    
    if (locales) {
      await this.saveTranslations(saved.id, locales);
    }
    
    return this.findOne(saved.id, adminId);
  }

  async update(id: string, dto: UpdateCategoryDto, adminId: string): Promise<Category> {
    const category = await this.findOne(id, adminId);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { name: dto.name, adminId },
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

    return this.findOne(id, adminId);
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
