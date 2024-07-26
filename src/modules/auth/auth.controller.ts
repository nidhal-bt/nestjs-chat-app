import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TRequestWithUser } from './jwt.strategy';
import { UsersService } from '../users/users.service';

export type TAuthBody = { email: string; password: string };
export type TSignUpBody = {
  firstName: string;
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() authBody: TAuthBody) {
    return this.authService.signIn({ authBody });
  }

  @UseGuards(JwtAuthGuard)
  @Get('currentUser')
  async authenticateUser(@Request() request: TRequestWithUser) {
    console.log('request', request.user.userId);

    return this.usersService.getUser({ id: request.user.userId });
  }
}
