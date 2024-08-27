import type { Stripe } from 'stripe';

export interface Config {
  port: string;
  clientBaseUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpire: string;
  bcryptSaltOrRound: string | number;
  resendApiKey: string;
  awsS3AccessKey: string;
  awsS3SecretAccessKey: string;
  awsS3BucketName: string;
  awsS3RegionName: string;
  stripeSecretKey: string;
  stripeApiVersion: Stripe.LatestApiVersion;
  stripeWebhookSecret: string;
}
