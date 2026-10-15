import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from './courses.service.js';
import { Course } from './entities/courses.entity.js';

describe('CoursesService', () => {
  let service: CoursesService;
  const courses = [
    { id: 1, title: 'Alpha', level: 'beginner' },
    { id: 2, title: 'Beta', level: 'intermediate' },
    { id: 3, title: 'Gamma', level: 'advanced' },
  ] as Course[];
  const coursesRepository = {
    findAndCount: vi.fn(),
  };

  beforeEach(async () => {
    coursesRepository.findAndCount.mockReset().mockImplementation(({ skip = 0, take = 10 }) =>
      Promise.resolve([courses.slice(skip, skip + take), courses.length]),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: coursesRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses course filters, pagination, and a stable sort order', async () => {
    const result = await service.findAll({
      level: 'intermediate',
      page: 3,
      limit: 5,
      sortBy: 'title',
      order: 'DESC',
    });

    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: { level: 'intermediate' },
      skip: 10,
      take: 5,
      order: { title: 'DESC', id: 'ASC' },
    });
    expect(result).toEqual({
      items: courses.slice(10, 15),
      meta: {
        total: 3,
        page: 3,
        limit: 5,
        totalPages: 1,
      },
    });
  });

  it('does not restrict results by level when the optional filter is omitted', async () => {
    const result = await service.findAll({
      page: 0,
      limit: 0,
      sortBy: 'id',
      order: 'ASC'
    });

    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      order: { id: 'ASC' },
    });
    expect(result.items).toEqual(courses);
    expect(result.meta.total).toBe(courses.length);
  });

  it('returns consecutive pages without repeating courses for the same order', async () => {
    const firstPage = await service.findAll({ page: 1, limit: 2, sortBy: 'id', order: 'ASC' });
    const secondPage = await service.findAll({ page: 2, limit: 2, sortBy: 'id', order: 'ASC' });
    const returnedIds = [...firstPage.items, ...secondPage.items].map((course) => course.id);

    expect(firstPage.items.map((course) => course.id)).toEqual([1, 2]);
    expect(secondPage.items.map((course) => course.id)).toEqual([3]);
    expect(new Set(returnedIds).size).toBe(returnedIds.length);
    expect(coursesRepository.findAndCount).toHaveBeenNthCalledWith(1, {
      where: {},
      skip: 0,
      take: 2,
      order: { id: 'ASC' },
    });
    expect(coursesRepository.findAndCount).toHaveBeenNthCalledWith(2, {
      where: {},
      skip: 2,
      take: 2,
      order: { id: 'ASC' },
    });
  });
});
