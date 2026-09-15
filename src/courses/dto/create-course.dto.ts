import { IsString, IsOptional, IsEmail, IsInt, Min, Max, IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
export class CreateCourseDto {
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

export class FilterCourseDto {
    @IsOptional()
    @IsString()
    career?: string;

    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
    @IsInt()
    @Min(1)
    @Max(10)
    semester?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
    @IsBoolean()
    isActive?: boolean;
}