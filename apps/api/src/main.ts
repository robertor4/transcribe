import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for all requests
  });

  // The rawBody option above stores raw body in req.rawBody automatically
  // This is needed for Stripe webhook signature verification

  // In production, use FRONTEND_URL; in development, use NEXT_PUBLIC_APP_URL
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  console.log(`CORS enabled for origin: ${corsOrigin}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API server running on http://localhost:${port}`);
}
bootstrap();
