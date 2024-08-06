import { Global, Module, type Provider } from '@nestjs/common';
import { MailerService } from './services/mailer.service';

const providers: Provider[] = [MailerService];

@Global()
@Module({
  providers,

  exports: providers,
})
export class SharedModule {}
