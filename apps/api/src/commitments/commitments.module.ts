import { Module } from '@nestjs/common';
import { CommitmentsService } from './commitments.service';
import { CommitmentsController } from './commitments.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}
