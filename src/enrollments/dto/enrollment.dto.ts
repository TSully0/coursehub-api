import { IsInt, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEnrollmentDto {
    @IsInt()
    @Min(1)
    studentId: number;

    @IsInt()
    @Min(1)
    courseId: number;
}

export class FilterEnrollmentDto {
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
    @IsInt()
    @Min(1)
    studentId?: number;

    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
    @IsInt()
    @Min(1)
    courseId?: number;
}