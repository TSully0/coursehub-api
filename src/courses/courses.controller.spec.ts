import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { UserRole } from '../users/user-role.enum.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';

describe('CoursesController', () => {
    let app: INestApplication;
    const jwtSecret = 'test-secret-with-at-least-32-characters';
    const coursesService = {
        findAll: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    };
    const updateCourse = {
        execute: vi.fn(),
    };

    beforeEach(async () => {
        coursesService.findAll.mockReset().mockResolvedValue({
            items: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        });
        coursesService.create.mockReset();
        coursesService.update.mockReset();
        updateCourse.execute.mockReset();
        coursesService.remove.mockReset().mockResolvedValue({ id: 1 });
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CoursesController],
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({ secret: jwtSecret }),
            ],
            providers: [
                { provide: CoursesService, useValue: coursesService },
                { provide: UpdateCourseUseCase, useValue: updateCourse },
                JwtAuthGuard,
                RolesGuard,
                JwtStrategy,
                { provide: ConfigService, useValue: { getOrThrow: () => jwtSecret } },
            ],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('passes validated filters and pagination from the HTTP query', async () => {
        coursesService.findAll.mockResolvedValueOnce({
            items: [],
            meta: {
                total: 0,
                page: 2,
                limit: 5,
                totalPages: 0,
            },
        });

        await request(app.getHttpServer())
            .get('/courses?level=advanced&page=2&limit=5&sortBy=title&order=desc')
            .expect(200)
            .expect({
                items: [],
                meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
            });

        expect(coursesService.findAll).toHaveBeenCalledWith({
            level: 'advanced',
            page: 2,
            limit: 5,
            sortBy: 'title',
            order: 'DESC',
        });
    });

    it('applies query DTO defaults when no parameters are provided', async () => {
        await request(app.getHttpServer()).get('/courses').expect(200);

        expect(coursesService.findAll).toHaveBeenCalledWith({
            level: undefined,
            page: 1,
            limit: 10,
            sortBy: 'id',
            order: 'ASC',
        });
    });

    it('rejects invalid pagination and unsupported query parameters', async () => {
        await request(app.getHttpServer()).get('/courses?limit=101').expect(400);
        await request(app.getHttpServer()).get('/courses?unexpected=value').expect(400);

        expect(coursesService.findAll).not.toHaveBeenCalled();
    });

    it('rejects a non-numeric course ID before calling the service', async () => {
        await request(app.getHttpServer()).get('/courses/not-a-number').expect(400);

        expect(coursesService.findOne).not.toHaveBeenCalled();
    });

    it('rejects course creation without a token and does not modify data', async () => {
        await request(app.getHttpServer())
            .post('/courses')
            .send({ title: 'Unauthorized course', level: 'beginner' })
            .expect(401);

        expect(coursesService.create).not.toHaveBeenCalled();
    });

    it('passes the authenticated actor to course creation and rejects a client-supplied owner', async () => {
        const token = app.get(JwtService).sign({
            sub: 7,
            email: 'teacher@example.com',
            role: UserRole.TEACHER,
        });

        await request(app.getHttpServer())
            .post('/courses')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Owned course', level: 'beginner' })
            .expect(201);

        expect(coursesService.create).toHaveBeenCalledWith(
            { title: 'Owned course', level: 'beginner' },
            { id: 7, email: 'teacher@example.com', role: UserRole.TEACHER },
        );

        await request(app.getHttpServer())
            .post('/courses')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Spoofed owner', level: 'beginner', createdByUserId: 99 })
            .expect(400);

        expect(coursesService.create).toHaveBeenCalledTimes(1);
    });

    it('passes the authenticated actor to course updates', async () => {
        const token = app.get(JwtService).sign({
            sub: 7,
            email: 'teacher@example.com',
            role: UserRole.TEACHER,
        });

        updateCourse.execute.mockResolvedValue({
            id: 1,
            title: 'Updated course',
        });

        await request(app.getHttpServer())
            .patch('/courses/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated course' })
            .expect(200);

        expect(updateCourse.execute).toHaveBeenCalledWith(
            1,
            { title: 'Updated course' },
            { id: 7, email: 'teacher@example.com', role: UserRole.TEACHER },
        );
    });

    it('propagates a forbidden update error instead of returning success', async () => {
        const token = app.get(JwtService).sign({
            sub: 7,
            email: 'student@example.com',
            role: UserRole.STUDENT,
        });
        updateCourse.execute.mockRejectedValue(
            new ForbiddenException('You cannot modify this course'),
        );

        await request(app.getHttpServer())
            .patch('/courses/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Unauthorized update' })
            .expect(403);

        expect(updateCourse.execute).toHaveBeenCalledWith(
            1,
            { title: 'Unauthorized update' },
            { id: 7, email: 'student@example.com', role: UserRole.STUDENT },
        );
        expect(coursesService.update).not.toHaveBeenCalled();
    });

    it('requires an administrator to delete a course', async () => {
        const studentToken = app.get(JwtService).sign({
            sub: 7,
            email: 'student@example.com',
            role: UserRole.STUDENT,
        });
        const adminToken = app.get(JwtService).sign({
            sub: 8,
            email: 'admin@example.com',
            role: UserRole.ADMIN,
        });

        await request(app.getHttpServer()).delete('/courses/1').expect(401);
        expect(coursesService.remove).not.toHaveBeenCalled();

        await request(app.getHttpServer())
            .delete('/courses/1')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(403);
        expect(coursesService.remove).not.toHaveBeenCalled();

        await request(app.getHttpServer())
            .delete('/courses/1')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(coursesService.remove).toHaveBeenCalledWith(1);
    });
});
