import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatMessageDto } from './dto/chat-message.dto';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string; role: string; orgId: string };
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChatMessageDto,
  ) {
    return this.chatService.processMessage(dto.message, req.user.sub);
  }
}
