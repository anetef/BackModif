import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common'; // Adicione UsePipes, ValidationPipe
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; 

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()

  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login') // Rota de login

  @HttpCode(HttpStatus.OK)
  
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginUserDto: LoginUserDto) { 
    console.log('[UserController] Recebido pedido de login para email:', loginUserDto.email);
    const user = await this.userService.validateUser(loginUserDto.email, loginUserDto.senha);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return {
      message: 'Login bem-sucedido!',
      user: user,
    };
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}