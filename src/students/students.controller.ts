import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe } from '@nestjs/common';
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
    create(@Body() createDto: CreateStudentDto) {
    return this.studentsService.create(createDto);
    }

    @Patch(':id')
    update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStudentDto,
    ) {
    return this.studentsService.update(id, updateDto);
    }

    @Patch(':id/active')
    toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleStudentActiveDto,
    ) {
    return this.studentsService.toggleActive(id, toggleDto.isActive);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
    }
}