import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto, FilterStudentDto } from './dto/student.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity.js';

@Injectable()
export class StudentsService {
    students: any;
    constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    ) {}

    findAll(filters: FilterStudentDto): Promise<Student[]> {
        return this.studentsRepository.find({ where: { ...filters } });
    }

    async findOne(id: number): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student) throw new NotFoundException(`Estudiante ${id} no encontrado`);
    return student;
    }

    async create(dto: CreateStudentDto): Promise<Student> {
    await this.ensureEmailAvailable(dto.email);
    return this.studentsRepository.save(this.studentsRepository.create(dto));
    }

    private async ensureEmailAvailable(email: string, currentId?: number) {
    const existing = await this.studentsRepository.findOneBy({ email });
    if (existing && existing.id !== currentId) {
        throw new ConflictException('El correo ya pertenece a otra persona');
    }
    }

    async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = this.findOne(id);

    if (dto.email && dto.email !== (await student).email) {
        const emailExists = this.students.some((s: { email: string | undefined; }) => s.email === dto.email);
        if (emailExists) {
        throw new ConflictException('El correo ya pertenece a otro estudiante');     }
    }

    Object.assign(student, dto);
    return student;
    }

    async toggleActive(id: number, isActive: boolean): Promise<Student> {
    const student = this.findOne(id);
    (await student).isActive = isActive;
    return student;
    }

    async remove(id: number): Promise<Student> {
    const student = this.findOne(id);

    if (!(await student).isActive) {
        throw new BadRequestException('No se puede eliminar un estudiante inactivo');
    }

    const index = this.students.findIndex((s: { id: number; }) => s.id === id);
    const [removed] = this.students.splice(index, 1);
    return removed;
    }
}