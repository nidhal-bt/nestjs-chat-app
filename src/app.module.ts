import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config';
import { SharedModule } from './shared/shared.module';
import { AppGateway } from './app.gateway';
import { ChatsModule } from './modules/chats/chats.module';
import { SocketModule } from './socket/socket.module';
import { DonationsModule } from './modules/donations/donations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    UsersModule,
    AuthModule,
    SharedModule,
    ChatsModule,
    SocketModule,
    DonationsModule,
  ],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
