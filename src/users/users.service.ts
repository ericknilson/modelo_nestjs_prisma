import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,
  ) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        Task: true,
      },
    });

    if (user) return user;

    throw new HttpException('Usuário não encontrado!', HttpStatus.BAD_REQUEST);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const password = await this.hashingService.hash(createUserDto.password);

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: password,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return user;
    } catch {
      throw new HttpException(
        'Falha ao cadastrar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    tokenPayload: PayloadTokenDto,
  ) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      if (!user) {
        throw new HttpException('Usuário não existe!', HttpStatus.BAD_REQUEST);
      }

      if (user.id !== tokenPayload.sub) {
        throw new HttpException('Acesso negado.', HttpStatus.BAD_REQUEST);
      }

      const dataUser: { name?: string; password?: string } = {
        name: updateUserDto.name ? updateUserDto.name : user.name,
      };

      if (updateUserDto?.password) {
        const password = await this.hashingService.hash(
          updateUserDto?.password,
        );
        dataUser['password'] = password;
      }

      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: dataUser.name,
          password: dataUser?.password ? dataUser?.password : user.password,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return updateUser;
    } catch {
      throw new HttpException(
        'Falha ao atualizar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(id: string, tokenPayload: PayloadTokenDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      if (!user) {
        throw new HttpException('Usuário não existe!', HttpStatus.BAD_REQUEST);
      }

      if (user.id !== tokenPayload.sub) {
        throw new HttpException('Acesso negado.', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      return {
        message: 'Usuário foi deletado com sucesso!',
      };
    } catch {
      throw new HttpException(
        'Falha ao deletar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadAvatarImage(
    tokenPayload: PayloadTokenDto,
    file: Express.Multer.File,
  ) {
    try {
      // const mimeType = file.mimetype;
      const fileExtension = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);

      const fileName = `${tokenPayload.sub}.${fileExtension}`;

      const fileLocale = path.resolve(process.cwd(), 'files', fileName);

      await fs.writeFile(fileLocale, file.buffer);

      const user = await this.prisma.user.findFirst({
        where: {
          id: tokenPayload.sub,
        },
      });

      if (!user) {
        throw new HttpException(
          'Falha ao atualizar o avatar do usuário!',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: fileName,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      return updatedUser;
    } catch {
      throw new HttpException(
        'Falha ao atualizar o avatar do usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
