import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';

export type TUserPayload = { userId: string };
export type TRequestWithUser = { user: TUserPayload };
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<Config['jwtSecret']>('JWT_SECRET'),
    });
  }

  async validate({ userId }: TUserPayload) {
    return { userId };
  }
}
