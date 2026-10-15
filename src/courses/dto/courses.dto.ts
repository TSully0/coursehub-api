import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsIn(['beginner', 'intermediate', 'advanced'])
    level: string;
}

export class UpdateCourseDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsIn(['beginner', 'intermediate', 'advanced'])
    level?: string;
}

export class CoursesQueryDto {
    @IsOptional()
    @IsString()
    level?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 10;

    @IsOptional()
    @IsIn(['id', 'title', 'level'])
    sortBy: 'id' | 'title' | 'level' = 'id';

    @IsOptional()
    @Transform(({ value }) => String(value).toUpperCase())
    @IsIn(['ASC', 'DESC'])
    order: 'ASC' | 'DESC' = 'ASC';
}
