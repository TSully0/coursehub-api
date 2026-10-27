import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { StudentsModule } from '../students/students.module.js';
import { CoursesModule } from '../courses/courses.module.js';
import { Enrollment } from './entities/enrollments.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        StudentsModule,
        CoursesModule,
        AuthModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forFeature([Enrollment]),
    ],
    controllers: [EnrollmentsController],
    providers: [EnrollmentsService],
    exports: [EnrollmentsService],
})
export class EnrollmentsModule {}