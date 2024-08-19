import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { IFile } from 'src/common/interfaces';
import { PrismaService } from 'src/prisma.service';
import { AwsS3Service } from 'src/shared/services/aws-s3/aws-s3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getAll<T extends Prisma.UserFindManyArgs>(
    params: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
  ) {
    const users = await this.prisma.user.findMany<T>(params);

    for (let i = 0; i < users.length; i++) {
      if (!!users[i].avatarFileKye) {
        const avatarUrl = await this.awsS3Service.getFileSignedUrl({
          fileKey: users[i].avatarFileKye,
        });
        users[i].avatarFileKye = avatarUrl;
      }
    }

    return users;
  }

  async getOne<T extends Prisma.UserFindUniqueArgs>(
    userUniqueInput: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
  ) {
    const user = await this.prisma.user.findUnique<T>(userUniqueInput);

    if (!!user.avatarFileKye) {
      const avatarUrl = await this.awsS3Service.getFileSignedUrl({
        fileKey: user.avatarFileKye,
      });
      user.avatarFileKye = avatarUrl;
    }

    return user;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update({
    file,
    where,
    data,
    ...params
  }: Prisma.UserUpdateArgs<DefaultArgs> & { file?: IFile }): Promise<User> {
    let fileUrl = '';
    const existingUser = await this.getOne({
      where,
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur n'existe pas.");
    }

    if (file) {
      const { fileKey } = await this.awsS3Service.uploadSingleFile({ file });
      fileUrl = fileKey;
    }

    const user = await this.prisma.user.update({
      where,
      data: {
        ...data,
        avatarFileKye: fileUrl,
      },
      ...params,
    });

    if (existingUser.avatarFileKye) {
      await this.awsS3Service.deleteFile({
        fileKey: existingUser.avatarFileKye,
      });
    }

    return user;
  }

  async delete(args: Prisma.UserDeleteArgs<DefaultArgs>): Promise<User> {
    return this.prisma.user.delete(args);
  }
}
