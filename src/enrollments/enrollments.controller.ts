import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto, EnrollmentsQueryDto } from './dto/enrollment.dto.js';

@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createDto);
    }

    @Get()
    findAll(@Query() query: EnrollmentsQueryDto) {
    return this.enrollmentsService.findAll(query);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.remove(id);
    }
}