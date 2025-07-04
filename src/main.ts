import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para permitir q o front-end faça requisições para o back
  app.enableCors({
    origin: 'http://localhost:5173', //aqui define em qual port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Se você usa cookies ou cabeçalhos de autorização como JWT
  });

  // Habilita validação globalmente usando class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades que não estão no DTO
    forbidNonWhitelisted: true, // Lança erro se houver propriedades não permitidas
    transform: true, // Transforma payloads em instâncias de DTO
  }));

  await app.listen(process.env.PORT ?? 3000); //
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();