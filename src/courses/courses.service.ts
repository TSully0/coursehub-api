import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { Course } from './entities/courses.entity.js';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private readonly coursesRepository: Repository<Course>
    ) {}

   findAll(level?: string) { // 2
    return this.coursesRepository.find({ where: level ? { level } : {} }); 
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

    async update(id: string, dto: CreateCourseDto) {
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