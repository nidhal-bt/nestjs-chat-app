import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from '../users/users.module';
import { ConversationsService } from './conversations.service';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, PrismaService, ConversationsService],
  imports: [UsersModule],
})
export class ChatsModule {}
