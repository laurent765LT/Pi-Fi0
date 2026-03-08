import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ShelvesService } from './shelves.service';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/shelves')
@UseGuards(JwtAuthGuard)
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  /**
   * GET /api/v1/shelves
   * Public (authenticated) - list all shelves with product info.
   */
  @Get()
  findAll() {
    return this.shelvesService.findAll();
  }

  /**
   * POST /api/v1/shelves
   * [ADMIN] Create a new shelf.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateShelfDto) {
    return this.shelvesService.create(dto);
  }

  /**
   * GET /api/v1/shelves/:id
   * Authenticated - shelf detail with fill percentage.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shelvesService.findOne(id);
  }

  /**
   * GET /api/v1/shelves/:id/commitments
   * [ADMIN / ORG_ADMIN] - list all commitments for a shelf.
   */
  @Get(':id/commitments')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  findCommitments(@Param('id') id: string) {
    return this.shelvesService.findCommitments(id);
  }
}
