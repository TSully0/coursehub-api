import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { WelcomeService } from './welcome.service.js';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @Get()
  getWelcome() {
    return this.welcomeService.getMessage();
}}

@Controller()
export class AppController {
  constructor (private readonly appService: AppService) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}