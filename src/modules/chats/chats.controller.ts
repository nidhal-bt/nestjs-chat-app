import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendChatDto } from './dtos/send-chat.dto';
import { TRequestWithUser } from '../auth/jwt.strategy';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';

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
    @Request() request: TRequestWithUser,
  ) {
    return this.conversationsService.createConversation({
      createConversation,
      userId: request.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':conversationId')
  async sendChat(
    @Param('conversationId') conversationId: string,
    @Body() sendChatDto: SendChatDto,
    @Request() request: TRequestWithUser,
  ) {
    return this.chatService.sendChat({
      sendChatDto,
      conversationId,
      senderId: request.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getConversations(@Request() request: TRequestWithUser) {
    return this.chatService.getConversations({
      userId: request.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':conversationId')
  async getConversation(
    @Param('conversationId') conversationId: string,
    @Request() request: TRequestWithUser,
  ) {
    return this.chatService.getConversation({
      userId: request.user.userId,
      conversationId,
    });
  }
}
