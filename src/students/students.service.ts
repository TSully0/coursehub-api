import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto, FilterStudentDto } from './dto/student.dto.js';

export type Student = {
    id: number;
    name: string;
    email: string;
    age: number;
    career: string;
    semester: number;
    isActive: boolean;
};

@Injectable()
export class StudentsService {
    private nextId = 1;
    private readonly students: Student[] = [];

    findAll(filters: FilterStudentDto): Student[] {
    let result = this.students;

    if (filters.career) {
        result = result.filter(s => s.career === filters.career);
    }
    if (filters.semester !== undefined) {
        result = result.filter(s => s.semester === filters.semester);
    }
    if (filters.isActive !== undefined) {
        result = result.filter(s => s.isActive === filters.isActive);
    }

    return result;
    }

    findOne(id: number): Student {
    const student = this.students.find(s => s.id === id);
    if (!student) {
        throw new NotFoundException('Estudiante con ID no encontrado');
    }
    return student;
    }

    create(dto: CreateStudentDto): Student {
    const emailExists = this.students.some(s => s.email === dto.email);
    if (emailExists) {
        throw new ConflictException('El correo ya está registrado');
    }

    const student: Student = { id: this.nextId++, ...dto };
    this.students.push(student);
    return student;
    }

    update(id: number, dto: UpdateStudentDto): Student {
    const student = this.findOne(id);

    if (dto.email && dto.email !== student.email) {
        const emailExists = this.students.some(s => s.email === dto.email);
        if (emailExists) {
        throw new ConflictException('El correo ya pertenece a otro estudiante');     }
    }

    Object.assign(student, dto);
    return student;
    }

    toggleActive(id: number, isActive: boolean): Student {
    const student = this.findOne(id);
    student.isActive = isActive;
    return student;
    }

    remove(id: number): Student {
    const student = this.findOne(id);

    if (!student.isActive) {
        throw new BadRequestException('No se puede eliminar un estudiante inactivo');
    }

    const index = this.students.findIndex(s => s.id === id);
    const [removed] = this.students.splice(index, 1);
    return removed;
    }
}