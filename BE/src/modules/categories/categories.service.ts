import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(adminId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { adminId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findActive(adminId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { isActive: true, adminId },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string, adminId?: string): Promise<Category> {
    const where: any = { id };
    if (adminId) where.adminId = adminId;
    
    const category = await this.categoryRepo.findOne({ where });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, adminId: string): Promise<Category> {
    const category = this.categoryRepo.create({ ...dto, adminId });
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto, adminId: string): Promise<Category> {
    const category = await this.findOne(id, adminId);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string, adminId: string): Promise<void> {
    const category = await this.findOne(id, adminId);
    await this.categoryRepo.remove(category);
  }
}
