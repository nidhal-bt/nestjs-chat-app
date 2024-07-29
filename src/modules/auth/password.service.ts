import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcrypt';
import { Config } from 'src/config';

@Injectable()
export class PasswordService {
  constructor(private configService: ConfigService) {}

  private get bcryptSaltRounds(): string | number {
    const saltOrRounds = this.configService.get<Config['bcryptSaltOrRound']>(
      'BCRYPT_SALT_OR_ROUND',
    );

    return Number.isInteger(Number(saltOrRounds))
      ? Number(saltOrRounds)
      : saltOrRounds;
  }

  validatePassword({
    password,
    hashedPassword,
  }: {
    password: string;
    hashedPassword: string;
  }): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  hashPassword({ password }: { password: string }): Promise<string> {
    return hash(password, this.bcryptSaltRounds);
  }
}
