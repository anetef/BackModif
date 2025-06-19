import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
  // define os dados esperados do login pela rota POST/user/login
export class LoginUserDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  senha: string;
}