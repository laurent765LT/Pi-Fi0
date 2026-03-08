import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommitmentsService } from './commitments.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; orgId: string; role: string };
}

@Controller('api/v1/commitments')
@UseGuards(JwtAuthGuard)
export class CommitmentsController {
  constructor(private readonly commitmentsService: CommitmentsService) {}

  /**
   * POST /api/v1/commitments
   * Create a new commitment on a shelf – authenticated.
   */
  @Post()
  create(
    @Body() dto: CreateCommitmentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.create(dto, req.user);
  }

  /**
   * GET /api/v1/commitments
   * Return the authenticated user's own commitments.
   */
  @Get()
  findMine(@Request() req: RequestWithUser) {
    return this.commitmentsService.findMyCommitments(req.user);
  }

  /**
   * PATCH /api/v1/commitments/:id
   * Update the amount of an existing commitment – owner only.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommitmentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.updateAmount(id, dto, req.user);
  }

  /**
   * DELETE /api/v1/commitments/:id
   * Cancel a commitment – owner only.
   */
  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.cancel(id, req.user);
  }
}
