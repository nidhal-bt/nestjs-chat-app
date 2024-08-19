import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll<T extends Prisma.ConversationFindManyArgs>(
    params: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
  ) {
    return this.prisma.conversation.findMany(params);
  }

  async getOne<T extends Prisma.ConversationFindUniqueArgs>(
    conversationWhereUniqueInput: Prisma.SelectSubset<
      T,
      Prisma.ConversationFindUniqueArgs
    >,
  ) {
    return this.prisma.conversation.findUnique<T>(conversationWhereUniqueInput);
  }

  async create<T extends Prisma.ConversationCreateArgs>(
    data: Prisma.SelectSubset<T, Prisma.ConversationCreateArgs>,
  ) {
    return this.prisma.conversation.create({
      data,
    });
  }

  async update<T extends Prisma.ConversationUpdateArgs>(
    params: Prisma.SelectSubset<T, Prisma.ConversationUpdateArgs>,
  ) {
    return this.prisma.conversation.update<T>(params);
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
      data: {
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
      },
    });

    return {
      error: false,
      conversationId: createdConversation.id,
      message: 'La conversation a bien été créée.',
    };
  }
}
