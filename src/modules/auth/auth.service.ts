import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

import { PasswordService } from './password.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';

import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';
import { ResetUserPasswordDto } from './dtos/reset-user-password.dto';
import { MailerService } from 'src/shared/services/mailer/mailer.service';
import { TAuthUser } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private async autheticateUser({ userId }: TAuthUser) {
    return {
      access_token: await this.jwtService.signAsync({ userId }),
    };
  }

  async signIn({ authBody }: { authBody: LoginUserDto }) {
    const existingUser = await this.userService.getOne({
      where: { email: authBody.email },
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

  async signUp({ registerBody }: { registerBody: CreateUserDto }) {
    const existingUser = await this.userService.getOne({
      where: { email: registerBody.email },
    });

    if (existingUser) {
      throw new NotFoundException(
        'Un compte existe déjà à cette adresse email.',
      );
    }

    const hashedPassword = await this.passwordService.hashPassword({
      password: registerBody.password,
    });

    const createdUser = await this.userService.create({
      email: registerBody.email,
      password: hashedPassword,
      firstName: registerBody.firstName,
    });

    await this.mailerService.sendEmail({
      to: 'bentaaritn@gmail.com',
      subject: 'test mail sender',
      body: '<strong>It works!</strong>',
    });

    const response = await this.autheticateUser({ userId: createdUser.id });

    return response;
  }

  async resetUserPassword({ email }: { email: string }) {
    const existingUser = await this.userService.getOne({
      where: { email },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    if (existingUser.isResettingPassword) {
      throw new NotFoundException(
        'Une demande de réinitialisation de mot de passe est déjà en cours.',
      );
    }

    const createdToken = await this.jwtService.signAsync({
      userId: existingUser.id,
    });

    await this.userService.update({
      data: {
        isResettingPassword: true,
        resetPasswordToken: createdToken,
      },
      where: {
        id: existingUser.id,
      },
    });

    await this.mailerService.sendEmail({
      to: 'bentaaritn@gmail.com',
      subject: 'test mail sender',
      body: `<strong>Update password with new token: ${this.configService.get<Config['clientBaseUrl']>('CLIENT_BASE_URL')}/token=${createdToken} </strong>`,
    });

    return {
      error: false,
      message:
        'Veuiller consulter vos emails pour réinitialiser votre mot de passe.',
    };
  }

  async verifyResetPasswordToken({ token }: { token: string }) {
    if (!token) {
      throw new NotFoundException("Le token n'existe pas.");
    }
    const existingUser = await this.userService.getOne({
      where: { resetPasswordToken: token },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    if (!existingUser.isResettingPassword) {
      throw new NotFoundException(
        "Aucune demande de réinitialisation de mot de passe n'est en cours.",
      );
    }

    return {
      error: false,
      message: 'Le token est valide et peut être utilisé',
    };
  }
  async resetPassword({ token, password }: ResetUserPasswordDto) {
    const existingUser = await this.userService.getOne({
      where: { resetPasswordToken: token },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    if (!existingUser.isResettingPassword) {
      throw new NotFoundException(
        "Aucune demande de réinitialisation de mot de passe n'est en cours.",
      );
    }

    const hashedPassword = await this.passwordService.hashPassword({
      password: password,
    });

    await this.userService.update({
      data: {
        isResettingPassword: false,
        resetPasswordToken: null,
        password: hashedPassword,
      },
      where: {
        id: existingUser.id,
      },
    });

    return {
      error: false,
      message: 'Votre mot de passe a bien été changé.',
    };
  }
}
