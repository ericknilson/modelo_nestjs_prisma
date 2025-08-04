import { Task } from './entities/task.entity';

export interface TasksRepository {
  findAll(params: { limit: number; offset: number }): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(data: {
    name: string;
    description: string;
    completed: boolean;
    userId: string;
  }): Promise<Task>;
  update(
    id: string,
    data: Partial<{ name: string; description: string; completed: boolean }>,
  ): Promise<Task>;
  delete(id: string): Promise<void>;
}

export const TASKS_REPOSITORY = 'TasksRepository';

