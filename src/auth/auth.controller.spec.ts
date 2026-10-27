import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

describe('AuthController', () => {
  let app: INestApplication;
  const jwtSecret = 'test-secret-with-at-least-32-characters';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: jwtSecret })],
      providers: [
        { provide: AuthService, useValue: {} },
        JwtAuthGuard,
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: () => jwtSecret } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects the profile request without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('returns the authenticated user identity from a valid bearer token', async () => {
    const token = app.get(JwtService).sign({ sub: 1, email: 'ana@example.com' });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ id: 1, email: 'ana@example.com' });
  });
});
