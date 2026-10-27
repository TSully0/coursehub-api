import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsController', () => {
    let app: INestApplication;
    const jwtSecret = 'test-secret-with-at-least-32-characters';
    const enrollmentsService = {
        findAll: vi.fn(),
        create: vi.fn(),
    };

    beforeEach(async () => {
        enrollmentsService.findAll.mockReset().mockResolvedValue({
            items: [],
            meta: { total: 0, page: 1, limit: 10 },
        });
        enrollmentsService.create.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EnrollmentsController],
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({ secret: jwtSecret }),
            ],
            providers: [
                { provide: EnrollmentsService, useValue: enrollmentsService },
                JwtAuthGuard,
                JwtStrategy,
                { provide: ConfigService, useValue: { getOrThrow: () => jwtSecret } },
            ],
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

    it('rejects enrollment creation without a token and does not modify data', async () => {
        await request(app.getHttpServer())
            .post('/enrollments')
            .send({ studentId: 1, courseId: 1 })
            .expect(401);

        expect(enrollmentsService.create).not.toHaveBeenCalled();
    });
});
