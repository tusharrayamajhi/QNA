import { Module } from '@nestjs/common';
import { AppController } from './app.controllers';
import { AppService } from './app.services';
import { ConfigModule } from '@nestjs/config';
import { AiServices } from './aiServices';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService,AiServices],
})
export class AppModule {}
