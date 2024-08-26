import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './services/chats.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { ConversationsService } from './services/conversations.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, PrismaService, ConversationsService],
  imports: [UsersModule, SharedModule],
})
export class ChatsModule {}
