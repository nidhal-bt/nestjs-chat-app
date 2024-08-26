import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<Config['jwtSecret']>('JWT_SECRET'),
          expiresIn: configService.get<Config['jwtExpire']>('JWT_EXPIRE'),
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, PasswordService],
})
export class AuthModule {}
