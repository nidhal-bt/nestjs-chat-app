import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TAuthBody, TSignUpBody } from './auth.controller';
import { BcryptService } from 'src/utils/hashString';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TUserPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
  ) {}

  private async autheticateUser({ userId }: TUserPayload) {
    return {
      access_token: await this.jwtService.signAsync({ userId }),
    };
  }

  async signIn({ authBody }: { authBody: TAuthBody }) {
    const existingUser = await this.userService.getUser({
      email: authBody.email,
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    const isPasswordSame = await this.bcryptService.isPasswordValid({
      hashedPassword: existingUser.password,
      password: authBody.password,
    });

    if (!isPasswordSame) {
      throw new UnauthorizedException('Le mot de passe est invalide.');
    }

    const response = await this.autheticateUser({ userId: existingUser.id });

    return response;
  }
}
