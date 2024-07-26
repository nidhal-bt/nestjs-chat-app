import { hashSync, compare } from 'bcrypt';

export class BcryptService {
  private readonly saltOrRounds = 10;

  hashPassword({ password }: { password: string }) {
    const hashedPassword = hashSync(password, this.saltOrRounds);
    return hashedPassword;
  }

  isPasswordValid({
    password,
    hashedPassword,
  }: {
    password: string;
    hashedPassword: string;
  }) {
    return compare(password, hashedPassword);
  }
}
