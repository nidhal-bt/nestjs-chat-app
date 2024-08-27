import { Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';
import Stripe from 'stripe';
import {
  type Request as RequestType,
  type Response as ResponseType,
} from 'express';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      configService.get<Config['stripeSecretKey']>('STRIPE_SECRET_KEY'),
      {
        apiVersion:
          configService.get<Config['stripeApiVersion']>('AWS_S3_ACCESS_KEY'),
      },
    );
  }

  async createAccount({ email }: { email: string }) {
    return this.stripe.accounts.create({
      type: 'express',
      email,
      default_currency: 'EUR',
    });
  }

  async createAccountLink({ accountId }: { accountId: string }) {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        this.configService.get<Config['clientBaseUrl']>('CLIENT_BASE_URL'),
      return_url:
        this.configService.get<Config['clientBaseUrl']>('CLIENT_BASE_URL'),
      type: 'account_onboarding',
    });
  }

  async getStripeAccount({ accountId }: { accountId: string }) {
    return this.stripe.accounts.retrieve(accountId);
  }

  async createCheckoutSession({
    priceId,
    createdDonationId,
    stripeAccountId,
  }: {
    priceId: string;
    createdDonationId: string;
    stripeAccountId: string;
  }) {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: 0,
        metadata: {
          donationId: createdDonationId,
        },
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      success_url:
        this.configService.get<Config['clientBaseUrl']>('CLIENT_BASE_URL'),
      cancel_url:
        this.configService.get<Config['clientBaseUrl']>('CLIENT_BASE_URL'),
    });
  }

  async createProduct({ productName }: { productName: string }) {
    return this.stripe.products.create({
      name: productName,
    });
  }

  async createPrice({ productId }: { productId: string }) {
    return this.stripe.prices.create({
      currency: 'EUR',
      custom_unit_amount: {
        enabled: true,
      },
      product: productId,
    });
  }

  async handleWebhook(
    req: RawBodyRequest<RequestType>,
    res: ResponseType,
    handlePaymentIntentSucceeded?: (
      paymentIntent: Stripe.PaymentIntent,
    ) => void,
  ) {
    const sig = req.headers['stripe-signature'];
    const webHookSecret = this.configService.get<Config['stripeWebhookSecret']>(
      'STRIPE_WEBHOOK_SECRET',
    );
    const event = this.stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webHookSecret,
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        if (handlePaymentIntentSucceeded) {
          handlePaymentIntentSucceeded(paymentIntent);
        }
        break;

      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200);
    res.json({ received: true });

    return event;
  }
}
