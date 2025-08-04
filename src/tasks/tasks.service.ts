import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { TasksRepository, TASKS_REPOSITORY } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepository: TasksRepository,
  ) {}

  async findAll(paginationDto?: PaginationDto): Promise<ResponseTaskDto[]> {
    const { limit = 10, offset = 0 } = paginationDto ?? {};

    const allTasks = await this.tasksRepository.findAll({
      limit,
      offset,
    });

    return allTasks;
  }

  async findOne(id: string): Promise<ResponseTaskDto> {
    const task = await this.tasksRepository.findById(id);

    if (task?.name) return task;

    throw new HttpException(
      'Tarefa não foi encontrada!',
      HttpStatus.BAD_REQUEST,
    );
  }

  async create(
    createTaskDto: CreateTaskDto,
    tokenPayload: PayloadTokenDto,
  ): Promise<ResponseTaskDto> {
    try {
      const newTask = await this.tasksRepository.create({
        name: createTaskDto.name,
        description: createTaskDto.description,
        completed: false,
        userId: tokenPayload.sub,
      });

      return newTask;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falhaa ao cadastrar trarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    tokenPayload: PayloadTokenDto,
  ): Promise<ResponseTaskDto> {
    try {
      const findTask = await this.tasksRepository.findById(id);

      if (!findTask) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }

      if (findTask.userId !== tokenPayload.sub) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }

      const task = await this.tasksRepository.update(findTask.id, {
        name: updateTaskDto?.name ? updateTaskDto?.name : findTask.name,
        description: updateTaskDto?.description
          ? updateTaskDto?.description
          : findTask.description,
        completed: updateTaskDto?.completed
          ? updateTaskDto?.completed
          : findTask.completed,
      });

      return task;
    } catch {
      throw new HttpException(
        'Falha ao atualizar essa tarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(id: string, tokenPayload: PayloadTokenDto) {
    try {
      const findTask = await this.tasksRepository.findById(id);

      if (!findTask) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }

      if (findTask.userId !== tokenPayload.sub) {
        throw new HttpException(
          'Falha ao deletar essa tarefa!',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.tasksRepository.delete(findTask.id);

      return {
        message: 'Tarefa deletada com sucesso!',
      };
    } catch {
      throw new HttpException(
        'Falha ao deletar essa tarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
