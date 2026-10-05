import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Student } from '../../students/entities/student.entity.js';
import { Course } from '../../courses/entities/courses.entity.js';

@Entity('enrollments')
@Unique(['student', 'course'])
export class Enrollment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Student, { nullable: false })
    @JoinColumn({ name: 'studentId' })
    student: Student;

    @ManyToOne(() => Course, { nullable: false })
    @JoinColumn({ name: 'courseId' })
    course: Course;
}