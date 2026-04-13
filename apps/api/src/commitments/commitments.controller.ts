import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { CommitmentsService } from './commitments.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { ListCommitmentsDto } from './dto/list-commitments.dto';
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
   * Return the authenticated user's own commitments with optional pagination.
   */
  @Get()
  findMine(
    @Query(new ValidationPipe({ transform: true })) query: ListCommitmentsDto,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.findMyCommitments(req.user, query);
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

  // ── Approval Workflow ──────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/commitments/:id/review
   * Move a PENDING commitment to REVIEW – ORG_ADMIN only.
   */
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.reviewCommitment(id, req.user);
  }

  /**
   * PATCH /api/v1/commitments/:id/approve
   * Move a REVIEW commitment to CONFIRMED – ORG_ADMIN only.
   */
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.approveCommitment(id, req.user);
  }

  /**
   * PATCH /api/v1/commitments/:id/reject
   * Cancel a commitment with a reason – ORG_ADMIN only.
   */
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: RequestWithUser,
  ) {
    return this.commitmentsService.rejectCommitment(id, req.user, body.reason);
  }
}
