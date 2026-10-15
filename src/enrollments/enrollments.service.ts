import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateEnrollmentDto, EnrollmentsQueryDto } from './dto/enrollment.dto.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollments.entity.js';

@Injectable()
export class EnrollmentsService {
    constructor(
        private readonly studentsService: StudentsService,
        private readonly coursesService: CoursesService,
        @InjectRepository(Enrollment)
        private readonly enrollmentsRepository: Repository<Enrollment>,
    ) {}

    async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
        const student = await this.studentsService.findOne(dto.studentId);
        await this.coursesService.findOne(String(dto.courseId));

        if (!student.isActive) {
            throw new BadRequestException(`El estudiante ${dto.studentId} está inactivo`);
        }

        const exists = await this.enrollmentsRepository.findOne({
            where: {
                student: { id: dto.studentId },
                course: { id: dto.courseId },
            },
        });
        if (exists) {
            throw new ConflictException('La combinación de estudiante y curso ya existe');
        }

        const enrollment = this.enrollmentsRepository.create({
            student: { id: dto.studentId },
            course: { id: dto.courseId },
        });
        return this.enrollmentsRepository.save(enrollment);
    }

    async findAll(query: EnrollmentsQueryDto) {
        const page = query.page;
        const limit = query.limit;
        const queryBuilder = this.enrollmentsRepository
            .createQueryBuilder('enrollment')
            .leftJoinAndSelect('enrollment.student', 'student')
            .leftJoinAndSelect('enrollment.course', 'course');

        if (query.search?.trim()) {
            queryBuilder.andWhere(
                '(student.name ILIKE :search OR course.title ILIKE :search)',
                { search: `%${query.search.trim()}%` },
            );
        }
        if (query.studentId !== undefined) {
            queryBuilder.andWhere('student.id = :studentId', { studentId: query.studentId });
        }
        if (query.courseId !== undefined) {
            queryBuilder.andWhere('course.id = :courseId', { courseId: query.courseId });
        }
        if (query.activeOnly === 'true') {
            queryBuilder.andWhere('student.isActive = :active', { active: true });
        }

        const [items, total] = await queryBuilder
            .orderBy('enrollment.id', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            meta: { total, page, limit },
        };
    }

    async findByStudent(studentId: number): Promise<Enrollment[]> {
        await this.studentsService.findOne(studentId);
        return this.enrollmentsRepository.find({
            where: { student: { id: studentId } },
            relations: { student: true, course: true },
        });
    }

    async findByCourse(courseId: number): Promise<Enrollment[]> {
        await this.coursesService.findOne(String(courseId));
        return this.enrollmentsRepository.find({
            where: { course: { id: courseId } },
            relations: { student: true, course: true },
        });
    }

    async remove(id: number): Promise<Enrollment> {
        const enrollment = await this.enrollmentsRepository.findOne({
            where: { id },
            relations: { student: true, course: true },
        });
        if (!enrollment) {
            throw new NotFoundException('Matrícula con ID no encontrada');
        }

        return this.enrollmentsRepository.remove(enrollment);
    }
}