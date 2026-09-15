import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { PipeTransform, BadRequestException } from '@nestjs/common';

type Course = {
    id: number;
    name: string;
    email:string;
    age: number;
    career: string;
    semester: number;
    isActive: boolean;
};
type CreateCourseInput = {
    name: string;
    email:string;
    age: number;
    career: string;
    semester: number;
    isActive: boolean;
};

type UpdateCourseInput = {
    name?: string;
    email?:string;
    age?: number;
    career?: string;
    semester?: number;
    isActive: boolean;
};



@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
    transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
        throw new BadRequestException(`El ID '${value}' debe ser un número entero positivo válido`);
    }
    return val;
    }
}

@Injectable()
export class CoursesService {
    private nextId = 4;
    private readonly courses: Course[] = [
        { id: 1, name: 'Sully', email: 'sully@gmail.com', age: 20, career: 'Software', semester: 5, isActive: true },
        { id: 1, name: 'Luisa', email: 'luisa@gmail.com', age: 21, career: 'Agropecuaria', semester: 2 , isActive: false},
        { id: 1, name: 'Danna', email: 'danna@gmail.com', age: 19, career: 'Derecho', semester: 6 , isActive: false }   
    ];

    findAll(filters: CreateCourseDto): Course[] {
    let result = this.courses;

    if (filters.career) {
        result = result.filter(s => s.career.toLowerCase() === filters.career.toLowerCase());
    }
    if (filters.semester !== undefined) {
        result = result.filter(s => s.semester === filters.semester);
    }
    if (filters.isActive !== undefined) {
        result = result.filter(s => s.isActive === filters.isActive);
    }

    return result;
    }

    findOne(id: number): Course {
    const student = this.courses.find(s => s.id === id);
    if (!student) {
        throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
    }
    return student;
    }
    create(createCourseDto: CreateCourseDto): Course {
        const emailExists = this.courses.some(s => s.email === dto.email);
        if (emailExists) {
            throw new ConflictException('El correo ya esta registrado')
        }

        const course: Course = {
            id: this.nextId++,
            ...dto,
        };
        this.courses.push(course);
        return course;
    };

    update(id: number, dto: UpdateCourseInput): Course | undefined {
        const course = this.findOne(id);

    if (dto.email && dto.email !== course.email) {

    }

    Object.assign(course, oninput);
    return course;
    }

    remove(id: number): Course | undefined {
        const index = this.courses.findIndex((course) => course.id === id);

    if (index === -1) {
        return undefined;
    }

    const [removedCourse] = this.courses.splice(index, 1);
    return removedCourse;
    }
}
