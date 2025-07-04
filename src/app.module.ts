import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'sqlite',  //define que tipo de banco de dados 
    database: 'db.sqlite',
    entities: [User],
    synchronize: true,
  }),
  UserModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
