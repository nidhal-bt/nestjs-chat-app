import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from '../users/users.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DonationsController],
  providers: [DonationsService, PrismaService],
  imports: [SharedModule, UsersModule],
})
export class DonationsModule {}
