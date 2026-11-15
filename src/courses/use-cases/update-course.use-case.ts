import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type.js';
import { UserRole } from '../../users/user-role.enum.js';
import { UpdateCourseDto } from '../dto/courses.dto.js';
import { COURSE_REPOSITORY } from '../ports/course.repository.js';
import type { CourseRepository } from '../ports/course.repository.js';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courses: CourseRepository,
  ) {}

  async execute(
    id: number,
    changes: UpdateCourseDto,
    actor: AuthenticatedUser,
  ) {
    const course = await this.courses.findById(id);
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    if (
      actor.role !== UserRole.ADMIN &&
      course.createdByUserId !== actor.id
    ) {
      throw new ForbiddenException('You cannot modify this course');
    }

    Object.assign(course, changes);
    return this.courses.save(course);
  }
}
