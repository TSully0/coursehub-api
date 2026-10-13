import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'; // 1
import type { Relation } from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollments.entity.js';

@Entity('courses') // 2
export class Course { // 3
  @PrimaryGeneratedColumn() // 4
    id: number;

  @Column() // 5
    title: string;

  @Column() // 6
    level: string;
  
  @OneToMany(() => Enrollment, (enrollmnet) => enrollmnet.course)
  enrollments: Relation<Enrollment[]>;
}