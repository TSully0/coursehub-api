import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { StudentsModule } from '../students/students.module.js';
import { CoursesModule } from '../courses/courses.module.js';
import { Enrollment } from './entities/enrollments.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [StudentsModule, CoursesModule, TypeOrmModule.forFeature([Enrollment])],
    controllers: [EnrollmentsController],
    providers: [EnrollmentsService],
    exports: [EnrollmentsService],
})
export class EnrollmentsModule {}