import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from '../entities/courses.entity.js';
import { TypeOrmCourseRepository } from './typeorm-course.repository.js';

describe('TypeOrmCourseRepository', () => {
  let repository: TypeOrmCourseRepository;
  const typeormRepository = {
    findOneBy: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    typeormRepository.findOneBy.mockReset();
    typeormRepository.save.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmCourseRepository,
        {
          provide: getRepositoryToken(Course),
          useValue: typeormRepository,
        },
      ],
    }).compile();

    repository = module.get(TypeOrmCourseRepository);
  });

  it('maps findById to a TypeORM primary-key lookup', async () => {
    const course = { id: 4 } as Course;
    typeormRepository.findOneBy.mockResolvedValue(course);

    await expect(repository.findById(4)).resolves.toBe(course);
    expect(typeormRepository.findOneBy).toHaveBeenCalledWith({ id: 4 });
  });

  it('maps save to the TypeORM repository', async () => {
    const course = { id: 4 } as Course;
    typeormRepository.save.mockResolvedValue(course);

    await expect(repository.save(course)).resolves.toBe(course);
    expect(typeormRepository.save).toHaveBeenCalledWith(course);
  });
});
