import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(
    new WsAdapter(app, {
      messageParser: (data) => {
        try {
          return JSON.parse(data.toString());
        } catch (e) {
          return data; // Return as is if parsing fails
        }
      },
    }),
  );
  await app.listen(process.env.NEST_PORT ?? 3479);
}
bootstrap();
