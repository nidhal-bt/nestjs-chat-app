import {
  Controller,
  Get,
  Param,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { TAuthUser } from '../auth/jwt.strategy';
import {
  type Request as RequestType,
  type Response as ResponseType,
} from 'express';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async createConnectedAccount(@AuthUser() user: TAuthUser) {
    return this.donationsService.createConnectedAccount({
      userId: user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('donate/:receivingUserId')
  async createDonation(
    @Param('receivingUserId') receivingUserId: string,
    @AuthUser() { userId }: TAuthUser,
  ) {
    return this.donationsService.createDonation({
      receiverAccountId: receivingUserId,
      givingUserId: userId,
    });
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<RequestType>,
    @Res() res: ResponseType,
  ) {
    return this.donationsService.handleWebhook(req, res);
  }
}
