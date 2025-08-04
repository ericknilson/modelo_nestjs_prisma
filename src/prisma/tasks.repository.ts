import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Task } from 'src/tasks/entities/task.entity';
import { TasksRepository } from 'src/tasks/tasks.repository';

@Injectable()
export class PrismaTasksRepository implements TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { limit: number; offset: number }): Promise<Task[]> {
    const { limit, offset } = params;
    return this.prisma.task.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Task | null> {
    return this.prisma.task.findFirst({ where: { id } });
  }

  create(data: {
    name: string;
    description: string;
    completed: boolean;
    userId: string;
  }): Promise<Task> {
    return this.prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        completed: data.completed,
        userId: data.userId,
      },
    });
  }

  update(
    id: string,
    data: Partial<{ name: string; description: string; completed: boolean }>,
  ): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }
}

