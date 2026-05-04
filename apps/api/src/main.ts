import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());
  app.use(cookieParser());

  const rawOrigins = process.env.FRONTEND_URL?.trim();
  const origins =
    rawOrigins && rawOrigins.length > 0
      ? rawOrigins
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : ['http://localhost:3000'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
}

bootstrap();
