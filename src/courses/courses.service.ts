import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { UserRole } from '../users/user-role.enum.js';
import { CoursesQueryDto, CreateCourseDto, UpdateCourseDto } from './dto/courses.dto.js';
import { Course } from './entities/courses.entity.js';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private readonly coursesRepository: Repository<Course>
    ) {}

    async findAll(query: CoursesQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const sortBy = query.sortBy ?? 'id';
        const order = query.order ?? 'ASC';
        const sortOrder: FindOptionsOrder<Course> = {
            [sortBy]: order,
            ...(sortBy === 'id' ? {} : { id: 'ASC' }),
        };

        const [items, total] = await this.coursesRepository.findAndCount({
            where: query.level ? { level: query.level } : {},
            skip: (page - 1) * limit,
            take: limit,
            order: sortOrder,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id: number): Promise<Course> {
        const course = await this.coursesRepository.findOneBy({ id });
            if (!course) throw new NotFoundException(`Course ${id} not found`); 
            return course;
    }
    create(dto: CreateCourseDto, actor: AuthenticatedUser) {
    const course = this.coursesRepository.create({
        ...dto,
        createdBy: { id: actor.id },
    });
    return this.coursesRepository.save(course);
    }

    async update(id: number, dto: UpdateCourseDto, actor: AuthenticatedUser) {
    const course = await this.findOne(id);
    const canManageAny = actor.role === UserRole.ADMIN;
    const isOwner = course.createdByUserId === actor.id;
    if (!canManageAny && !isOwner) {
        throw new ForbiddenException('You cannot modify this course');
    }
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
    }

    async remove(id: number) {
    const course = await this.findOne(id);
    await this.coursesRepository.remove(course);
    return course;
    }
}    