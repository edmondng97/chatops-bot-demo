import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Deterministic gatekeeper listens here; in production this is fronted by an IM WebSocket.
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('[broker] ChatOps bot demo listening on http://localhost:3000');
}
bootstrap();
