import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';
import { CoursesModule } from './courses/courses.module.js';
import { StudentsModule } from './students/students.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'src/.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        CORS_ORIGINS: Joi.string()
          .custom((value, helpers) => {
            const origins = value.split(',').map((origin: string) => origin.trim());
            if (origins.some((origin: string) => !origin || origin === '*')) {
              return helpers.error('any.invalid');
            }
            return origins.join(',');
          })
          .when('NODE_ENV', {
            is: 'production',
            // Joi uses `then` as the branch key for a conditional schema.
            // oxlint-disable-next-line unicorn/no-thenable
            then: Joi.required(),
            otherwise: Joi.string().default('http://localhost:5173'),
          })
          .messages({
            'any.invalid': 'CORS_ORIGINS must contain explicit origins and cannot include *',
          }),
        PORT: Joi.number().port().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(5432),
        DB_NAME: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
      })
        .custom((config, helpers) => {
          if (config.NODE_ENV !== 'development' && config.DB_PASSWORD.length === 0) {
            return helpers.error('any.invalid');
          }
          return config;
        })
        .messages({
          'any.invalid': 'DB_PASSWORD must be non-empty outside development',
        }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.getOrThrow<string>('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController, WelcomeController],
  providers: [
    AppService,
    WelcomeService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}