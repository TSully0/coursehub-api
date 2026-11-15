import type { INestApplication } from '@nestjs/common';

export function configureCors(app: Pick<INestApplication, 'enableCors'>, origins: string[]): void {
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
