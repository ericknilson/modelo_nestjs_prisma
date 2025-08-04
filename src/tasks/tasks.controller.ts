import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/param/token-payload.param';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar todas as tarefas' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Limite de tarefas a ser buscadas',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Itens que deseja pular',
  })
  findAllTasks(@Query() paginationDto: PaginationDto) {
    return this.taskService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes dee uma tarefa' })
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
    example: 1,
  })
  findOneTask(@Param('id', ParseIntPipe) id: string) {
    return this.taskService.findOne(id);
  }

  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova tarefa' })
  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.create(createTaskDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma tarefa especifica' })
  @ApiParam({
    name: 'id',
    description: 'ID da tarefa',
  })
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.update(id, updateTaskDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma tarefa' })
  @Delete(':id')
  deleteTask(
    @Param('id', ParseIntPipe) id: string,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.delete(id, tokenPayload);
  }
}
