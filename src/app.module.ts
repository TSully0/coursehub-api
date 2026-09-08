import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';

  @Module({
  imports: [],
  controllers: [AppController, WelcomeController],
  providers: [AppService,  WelcomeService],
})
export class AppModule {}
