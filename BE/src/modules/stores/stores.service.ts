import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto, adminId: string) {
    // Check for duplicate name for this admin
    const existing = await this.storesRepository.findOne({
      where: { name: createStoreDto.name, adminId },
    });
    if (existing) {
      throw new ConflictException(
        `Store with name "${createStoreDto.name}" already exists.`,
      );
    }

    const store = this.storesRepository.create({
      ...createStoreDto,
      adminId,
    });
    const savedStore = await this.storesRepository.save(store);

    // Automatically migrate legacy orphaned data to this new store
    await this.migrateOrphanedData(adminId, savedStore.id);

    return savedStore;
  }

  private async migrateOrphanedData(adminId: string, storeId: string) {
    const tables = ['categories', 'services', 'qr_config', 'traffic_logs'];
    for (const table of tables) {
      try {
        await this.storesRepository.query(
          `UPDATE "${table}" SET "store_id" = $1 WHERE "admin_id" = $2 AND "store_id" IS NULL`,
          [storeId, adminId],
        );
      } catch (err) {
        // Log error or ignore if table doesn't exist/doesn't have the columns
        console.warn(
          `Failed to migrate orphaned data for table ${table}:`,
          err.message,
        );
      }
    }
  }

  findAll(adminId: string) {
    return this.storesRepository.find({
      where: { adminId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, adminId?: string) {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${id}" not found`);
    }
    if (adminId && store.adminId !== adminId) {
      throw new ForbiddenException(
        `You don't have permission to access this store`,
      );
    }
    return store;
  }

  /**
   * Resolves the effective storeId for an admin operation.
   * 1. If storeId is provided and valid → use it.
   * 2. If storeId not provided → fall back to the admin's first store.
   * Throws if admin has no stores at all (edge case).
   */
  async resolveStoreId(adminId: string, storeId?: string): Promise<string> {
    if (storeId) {
      await this.findOne(storeId, adminId); // validates ownership if adminId provided
      return storeId;
    }
    if (!adminId) {
      throw new BadRequestException('AdminId or StoreId is required');
    }
    const stores = await this.storesRepository.find({
      where: { adminId },
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!stores.length) {
      // Auto-create a default store so admin is never blocked,
      // capturing any legacy data they might have
      const defaultStore = await this.create(
        { name: 'Default Store' },
        adminId,
      );
      return defaultStore.id;
    }
    return stores[0].id;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, adminId: string) {
    const store = await this.findOne(id, adminId);

    // If name is changing, check for duplicates
    if (updateStoreDto.name && updateStoreDto.name !== store.name) {
      const existing = await this.storesRepository.findOne({
        where: { name: updateStoreDto.name, adminId },
      });
      if (existing) {
        throw new ConflictException(
          `Store with name "${updateStoreDto.name}" already exists.`,
        );
      }
    }

    Object.assign(store, updateStoreDto);
    return this.storesRepository.save(store);
  }

  async remove(id: string, adminId: string) {
    const stores = await this.storesRepository.find({ where: { adminId } });
    if (stores.length <= 1) {
      throw new BadRequestException(
        'Cannot delete the last store. You must have at least one store.',
      );
    }
    const store = await this.findOne(id, adminId);
    return this.storesRepository.remove(store);
  }
}
