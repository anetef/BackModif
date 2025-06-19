import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { join } from 'path'; // Para manipular caminhos de arquivo
import { unlinkSync, existsSync } from 'fs'; // Para deletar o arquivo db.sqlite

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const dbPath = join(__dirname, '..', 'db.sqlite'); // Caminho para o seu db.sqlite

  // Executa uma vez antes de TODOS os testes desta suíte
  beforeAll(() => {
    // Garante que o arquivo do banco de dados esteja limpo antes de iniciar a suíte de testes
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  // Executa antes de CADA teste
  beforeEach(async () => {
    // Se o banco de dados já existir de um teste anterior que falhou em limpar, tenta limpá-lo.
    // Isso é uma segurança extra, mas o afterEach deve ser o principal responsável.
    if (existsSync(dbPath)) {
      try {
        unlinkSync(dbPath);
      } catch (err) {
        // Ignora o erro se o arquivo já estiver bloqueado por alguma razão externa
        // ou se uma corrida aconteceu onde outro beforeEach já o deletou.
        // O erro EBUSY ainda pode aparecer aqui se o app anterior não fechou a tempo.
        console.warn(`Could not unlink ${dbPath} in beforeEach:`, err.message);
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init(); // Isso irá conectar ao DB e sincronizar o esquema (criando db.sqlite se não existir)
  });

  // Executa depois de CADA teste
  afterEach(async () => {
    // Primeiro, fecha a aplicação e a conexão com o banco de dados
    await app.close();
    // Em seguida, exclui o arquivo do banco de dados para garantir um estado limpo para o próximo teste
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  // Executa uma vez depois de TODOS os testes desta suíte
  afterAll(async () => {
    // Limpeza final para garantir que nenhum arquivo db.sqlite residual fique após a execução de todos os testes
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  it('/ (GET) - Hello World!', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/user (POST) - should register a new user', () => {
    const newUser = {
      nome: 'Test User',
      email: 'test@example.com',
      senha: 'password123',
    };
    return request(app.getHttpServer())
      .post('/user')
      .send(newUser)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.nome).toBe(newUser.nome);
        expect(res.body.email).toBe(newUser.email);
        expect(res.body).not.toHaveProperty('senha');
      });
  });

  it('/user/login (POST) - should log in an existing user', async () => {
    const newUser = {
      nome: 'Login User',
      email: 'login@example.com',
      senha: 'securepassword',
    };

    // Primeiro, cadastre o usuário
    await request(app.getHttpServer())
      .post('/user')
      .send(newUser)
      .expect(201);

    // Tente logar com as credenciais cadastradas
    const loginCredentials = {
      email: newUser.email,
      senha: newUser.senha,
    };

    return request(app.getHttpServer())
      .post('/user/login')
      .send(loginCredentials)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('Login bem-sucedido!');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.nome).toBe(newUser.nome);
        expect(res.body.user.email).toBe(newUser.email);
        expect(res.body.user).not.toHaveProperty('senha');
      });
  });

  it('/user/login (POST) - should return Unauthorized for invalid credentials', async () => {
    const loginCredentials = {
      email: 'nonexistent@example.com',
      senha: 'wrongpassword',
    };

    return request(app.getHttpServer())
      .post('/user/login')
      .send(loginCredentials)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('E-mail ou senha inválidos.');
        expect(res.body.statusCode).toBe(401);
      });
  });
});