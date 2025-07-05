import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  });

  // Configure WebSocket adapter for raw WebSocket connections
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(process.env.NEST_PORT ?? 3479);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
