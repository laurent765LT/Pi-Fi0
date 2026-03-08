import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadOriasDto } from './dto/upload-orias.dto';
import { UploadRcpDto } from './dto/upload-rcp.dto';
import { VerifyOriasDto } from './dto/verify-orias.dto';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string; role: string; orgId: string };
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('upload-orias')
  @HttpCode(HttpStatus.OK)
  async uploadOrias(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UploadOriasDto,
  ) {
    return this.onboardingService.uploadOrias(req.user.sub, dto.oriasNumber);
  }

  @Post('upload-rcp')
  @HttpCode(HttpStatus.OK)
  async uploadRcp(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UploadRcpDto,
  ) {
    return this.onboardingService.uploadRcp(
      req.user.sub,
      dto.rcpInsurer,
      dto.rcpAmount,
    );
  }

  @Post('verify-orias')
  @HttpCode(HttpStatus.OK)
  async verifyOrias(@Body() dto: VerifyOriasDto) {
    return this.onboardingService.verifyOrias(dto.oriasNumber);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Request() req: AuthenticatedRequest) {
    return this.onboardingService.completeOnboarding(req.user.sub);
  }
}
