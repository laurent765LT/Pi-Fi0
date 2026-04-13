import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Gzip compression
  app.use(compression());

  // Structured request logging
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      if (req.url !== '/api/v1/health') {
        console.log(JSON.stringify({ method: req.method, url: req.url, status: res.statusCode, ms, timestamp: new Date().toISOString() }));
      }
    });
    next();
  });

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Strick'in API")
    .setDescription('API de la plateforme de distribution de produits structurés')
    .setVersion('2.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://app.strickin.com', 'https://strickin.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`[Strick'in API] Running on http://localhost:${port}`);
}

bootstrap();
