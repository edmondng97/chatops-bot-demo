import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Deterministic gatekeeper listens here; in production this is fronted by an IM WebSocket.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[broker] ChatOps bot demo listening on http://localhost:${port}`);
}
bootstrap();
