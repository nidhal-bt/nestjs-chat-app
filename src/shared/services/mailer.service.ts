import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Config } from 'src/config';

export class MailerService {
  constructor(private readonly mailer: Resend) {
    this.mailer = new Resend('re_Sa9GjzmG_2E6VcbrpkPMGXmJeqpP5sF5E');
    // 're_Sa9GjzmG_2E6VcbrpkPMGXmJeqpP5sF5E',
    // configService.get<Config['resendApiKey']>('RESEND_API_KEY'),
  }

  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string | string[];
    subject: string;
    body: string;
  }) {
    try {
      const data = await this.mailer.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to,
        subject,
        html: body,
        // '<strong>It works!</strong>'
      });

      console.log({ data });
    } catch (error) {
      console.log('error', error);
    }
  }
}
