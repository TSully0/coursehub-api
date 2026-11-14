import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from 'typeorm'; // 1
import type { Relation } from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollments.entity.js';
import { User } from '../../users/entities/user.entity.js';

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

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: Relation<User> | null;

  @RelationId((course: Course) => course.createdBy)
  createdByUserId: number | null;
}