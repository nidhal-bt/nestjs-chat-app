import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(
    params: Prisma.ConversationFindManyArgs<DefaultArgs>,
  ): Promise<Conversation[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.conversation.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async getOne(
    conversationWhereUniqueInput: Prisma.ConversationFindUniqueArgs<DefaultArgs>,
  ) {
    return this.prisma.conversation.findUnique(conversationWhereUniqueInput);
  }

  async create(data: Prisma.ConversationCreateInput) {
    return this.prisma.conversation.create({
      data,
    });
  }

  async update(params: Prisma.ConversationUpdateArgs) {
    return this.prisma.conversation.update(params);
  }

  async delete(
    args: Prisma.ConversationDeleteArgs<DefaultArgs>,
  ): Promise<Conversation> {
    return this.prisma.conversation.delete(args);
  }

  async createConversation({
    createConversation,
    userId,
  }: {
    createConversation: CreateConversationDto;
    userId: string;
  }) {
    const [existingRecipient, existingUser] = await Promise.all([
      this.prisma.user.findUnique({
        where: {
          id: createConversation.recipientId,
        },
      }),
      this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      }),
    ]);
    if (!existingRecipient) {
      throw new NotFoundException("L'utilisateur sélectionné n'existe pas.");
    }

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }
    const createdConversation = await this.create({
      users: {
        connect: [
          {
            id: existingUser.id,
          },
          {
            id: existingRecipient.id,
          },
        ],
      },
    });

    return {
      error: false,
      conversationId: createdConversation.id,
      message: 'La conversation a bien été créée.',
    };
  }
}
