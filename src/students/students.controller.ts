import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StudentsService } from './students.service.js';
import { CreateStudentDto, UpdateStudentDto, FilterStudentDto, ToggleStudentActiveDto } from './dto/student.dto.js';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) {}

    @Get()
    findAll(@Query() filters: FilterStudentDto) {
    return this.studentsService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createDto: CreateStudentDto) {
    return this.studentsService.create(createDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStudentDto,
    ) {
    return this.studentsService.update(id, updateDto);
    }

    @Patch(':id/active')
    @UseGuards(JwtAuthGuard)
    toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleStudentActiveDto,
    ) {
    return this.studentsService.toggleActive(id, toggleDto.isActive);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
    }
}