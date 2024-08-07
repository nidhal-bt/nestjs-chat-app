import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(params: Prisma.UserFindManyArgs<DefaultArgs>): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async getOne(userUniqueInput: Prisma.UserFindUniqueArgs<DefaultArgs>) {
    return this.prisma.user.findUnique(userUniqueInput);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(params: Prisma.UserUpdateArgs<DefaultArgs>): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async delete(args: Prisma.UserDeleteArgs<DefaultArgs>): Promise<User> {
    return this.prisma.user.delete(args);
  }
}
