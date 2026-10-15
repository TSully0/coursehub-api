import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';

describe('CoursesController', () => {
    let app: INestApplication;
    const coursesService = {
        findAll: vi.fn(),
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
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CoursesController],
            providers: [{ provide: CoursesService, useValue: coursesService }],
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
});
