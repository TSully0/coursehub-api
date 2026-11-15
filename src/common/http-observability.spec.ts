import { BadRequestException, Controller, Get, Logger, Module, NotFoundException, Query, ValidationPipe } from '@nestjs/common';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { lastValueFrom, of, throwError } from 'rxjs';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpErrorFilter } from './filters/http-error.filter.js';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { TimingInterceptor } from './interceptors/timing.interceptor.js';

class LimitQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}

@Controller('observability-test')
class ObservabilityTestController {
  @Get('bad-request')
  badRequest(@Query() _query: LimitQuery): void {}

  @Get('not-found')
  notFound(): never {
    throw new NotFoundException('Record not found');
  }

  @Get('unexpected')
  unexpected(): never {
    throw new Error('sensitive database details');
  }

  @Get('explicit-bad-request')
  explicitBadRequest(): never {
    throw new BadRequestException('Invalid request');
  }
}

@Module({ controllers: [ObservabilityTestController] })
class ObservabilityTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}

describe('HTTP observability', () => {
  let app: INestApplication;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ObservabilityTestModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpErrorFilter());
    app.useGlobalInterceptors(new TimingInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('returns a consistent validation error response', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/bad-request?limit=invalid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/observability-test/bad-request',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    expect(response.body.message.statusCode).toBe(400);
  });

  it('returns a consistent not-found response', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/not-found')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/observability-test/not-found',
      message: { statusCode: 404, message: 'Record not found' },
    });
  });

  it('hides unexpected error details from the response and logs only safe context', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/unexpected?token=query-secret')
      .expect(500);

    expect(response.body).toMatchObject({
      statusCode: 500,
      path: '/observability-test/unexpected',
      message: 'Internal server error',
    });
    expect(JSON.stringify(response.body)).not.toContain('sensitive database details');
    expect(JSON.stringify(response.body)).not.toContain('query-secret');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"exceptionType":"Error"'),
    );
    expect(errorSpy.mock.calls[0][0]).not.toContain('sensitive database details');
    expect(errorSpy.mock.calls[0][0]).not.toContain('query-secret');
  });

  it('logs only safe request context and response timing, including errors', async () => {
    await request(app.getHttpServer())
      .get('/observability-test/explicit-bad-request?password=query-secret')
      .set('Authorization', 'Bearer header-secret')
      .expect(400);

    const loggedMessages = logSpy.mock.calls.map(([message]) => String(message));
    const requestLog = loggedMessages.find((message) =>
      message.includes('"method":"GET"'),
    );
    expect(requestLog).toContain('"path":"/observability-test/explicit-bad-request"');
    expect(requestLog).toContain('"status":400');
    expect(loggedMessages.some((message) => message.includes('"durationMs":'))).toBe(true);

    const allLogs = loggedMessages.join('\n');
    expect(allLogs).not.toContain('header-secret');
    expect(allLogs).not.toContain('query-secret');
    expect(allLogs).not.toContain('password');
  });

  it('measures failed handler executions without swallowing errors', async () => {
    const interceptor = new TimingInterceptor();
    const error = new Error('handler failure');
    const handler: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(
      lastValueFrom(interceptor.intercept({} as ExecutionContext, handler)),
    ).rejects.toBe(error);
  });

  it('passes successful handler results through unchanged', async () => {
    const interceptor = new TimingInterceptor();
    const result = { ok: true };
    const handler: CallHandler = { handle: () => of(result) };

    await expect(
      lastValueFrom(interceptor.intercept({} as ExecutionContext, handler)),
    ).resolves.toEqual(result);
  });
});
