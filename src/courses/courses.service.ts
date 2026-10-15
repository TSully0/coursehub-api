import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
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
    async findOne(id: string): Promise<Course> {
        const course = await this.coursesRepository.findOneBy({ id: Number(id) }); 
            if (!course) throw new NotFoundException(`Course ${id} not found`); 
            return course;
    }
    create(dto: CreateCourseDto) { // 6
    const course = this.coursesRepository.create(dto);
    return this.coursesRepository.save(course);
    }

    async update(id: string, dto: UpdateCourseDto) {
    const course = await this.findOne(id); // 7
    Object.assign(course, dto);
    return this.coursesRepository.save(course); // 8
    }

    async remove(id: string) {
    const course = await this.findOne(id); // 9
    await this.coursesRepository.remove(course); // 10
    return course;
    }
}    