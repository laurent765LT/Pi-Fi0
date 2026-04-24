import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AIService } from './ai.service';
import { AIUsageService } from './ai-usage.service';
import { AIUnavailableException } from './exceptions/ai-unavailable.exception';
import {
  ChatRequestDto,
  AnalyzePortfolioDto,
  GenerateCommentaryDto,
} from './dto';
import type {
  AIChunk,
  AIResponse,
  ChatMessage,
  PortfolioSummary,
} from './types/ai.types';
import type { ProductInput, ClientProfile } from './prompts';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly ai: AIService,
    private readonly usage: AIUsageService,
  ) {}

  // ── Status ─────────────────────────────────────────────────────────────────

  @Get('status')
  status() {
    return {
      configured: this.ai.isConfigured(),
      provider: 'claude',
    };
  }

  // ── Chat (non-streaming + SSE) ─────────────────────────────────────────────

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const messages: ChatMessage[] = body.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      try {
        const iterable = (await this.ai.chat(user.id, messages, {
          stream: true,
          nocache: body.nocache,
          context: body.context,
        })) as AsyncIterable<AIChunk>;

        for await (const chunk of iterable) {
          if (chunk.type === 'chunk') {
            res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          } else {
            res.write(
              `data: ${JSON.stringify({
                done: true,
                usage: chunk.usage,
                model: chunk.model,
                stopReason: chunk.stopReason,
              })}\n\n`,
            );
          }
        }
      } catch (err) {
        this.logger.error(`/ai/chat stream failed: ${String(err)}`);
        if (!res.headersSent) {
          res.status(HttpStatus.SERVICE_UNAVAILABLE);
        }
        res.write(
          `data: ${JSON.stringify({
            error: 'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
          })}\n\n`,
        );
      } finally {
        res.end();
      }
      return;
    }

    try {
      const response = (await this.ai.chat(user.id, messages, {
        nocache: body.nocache,
        context: body.context,
      })) as AIResponse;
      res.status(HttpStatus.OK).json(response);
    } catch (err) {
      this.respondError(res, err);
    }
  }

  // ── Portfolio analysis ─────────────────────────────────────────────────────

  @Post('analyze-portfolio')
  @HttpCode(HttpStatus.OK)
  async analyzePortfolio(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AnalyzePortfolioDto,
  ) {
    const summary = body as unknown as PortfolioSummary;
    return this.ai.analyzePortfolio(user.id, summary);
  }

  // ── Product commentary ─────────────────────────────────────────────────────

  @Post('generate-commentary')
  @HttpCode(HttpStatus.OK)
  async generateCommentary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateCommentaryDto,
  ) {
    const text = await this.ai.generateCommentary(
      user.id,
      body.product as unknown as ProductInput,
      body.profile as unknown as ClientProfile,
    );
    return { commentary: text };
  }

  private respondError(res: Response, err: unknown): void {
    if (err instanceof AIUnavailableException) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json(err.getResponse());
      return;
    }
    this.logger.error(`/ai error: ${String(err)}`);
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
    });
  }
}

// ─── Admin usage endpoint ────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
@Controller('api/v1/admin')
export class AIAdminController {
  constructor(private readonly usage: AIUsageService) {}

  @Get('ai-usage')
  async getUsage() {
    return this.usage.getStats(7);
  }
}
