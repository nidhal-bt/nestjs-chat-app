import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  PORT: string = '3002';

  @IsString()
  JWT_SECRET: string;

  @IsString()
  BCRYPT_SALT_OR_ROUND: string;

  @IsString()
  RESEND_API_KEY: string;

  @IsString()
  CLIENT_BASE_URL: string;

  @IsString()
  AWS_S3_ACCESS_KEY: string;

  @IsString()
  AWS_S3_SECRET_ACCESS_KEY: string;

  @IsString()
  AWS_S3_BUCKET_NAME: string;

  @IsString()
  AWS_S3_REGION_NAME: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
