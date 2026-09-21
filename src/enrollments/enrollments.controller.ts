import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto, FilterEnrollmentDto } from './dto/enrollment.dto.js';

@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) {}

    @Post()
    create(@Body() createDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createDto);
    }

    @Get()
    findAll(@Query() filters: FilterEnrollmentDto) {
    return this.enrollmentsService.findAll(filters);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.remove(id);
    }
}