import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { Enrollment } from './entities/enrollments.entity.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsService', () => {
    let service: EnrollmentsService;
    const queryBuilder = {
        leftJoinAndSelect: vi.fn(),
        andWhere: vi.fn(),
        orderBy: vi.fn(),
        skip: vi.fn(),
        take: vi.fn(),
        getManyAndCount: vi.fn(),
    };
    const enrollmentsRepository = {
        createQueryBuilder: vi.fn(),
    };

    beforeEach(async () => {
        Object.values(queryBuilder).forEach((method) => method.mockReset());
        queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
        queryBuilder.andWhere.mockReturnValue(queryBuilder);
        queryBuilder.orderBy.mockReturnValue(queryBuilder);
        queryBuilder.skip.mockReturnValue(queryBuilder);
        queryBuilder.take.mockReturnValue(queryBuilder);
        queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
        enrollmentsRepository.createQueryBuilder.mockReset().mockReturnValue(queryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EnrollmentsService,
                { provide: getRepositoryToken(Enrollment), useValue: enrollmentsRepository },
                { provide: StudentsService, useValue: { findOne: vi.fn() } },
                { provide: CoursesService, useValue: { findOne: vi.fn() } },
            ],
        }).compile();

        service = module.get<EnrollmentsService>(EnrollmentsService);
    });

    it('joins related entities and applies parameterized optional filters and pagination', async () => {
        await service.findAll({
            search: "O'Neil",
            studentId: 4,
            courseId: 8,
            activeOnly: 'true',
            page: 2,
            limit: 5,
        });

        expect(enrollmentsRepository.createQueryBuilder).toHaveBeenCalledWith('enrollment');
        expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
            1,
            'enrollment.student',
            'student',
        );
        expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
            2,
            'enrollment.course',
            'course',
        );
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
            1,
            '(student.name ILIKE :search OR course.title ILIKE :search)',
            { search: "%O'Neil%" },
        );
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
            2,
            'student.id = :studentId',
            { studentId: 4 },
        );
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
            3,
            'course.id = :courseId',
            { courseId: 8 },
        );
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
            4,
            'student.isActive = :active',
            { active: true },
        );
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('enrollment.id', 'ASC');
        expect(queryBuilder.skip).toHaveBeenCalledWith(5);
        expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('omits optional conditions unless requested and returns pagination metadata', async () => {
        const enrollment = { id: 1 } as Enrollment;
        queryBuilder.getManyAndCount.mockResolvedValueOnce([[enrollment], 1]);

        const result = await service.findAll({
            page: 1,
            limit: 10,
            activeOnly: 'false',
        });

        expect(queryBuilder.andWhere).not.toHaveBeenCalled();
        expect(result).toEqual({
            items: [enrollment],
            meta: { total: 1, page: 1, limit: 10 },
        });
        expect(queryBuilder.skip).toHaveBeenCalledWith(0);
        expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });
});
