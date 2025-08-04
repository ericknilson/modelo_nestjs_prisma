import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_FILTER } from '@nestjs/core';
import { ApiExceptionFilter } from 'src/common/filters/exception-filter';
import { TaskUtils } from './tasks.utils';
import { PrismaTasksRepository } from '../prisma/tasks.repository';
import { TASKS_REPOSITORY } from './tasks.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskUtils,
    {
      provide: TASKS_REPOSITORY,
      useClass: PrismaTasksRepository,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: 'KEY_TOKEN',
      useValue: 'TOKEN_123456789',
    },
  ],
})
export class TasksModule {}
