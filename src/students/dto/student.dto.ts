import { IsString, IsEmail, IsInt, Min, Max, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStudentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsInt()
    @Min(1)
    age: number;

    @IsString()
    @IsNotEmpty()
    career: string;

    @IsInt()
    @Min(1)
    @Max(10)
    semester: number;

    @IsBoolean()
    isActive: boolean;
    }

    export class UpdateStudentDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    age?: number;

    @IsOptional()
    @IsString()
    career?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    semester?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
    }

    export class FilterStudentDto {
    @IsOptional()
    @IsString()
    career?: string;

    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
    @IsInt()
    @Min(1)
    @Max(10)
    semester?: number;

    @IsOptional()
    @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
    @IsBoolean()
    isActive?: boolean;
    }

    export class ToggleStudentActiveDto {
    @IsBoolean()
    isActive: boolean;
    }