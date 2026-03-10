import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { RacingExceptionFilter } from './common/filters/racing-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global Filter and Interceptor
  app.useGlobalFilters(new RacingExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Versioning
  app.setGlobalPrefix('v1');

  // Security
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Racing Backend is running on: http://localhost:${port}`);
}
bootstrap();
