import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt'; // importação da biblioteca para o hash das senhas

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'senha'>> { 
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10); // aqui acontece o hash da senha
    const newUser = this.userRepository.create({
      ...createUserDto,
      senha: hashedPassword,
    });
    
    console.log(`[UserService] Usuário criado com sucesso: ${newUser.email}`);
    // console.log(`[UserService] Senha hasheada salva: ${hashedPassword}`); 
    
    const savedUser = await this.userRepository.save(newUser); // Salva o usuário primeiro
    const { senha, ...userWithoutSenha } = savedUser; // Desestrutura para remover a senha
    return userWithoutSenha; // Retorna o objeto sem a senha
  }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[UserService] Tentativa de validação para email: ${email}`);
    // console.log(`[UserService] Senha recebida para validação: ${pass}`); 

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      console.log(`[UserService] Validação falhou: Usuário não encontrado para o email: ${email}`);
      return null;
    }

    console.log(`[UserService] Usuário encontrado. ID: ${user.id}, Email: ${user.email}`);
    // console.log(`[UserService] Senha do DB (hasheada): ${user.senha}`); 

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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'senha'>> { // <-- ATENÇÃO AQUI: Mudança no tipo de retorno para Omit<User, 'senha'>
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado para atualização.');

    if (updateUserDto.senha) {
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, 10);
    }

    this.userRepository.merge(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    
    const { senha, ...result } = updatedUser;
    return result; 
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException();
    await this.userRepository.remove(user);
  }
}