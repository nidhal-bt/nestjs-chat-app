import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './services/chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendChatDto } from './dtos/send-chat.dto';

import { ConversationsService } from './services/conversations.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { User } from '@prisma/client';
import { TAuthUser } from '../auth/jwt.strategy';

@Controller('chat')
export class ChatsController {
  constructor(
    private readonly chatService: ChatsService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConversation(
    @Body() createConversation: CreateConversationDto,
    @AuthUser() { userId }: TAuthUser,
  ) {
    return this.conversationsService.createConversation({
      createConversation,
      userId: userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':conversationId')
  async sendChat(
    @Param('conversationId') conversationId: string,
    @Body() sendChatDto: SendChatDto,
    @AuthUser() { userId }: TAuthUser,
  ) {
    return this.chatService.sendChat({
      sendChatDto,
      conversationId,
      senderId: userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getConversations(@AuthUser() user: TAuthUser) {
    return this.chatService.getConversations({
      userId: user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':conversationId')
  async getConversation(
    @Param('conversationId') conversationId: string,
    @AuthUser() { userId }: TAuthUser,
  ) {
    return this.chatService.getConversation({
      userId: userId,
      conversationId,
    });
  }
}
