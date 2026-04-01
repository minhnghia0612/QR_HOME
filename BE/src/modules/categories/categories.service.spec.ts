import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories ordered by sortOrder', async () => {
      const categories = [
        { id: '1', name: 'Skincare', slug: 'skincare', sortOrder: 1 },
        { id: '2', name: 'Massage', slug: 'massage', sortOrder: 2 },
      ];
      mockRepo.find.mockResolvedValue(categories);

      const result = await service.findAll();
      expect(result).toEqual(categories);
      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Therapy', slug: 'therapy' };
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'uuid-3', ...dto });
      mockRepo.save.mockResolvedValue({ id: 'uuid-3', ...dto });

      const result = await service.create(dto);
      expect(result.name).toBe('Therapy');
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', slug: 'skincare' });

      await expect(
        service.create({ name: 'Skincare 2', slug: 'skincare' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const category = { id: '1', name: 'Skincare' };
      mockRepo.findOne.mockResolvedValue(category);
      mockRepo.remove.mockResolvedValue(category);

      await service.remove('1');
      expect(mockRepo.remove).toHaveBeenCalledWith(category);
    });
  });
});
