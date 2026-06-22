import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3001;
  const apiPrefix = configService.get<string>('apiPrefix') ?? 'api';
  const corsOrigin = configService.get<string>('cors.origin');

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ZGames API')
    .setDescription('Gaming ecommerce platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(`ZGames API running on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
