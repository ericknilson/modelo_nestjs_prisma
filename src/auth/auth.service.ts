import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ResponseAuthDto } from './dto/response-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(signInDto: SignInDto): Promise<ResponseAuthDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: signInDto.email,
        active: true,
      },
    });

    if (!user) {
      throw new HttpException(
        'Falha ao autenticar usuário',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordIsValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!passwordIsValid) {
      throw new HttpException(
        'Senha/Usuário incorretos',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.jwtTtl,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      },
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? undefined,
      token: token,
    };
  }
}
