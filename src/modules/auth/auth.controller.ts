import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TRequestWithUser } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { ResetUserPasswordDto } from './dtos/reset-user-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() authBody: LoginUserDto) {
    return this.authService.signIn({ authBody });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async signUp(@Body() registerBody: CreateUserDto) {
    return this.authService.signUp({ registerBody });
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() { email }: { email: string }) {
    return this.authService.resetUserPassword({ email });
  }

  @HttpCode(HttpStatus.OK)
  @Get('verify-reset-password/:token')
  async verifyResetPasswordToken(@Param('token') token: string) {
    return this.authService.verifyResetPasswordToken({ token });
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password-token')
  async resetPasswordToken(@Body() body: ResetUserPasswordDto) {
    console.log('body', body);
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('currentUser')
  @Serialize(UserDto)
  async getAuthenticatedUser(@Request() request: TRequestWithUser) {
    return this.usersService.getOne({ where: { id: request.user.userId } });
  }
}
