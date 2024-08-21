import type { Stripe } from 'stripe';

export interface Config {
  port: string;
  bcryptSaltOrRound: string | number;
  jwtSecret: string;
  resendApiKey: string;
  clienUrl: string;
  awsS3AccessKey: string;
  awsS3SecretAccessKey: string;
  awsS3BucketName: string;
  awsS3RegionName: string;
  stripeSecretKey: string;
  stripeApiVersion: Stripe.LatestApiVersion;
  stripeWebhookSecret: string;
}
