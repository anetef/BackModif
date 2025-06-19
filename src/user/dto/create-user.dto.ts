import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
  //define os dados esperados na hora de fazer o cadastro do usuario pela rota POST/user
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
