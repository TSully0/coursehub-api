import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsController', () => {
    let app: INestApplication;
    const enrollmentsService = {
        findAll: vi.fn(),
    };

    beforeEach(async () => {
        enrollmentsService.findAll.mockReset().mockResolvedValue({
            items: [],
            meta: { total: 0, page: 1, limit: 10 },
        });

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EnrollmentsController],
            providers: [{ provide: EnrollmentsService, useValue: enrollmentsService }],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
        );
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('transforms and validates enrollment query parameters', async () => {
        await request(app.getHttpServer())
            .get('/enrollments?search=algorithms&studentId=4&courseId=8&activeOnly=false&page=2&limit=5')
            .expect(200);

        expect(enrollmentsService.findAll).toHaveBeenCalledWith({
            search: 'algorithms',
            studentId: 4,
            courseId: 8,
            activeOnly: 'false',
            page: 2,
            limit: 5,
        });
    });

    it('rejects invalid booleans and limits', async () => {
        await request(app.getHttpServer()).get('/enrollments?activeOnly=yes').expect(400);
        await request(app.getHttpServer()).get('/enrollments?limit=51').expect(400);

        expect(enrollmentsService.findAll).not.toHaveBeenCalled();
    });
});
