/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
// import * as dotenv from 'dotenv';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { TasksModule } from 'src/tasks/tasks.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeAll(() => {
    execSync(`cross-env $(cat .env.test | xargs) npx prisma migrate deploy`);
  });

  beforeEach(async () => {
    // dotenv.config({ path: resolve(join(process.cwd(), '.env.test')) });
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        TasksModule,
        UsersModule,
        AuthModule,
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', '..', 'files'),
          serveRoot: '/files',
        }),
      ],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    prismaService = module.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await prismaService.user.deleteMany({});
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users', () => {
    it('/users (POST) - createUser', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String) as string,
        name: createUserDto.name,
        email: createUserDto.email,
      });
    });

    it('/users (POST) - weak passwork', async () => {
      const createUserDto = {
        name: 'Weak User',
        email: 'weakuser@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(400);
    });

    it('/users (PATCH) - update user', async () => {
      const createUserDto = {
        name: 'Update User',
        email: 'updateuser@example.com',
        password: 'password123',
      };
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const auth = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createUserDto.email,
          password: createUserDto.password,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/users/${auth.body.id}`)
        .set('Authorization', `Bearer ${auth.body.token}`)
        .send({ name: 'Updated User' })
        .expect(200);

      console.log('UPDATE RESPONSE:', res.body);

      const updatedUserResponse = await request(app.getHttpServer())
        .get(`/users/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${auth.body.token}`)
        .expect(200);
      expect(updatedUserResponse.body.name).toBe('Updated User');
    });

    it('/users (DELETE) - delete user', async () => {
      const createUserDto = {
        name: 'Update User',
        email: 'updateuser@example.com',
        password: 'password123',
      };
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const auth = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createUserDto.email,
          password: createUserDto.password,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/users/${auth.body.id}`)
        .set('Authorization', `Bearer ${auth.body.token}`)
        .expect(200);
    });
  });
});
