import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureCors } from '../src/config/cors.js';
import { Course } from '../src/courses/entities/courses.entity.js';
import { User } from '../src/users/entities/user.entity.js';
import { UserRole } from '../src/users/user-role.enum.js';
import { Enrollment } from '../src/enrollments/entities/enrollments.entity.js';
import { Student } from '../src/students/entities/student.entity.js';

const testEnvironment = {
  NODE_ENV: 'test',
  CORS_ORIGINS: 'http://localhost:5173',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: 'coursehub_test_only',
  DB_USER: 'coursehub_e2e',
  DB_PASSWORD: 'e2e-placeholder-not-a-credential',
  JWT_SECRET: 'e2e-only-secret-that-is-never-used-outside-tests',
  JWT_EXPIRES_IN: '15m',
} as const;

const previousEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [
    key,
    process.env[key],
  ]),
);

for (const [key, value] of Object.entries(testEnvironment)) {
  process.env[key] = value;
}

describe('Course HTTP API (e2e)', () => {
  let app: INestApplication;
  let AppModule: typeof import('../src/app.module.js').AppModule;
  let courses: Course[];
  let courseRepository: ReturnType<typeof createCourseRepository>;
  beforeAll(async () => {
    ({ AppModule } = await import('../src/app.module.js'));
  });

  beforeEach(async () => {
    courses = [
      {
        id: 1,
        title: 'E2E fixture course',
        level: 'beginner',
        createdByUserId: 7,
      } as Course,
    ];

    courseRepository = createCourseRepository(() => courses);
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(createTestDataSource(() => courseRepository))
      .compile();

    app = testingModule.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    configureCors(app, [testEnvironment.CORS_ORIGINS]);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  afterAll(async () => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns the seeded course list over HTTP', async () => {
    const response = await request(app.getHttpServer())
      .get('/courses')
      .expect(200);

    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: 1,
        title: 'E2E fixture course',
        level: 'beginner',
      }),
    ]);
    expect(response.body.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
    });
  });

  it('creates a course for an authenticated teacher and persists it for subsequent reads', async () => {
    const token = app.get(JwtService).sign({
      sub: 7,
      email: 'teacher@example.test',
      role: UserRole.TEACHER,
    });

    const created = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Created through HTTP', level: 'intermediate' })
      .expect(201);

    expect(created.body).toMatchObject({
      id: 2,
      title: 'Created through HTTP',
      level: 'intermediate',
      createdByUserId: 7,
    });
    expect(courseRepository.save).toHaveBeenCalledTimes(1);

    const listed = await request(app.getHttpServer())
      .get('/courses')
      .expect(200);
    expect(listed.body.items).toHaveLength(2);
    expect(listed.body.items[1]).toMatchObject({
      id: 2,
      title: 'Created through HTTP',
      createdByUserId: 7,
    });
  });

  it('rejects course creation without a token', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Unauthenticated course', level: 'beginner' })
      .expect(401);

    expect(courseRepository.save).not.toHaveBeenCalled();
    expect(courses).toHaveLength(1);
  });

  it('denies a teacher access to the administrator-only delete route', async () => {
    const token = app.get(JwtService).sign({
      sub: 7,
      email: 'teacher@example.test',
      role: UserRole.TEACHER,
    });

    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(courseRepository.remove).not.toHaveBeenCalled();
    expect(courses).toHaveLength(1);
  });
});

function createCourseRepository(getCourses: () => Course[]) {
  return {
    findAndCount: vi.fn(
      async ({ skip = 0, take = 10 }: { skip?: number; take?: number }) => {
        const allCourses = getCourses();
        return [allCourses.slice(skip, skip + take), allCourses.length] as const;
      },
    ),
    create: vi.fn(
      (course: {
        title: string;
        level: string;
        createdBy?: { id: number };
      }) => ({ ...course }) as Course,
    ),
    save: vi.fn(async (course: Course) => {
      const savedCourse = {
        ...course,
        id: course.id ?? getCourses().length + 1,
        createdByUserId: course.createdBy?.id ?? null,
      };
      getCourses().push(savedCourse as Course);
      return savedCourse as Course;
    }),
    findOneBy: vi.fn(async ({ id }: { id: number }) => {
      return getCourses().find((course) => course.id === id) ?? null;
    }),
    remove: vi.fn(async (course: Course) => {
      const index = getCourses().findIndex(({ id }) => id === course.id);
      if (index >= 0) {
        getCourses().splice(index, 1);
      }
      return course;
    }),
  };
}

function createTestDataSource(
  getCoursesRepository: () => ReturnType<typeof createCourseRepository>,
) {
  const repositories = new Map<Function, object>([
    [Course, getCoursesRepository()],
    [User, {}],
    [Student, {}],
    [Enrollment, {}],
  ]);
  const getRepository = (entity: Function) => {
    const repository = repositories.get(entity);
    if (!repository) {
      throw new Error(`No in-memory repository configured for ${entity.name}`);
    }
    return repository;
  };

  return {
    manager: { getRepository },
    getRepository,
    isInitialized: false,
    entityMetadatas: [],
    options: { type: 'postgres' },
  };
}
