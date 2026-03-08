import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Observable, interval, map, switchMap, from } from 'rxjs';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public (authenticated) endpoints ────────────────────────────────────────

  @Get()
  list(@Query(new ValidationPipe({ transform: true })) query: ListProductsDto) {
    return this.productsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/payoff')
  getPayoff(@Param('id') id: string) {
    return this.productsService.getPayoff(id);
  }

  @Get(':id/ai-advice')
  getAiAdvice(@Param('id') id: string) {
    return this.productsService.getAiAdvice(id);
  }

  /**
   * Server-Sent Events endpoint that streams live market data for a product.
   * The client connects once and receives periodic updates without polling.
   */
  @Sse(':id/live')
  getLive(@Param('id') id: string): Observable<MessageEvent> {
    // Emit a new snapshot every 5 seconds.
    // In production, replace the interval with a real market-data stream
    // (e.g. from a Redis pub/sub channel or a WebSocket feed).
    return interval(5_000).pipe(
      switchMap(() => from(this.productsService.getLive(id))),
      map(
        (data) =>
          ({
            data: JSON.stringify(data),
          }) as MessageEvent,
      ),
    );
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
