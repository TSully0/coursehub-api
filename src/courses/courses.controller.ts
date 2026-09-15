import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoursesService, ParseIdPipe } from './courses.service.js';
import { CreateCourseDto, FilterCourseDto } from './dto/create-course.dto.js';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    @Get()
    findAll(@Query() filters: FilterCourseDto) {
        return this.coursesService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id', ParseIdPipe) id: number) {
        return this.coursesService.findOne(id);
    }

    @Post()
    create(@Body() createCourseDto: CreateCourseDto) {
        return this.coursesService.create(createCourseDto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIdPipe) id: number,
        @Body() updateCourseDto: CreateCourseDto,
    ) {
        return this.coursesService.update(id, updateCourseDto);
    }


    @Delete(':id')
    remove(@Param('id', ParseIdPipe) id: number) {
        return this.coursesService.remove(id);
    }
}