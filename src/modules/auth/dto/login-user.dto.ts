import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail(
    {},
    {
      message: 'Vous devez fournir une adresse email valide',
    },
  )
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4, {
    message: 'Votre mot de passe doit faire plus de 8 charactères',
  })
  password: string;
}
