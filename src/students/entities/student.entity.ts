import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollments.entity.js';

@Entity('students')
export class Student {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'int' })
    age: number;

    @Column()
    career: string;

    @Column({ type: 'int' })
    semester: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Enrollment, (enrollmnet) => enrollmnet.student)
    enrollments: Relation<Enrollment[]>;
}