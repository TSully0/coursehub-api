import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateEnrollmentDto, FilterEnrollmentDto } from './dto/enrollment.dto.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';

export type Enrollment = {
    id: number;
    studentId: number;
    courseId: number;
};

@Injectable()
export class EnrollmentsService {
    private readonly enrollments: Enrollment[] = [];
    private nextId = 1;

    constructor(
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
) {}

create(dto: CreateEnrollmentDto): Enrollment {
    const student = this.studentsService.findOne(dto.studentId);

    if (!student.isActive) {
    throw new BadRequestException('El estudiante con ID se encuentra inactivo');
    }

    this.coursesService.findOne(dto.courseId);

    const exists = this.enrollments.some(
    (e) => e.studentId === dto.studentId && e.courseId === dto.courseId,
    );
    if (exists) {
    throw new ConflictException('La combinación de estudiante y curso ya existe');
    }

    const enrollment: Enrollment = {
        id: this.nextId++,
        studentId: dto.studentId,
        courseId: dto.courseId,
    };

    this.enrollments.push(enrollment);
    return enrollment;
    }

findAll(filters: FilterEnrollmentDto): Enrollment[] {
    let result = this.enrollments;

    if (filters.studentId) {
    result = result.filter((e) => e.studentId === filters.studentId);
    }
    if (filters.courseId) {
        result = result.filter((e) => e.courseId === filters.courseId);
    }

    return result;
    }

    findByStudent(studentId: number): Enrollment[] {
    this.studentsService.findOne(studentId);
    return this.enrollments.filter((e) => e.studentId === studentId);
    }

    findByCourse(courseId: number): Enrollment[] {
    this.coursesService.findOne(courseId);
    return this.enrollments.filter((e) => e.courseId === courseId);
    }

    remove(id: number): Enrollment {
    const index = this.enrollments.findIndex((e) => e.id === id);
    if (index === -1) {
    throw new NotFoundException('Matrícula con ID no encontrada');
    }

    const [removed] = this.enrollments.splice(index, 1);
    return removed;
    }
}