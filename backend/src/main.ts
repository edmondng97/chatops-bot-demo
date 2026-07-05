import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // The HTTP server here only keeps the process alive; adapters (Slack/Lark) are the actual message entry points.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[broker] ChatOps bot demo listening on http://localhost:${port}`);
}
bootstrap();
