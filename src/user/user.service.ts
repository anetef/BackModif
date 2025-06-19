import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common'; // Adicione UnauthorizedException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      senha: hashedPassword,
    });
    
    console.log(`[UserService] Usuário criado com sucesso: ${newUser.email}`);
    // console.log(`[UserService] Senha hasheada salva: ${hashedPassword}`); // CUIDADO: Não logue senhas em produção!
    return this.userRepository.save(newUser);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[UserService] Tentativa de validação para email: ${email}`);
    // console.log(`[UserService] Senha recebida para validação: ${pass}`); // CUIDADO: Não logue senhas em produção!

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      console.log(`[UserService] Validação falhou: Usuário não encontrado para o email: ${email}`);
      return null;
    }

    console.log(`[UserService] Usuário encontrado. ID: ${user.id}, Email: ${user.email}`);
    // console.log(`[UserService] Senha do DB (hasheada): ${user.senha}`); // CUIDADO: Não logue senhas em produção!

    const isPasswordValid = await bcrypt.compare(pass, user.senha); // Linha CRÍTICA de comparação

    console.log(`[UserService] Resultado da comparação bcrypt: ${isPasswordValid}`);

    if (isPasswordValid) {
      console.log(`[UserService] Validação bem-sucedida para o e-mail: ${email}`);
      const { senha, ...result } = user;
      return result;
    } else {
      console.log(`[UserService] Validação falhou: Senha inválida para o e-mail: ${email}`);
      return null;
    }
  }

  // Seus outros métodos (findAll, findOne, update, remove) permanecem como no exemplo anterior,
  // com as devidas atualizações para não retornar senhas e hashear no update.

  async findAll(): Promise<Omit<User, 'senha'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ senha, ...userWithoutSenha }) => userWithoutSenha);
  }

  async findOne(id: number): Promise<Omit<User, 'senha'>> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException();
  
    const { senha, ...userWithoutSenha } = user;
    return userWithoutSenha;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado para atualização.');

    if (updateUserDto.senha) {
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, 10);
    }

    this.userRepository.merge(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    
    const { senha, ...result } = updatedUser;
    return result as User;
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException();
    await this.userRepository.remove(user);
  }
}