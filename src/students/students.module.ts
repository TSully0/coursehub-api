import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module.js';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Student]),
        AuthModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule {}