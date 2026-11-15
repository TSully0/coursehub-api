import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { UserRole } from '../users/user-role.enum.js';
import { configureCors } from '../config/cors.js';

describe('AuthController', () => {
  let app: INestApplication;
  const jwtSecret = 'test-secret-with-at-least-32-characters';
  const authService = {
    login: vi.fn().mockResolvedValue({ accessToken: 'signed-token' }),
    register: vi.fn(),
  };

  beforeEach(async () => {
    authService.login.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: jwtSecret }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        JwtAuthGuard,
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: () => jwtSecret } },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    configureCors(app, ['http://localhost:5173']);
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
      .expect({ id: 1, email: 'ana@example.com', role: UserRole.STUDENT });
  });

  it('allows preflight requests only from configured origins', async () => {
    await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173');

    const response = await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('still requires JWT on protected routes from an allowed origin', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Origin', 'http://localhost:5173')
      .expect(401)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173');
  });

  it('returns 429 on the sixth login request in one minute', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ana@example.com', password: 'wrong-password' })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'wrong-password' })
      .expect(429);

    expect(authService.login).toHaveBeenCalledTimes(5);
  });
});
