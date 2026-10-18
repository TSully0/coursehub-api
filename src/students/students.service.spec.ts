import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './entities/student.entity.js';
import { StudentsService } from './students.service.js';

describe('StudentsService', () => {
  let service: StudentsService;
  const studentsRepository = {
    find: vi.fn(),
  };

  beforeEach(async () => {
    studentsRepository.find.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: studentsRepository },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('omits undefined optional filters from the TypeORM where clause', async () => {
    await service.findAll({
      career: undefined,
      semester: undefined,
      isActive: undefined,
    });

    expect(studentsRepository.find).toHaveBeenCalledWith({ where: {} });
  });

  it('applies the provided student filters', async () => {
    await service.findAll({
      career: 'Engineering',
      semester: 3,
      isActive: false,
    });

    expect(studentsRepository.find).toHaveBeenCalledWith({
      where: { career: 'Engineering', semester: 3, isActive: false },
    });
  });
});
