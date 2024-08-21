import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { StripeService } from 'src/shared/services/stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import {
  type Request as RequestType,
  type Response as ResponseType,
} from 'express';
import Stripe from 'stripe';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly stripeService: StripeService,
  ) {}

  async create({ data }: { data: Prisma.DonationCreateInput }) {
    return this.prisma.donation.create({
      data,
    });
  }

  async update<T extends Prisma.DonationUpdateArgs>(
    params: Prisma.SelectSubset<T, Prisma.DonationUpdateArgs>,
  ) {
    return this.prisma.donation.update<T>(params);
  }

  async createConnectedAccount({ userId }: { userId: string }) {
    const existingUser = await this.usersService.getOne({
      where: {
        id: userId,
      },
      select: {
        stripeAccountId: true,
        email: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    let stripeAccountId = '';

    if (existingUser.stripeAccountId) {
      stripeAccountId = existingUser.stripeAccountId;
    } else {
      const stripeAccount = await this.stripeService.createAccount({
        email: existingUser.email,
      });

      await this.usersService.update({
        where: {
          id: userId,
        },
        data: {
          stripeAccountId: stripeAccount.id,
        },
      });
      stripeAccountId = stripeAccount.id;
    }

    const accountLink = await this.stripeService.createAccountLink({
      accountId: stripeAccountId,
    });

    return { url: accountLink.url };
  }

  async getStripeAccount({ accountId }: { accountId: string }) {
    const stripeAccount = await this.stripeService.getStripeAccount({
      accountId,
    });
    const canReceiveMoney = stripeAccount.charges_enabled;
    return {
      stripeAccount,
      canReceiveMoney,
    };
  }

  async createDonation({
    receiverAccountId,
    givingUserId,
  }: {
    receiverAccountId: string;
    givingUserId: string;
  }) {
    if (receiverAccountId === givingUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous faire de dons à vous-même',
      );
    }

    const [receivingUser, givingUser] = await Promise.all([
      await this.usersService.getOne({
        where: {
          id: receiverAccountId,
        },
        select: {
          id: true,
          firstName: true,
          stripeProductId: true,
          stripeAccountId: true,
        },
      }),
      await this.usersService.getOne({
        where: {
          id: givingUserId,
        },
        select: {
          id: true,
          stripeAccountId: true,
        },
      }),
    ]);

    if (!receivingUser.stripeAccountId) {
      throw new BadRequestException(
        "L'utilisateur recevant le don n'a pas de compte Stripe",
      );
    }

    if (!givingUser.stripeAccountId) {
      throw new BadRequestException(
        "L'utilisateur envoyant le don n'a pas de compte Stripe",
      );
    }

    const stripeAccount = await this.stripeService.getStripeAccount({
      accountId: receiverAccountId,
    });

    let stripeProductId = receivingUser.stripeProductId;

    if (!stripeProductId) {
      const product = await this.stripeService.createProduct({
        productName: `Soutenez ${receivingUser.firstName}`,
      });

      await this.usersService.update({
        where: {
          id: receivingUser.id,
        },
        data: {
          stripeProductId: product.id,
        },
      });

      stripeProductId = product.id;
    }

    const price = await this.stripeService.createPrice({
      productId: stripeProductId,
    });

    const createdDonation = await this.create({
      data: {
        stripePriceId: price.id,
        stripeProductId: stripeProductId,
        receivingUser: {
          connect: {
            id: givingUser.id,
          },
        },
        givingUser: {
          connect: {
            id: receivingUser.id,
          },
        },
      },
    });

    const session = await this.stripeService.createCheckoutSession({
      priceId: stripeProductId,
      createdDonationId: createdDonation.id,
      stripeAccountId: stripeAccount.id,
    });

    return {
      sessionUrl: session.url,
      error: false,
      message: 'La session a bien été créée.',
    };
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const amount = paymentIntent.amount;
    const donationId = paymentIntent.metadata.donationId;
    await this.update({
      where: {
        id: donationId,
      },
      data: {
        amount,
      },
    });
  }

  async handleWebhook(req: RawBodyRequest<RequestType>, res: ResponseType) {
    return this.stripeService.handleWebhook(
      req,
      res,
      this.handlePaymentIntentSucceeded,
    );
  }
}
