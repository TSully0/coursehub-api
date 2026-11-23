import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../users/user-role.enum.js';
import { COURSE_REPOSITORY } from '../ports/course.repository.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

describe('UpdateCourseUseCase', () => {
  let useCase: UpdateCourseUseCase;
  const courses = {
    findById: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    courses.findById.mockReset();
    courses.save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        { provide: COURSE_REPOSITORY, useValue: courses },
      ],
    }).compile();

    useCase = module.get(UpdateCourseUseCase);
  });

  it('allows the owner teacher to update a course', async () => {
    // Arrange
    const actor = {
      id: 12,
      email: 'teacher@example.com',
      role: UserRole.TEACHER,
    };
    const course = {
      id: 4,
      title: 'Before',
      level: 'beginner',
      createdByUserId: actor.id,
    };
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (savedCourse) => savedCourse);

    // Act
    const result = await useCase.execute(4, { title: 'After' }, actor);

    // Assert
    expect(result).toBe(course);
    expect(course.title).toBe('After');
    expect(courses.findById).toHaveBeenCalledWith(4);
    expect(courses.save).toHaveBeenCalledWith(course);
  });

  it('allows an administrator to update a course owned by someone else', async () => {
    // Arrange
    const admin = {
      id: 12,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };
    const course = {
      id: 4,
      title: 'Before',
      level: 'beginner',
      createdByUserId: 99,
    };
    courses.findById.mockResolvedValue(course);
    courses.save.mockResolvedValue(course);

    // Act
    const result = await useCase.execute(4, { title: 'After' }, admin);

    // Assert
    expect(result).toBe(course);
    expect(course.title).toBe('After');
    expect(courses.save).toHaveBeenCalledWith(course);
  });

  it('rejects an update from a different teacher', async () => {
    // Arrange
    const actor = {
      id: 12,
      email: 'teacher@example.com',
      role: UserRole.TEACHER,
    };
    courses.findById.mockResolvedValue({
      id: 4,
      title: 'Before',
      level: 'beginner',
      createdByUserId: 99,
    });

    // Act / Assert
    await expect(
      useCase.execute(4, { title: 'After' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(courses.save).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown course', async () => {
    // Arrange
    const actor = {
      id: 12,
      email: 'teacher@example.com',
      role: UserRole.TEACHER,
    };
    courses.findById.mockResolvedValue(null);

    // Act / Assert
    await expect(
      useCase.execute(404, { title: 'After' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(courses.save).not.toHaveBeenCalled();
  });
});
