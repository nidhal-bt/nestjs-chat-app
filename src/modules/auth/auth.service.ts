import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TAuthBody, TSignUpBody } from './auth.controller';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TUserPayload } from './jwt.strategy';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
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

    const isPasswordSame = await this.passwordService.validatePassword({
      hashedPassword: existingUser.password,
      password: authBody.password,
    });

    if (!isPasswordSame) {
      throw new UnauthorizedException('Le mot de passe est invalide.');
    }

    const response = await this.autheticateUser({ userId: existingUser.id });

    return response;
  }

  async signUp({ registerBody }: { registerBody: TSignUpBody }) {
    const existingUser = await this.userService.getUser({
      email: registerBody.email,
    });

    if (existingUser) {
      throw new NotFoundException(
        'Un compte existe déjà à cette adresse email.',
      );
    }

    const hashedPassword = await this.passwordService.hashPassword({
      password: registerBody.password,
    });

    const createdUser = await this.userService.createUser({
      email: registerBody.email,
      password: hashedPassword,
      firstName: registerBody.firstName,
    });

    const response = await this.autheticateUser({ userId: createdUser.id });

    return response;
  }
}
