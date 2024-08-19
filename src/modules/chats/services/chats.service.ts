import { Injectable, NotFoundException } from '@nestjs/common';
import { SendChatDto } from '../dtos/send-chat.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma, ChatMessage, Conversation } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { ConversationsService } from './conversations.service';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { SocketService } from 'src/socket/socket.service';
import { AwsS3Service } from 'src/shared/services/aws-s3/aws-s3.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly socketService: SocketService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getAll<T extends Prisma.ChatMessageFindManyArgs>(
    params: Prisma.SelectSubset<T, Prisma.ChatMessageFindManyArgs>,
  ) {
    return this.prisma.chatMessage.findMany<T>(params);
  }

  async getOne<T extends Prisma.ChatMessageFindUniqueArgs>(
    params: Prisma.SelectSubset<T, Prisma.ChatMessageFindUniqueArgs>,
  ) {
    return this.prisma.chatMessage.findUnique<T>(params);
  }

  async create(data: Prisma.ChatMessageCreateInput): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data,
    });
  }

  async update(
    params: Prisma.ChatMessageUpdateArgs<DefaultArgs>,
  ): Promise<ChatMessage> {
    return this.prisma.chatMessage.update(params);
  }

  async delete(
    args: Prisma.ChatMessageDeleteArgs<DefaultArgs>,
  ): Promise<ChatMessage> {
    return this.prisma.chatMessage.delete(args);
  }

  async sendChat({
    sendChatDto,
    conversationId,
    senderId,
  }: {
    sendChatDto: SendChatDto;
    conversationId: string;
    senderId: string;
  }) {
    const [existingConversation, existingUser] = await Promise.all([
      this.conversationsService.getOne({
        where: { id: conversationId },
      }),
      this.usersService.getOne({
        where: { id: senderId },
      }),
    ]);
    if (!existingConversation) {
      throw new NotFoundException("La conversation n'existe pas.");
    }
    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    const updatedConversation = await this.conversationsService.update({
      where: {
        id: existingConversation.id,
      },
      data: {
        messages: {
          create: {
            content: sendChatDto.content,
            sender: {
              connect: {
                id: existingUser.id,
              },
            },
          },
        },
      },
      select: {
        messages: {
          select: {
            content: true,
            id: true,
            sender: {
              select: {
                id: true,
                firstName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    this.socketService.server
      .to(conversationId)
      .emit('send-chat-update', updatedConversation);

    return {
      error: false,
      message: 'Votre message a bien été envoyé.',
      data: updatedConversation,
    };
  }

  async getConversations({ userId }: { userId: string }) {
    const existingUser = await this.usersService.getOne({
      where: { id: userId },
      select: {
        conversations: {
          select: {
            id: true,
            updatedAt: true,
            users: {
              select: {
                id: true,
                firstName: true,
                avatarFileKye: true,
              },
            },
            messages: {
              select: {
                content: true,
                id: true,
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    avatarFileKye: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    const conversations = existingUser.conversations;
    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];

      for (let j = 0; j < conversation.users.length; j++) {
        if (!conversation.users[j].avatarFileKye) {
          continue;
        }
        const avatarUrl = await this.awsS3Service.getFileSignedUrl({
          fileKey: conversation.users[j].avatarFileKye,
        });
        conversation.users[j] = {
          ...conversation.users[j],
          avatarFileKye: avatarUrl,
        };
      }
    }

    return conversations;
  }
  async getConversation({
    userId,
    conversationId,
  }: {
    userId: string;
    conversationId: string;
  }) {
    const existingUser = await this.usersService.getOne({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    const conversation = await this.conversationsService.getOne({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        updatedAt: true,
        users: {
          select: {
            firstName: true,
            id: true,
            avatarFileKye: true,
          },
        },
        messages: {
          select: {
            content: true,
            id: true,
            sender: {
              select: {
                id: true,
                firstName: true,
                avatarFileKye: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Cette conversation n'existe pas.");
    }

    for (let j = 0; j < conversation.messages.length; j++) {
      if (!conversation.messages[j].sender.avatarFileKye) {
        continue;
      }
      const avatarUrl = await this.awsS3Service.getFileSignedUrl({
        fileKey: conversation.messages[j].sender.avatarFileKye,
      });
      conversation.messages[j].sender = {
        ...conversation.messages[j].sender,
        avatarFileKye: avatarUrl,
      };
    }

    for (let j = 0; j < conversation.users.length; j++) {
      if (!conversation.users[j].avatarFileKye) {
        continue;
      }
      const avatarUrl = await this.awsS3Service.getFileSignedUrl({
        fileKey: conversation.users[j].avatarFileKye,
      });
      conversation.users[j] = {
        ...conversation.users[j],
        avatarFileKye: avatarUrl,
      };
    }

    return conversation;
  }
}
