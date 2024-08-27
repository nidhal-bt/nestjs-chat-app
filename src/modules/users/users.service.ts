import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import {
  DefaultArgs,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import { IFile } from 'src/common/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
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

    if (!!user?.avatarFileKye) {
      const avatarUrl = await this.awsS3Service.getFileSignedUrl({
        fileKey: user.avatarFileKye,
      });
      user.avatarFileKye = avatarUrl;
    }

    return user;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data,
      });
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Un compte existe déjà à cette adresse email.',
          );
        }
      }
      throw error;
    }
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
