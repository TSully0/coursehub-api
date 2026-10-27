import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';

describe('CoursesController', () => {
    let app: INestApplication;
    const jwtSecret = 'test-secret-with-at-least-32-characters';
    const coursesService = {
        findAll: vi.fn(),
        create: vi.fn(),
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
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CoursesController],
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({ secret: jwtSecret }),
            ],
            providers: [
                { provide: CoursesService, useValue: coursesService },
                JwtAuthGuard,
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

    it('rejects course creation without a token and does not modify data', async () => {
        await request(app.getHttpServer())
            .post('/courses')
            .send({ title: 'Unauthorized course', level: 'beginner' })
            .expect(401);

        expect(coursesService.create).not.toHaveBeenCalled();
    });
});
