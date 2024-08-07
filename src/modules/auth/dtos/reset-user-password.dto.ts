import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4, {
    message: 'Votre mot de passe doit faire plus de 8 charactères',
  })
  password: string;

  @IsString()
  token: string;
}
