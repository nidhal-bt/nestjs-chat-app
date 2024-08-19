import { Global, Module, type Provider } from '@nestjs/common';
import { MailerService } from './services/mailer/mailer.service';
import { AwsS3Service } from './services/aws-s3/aws-s3.service';

const providers: Provider[] = [MailerService, AwsS3Service];

@Global()
@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
