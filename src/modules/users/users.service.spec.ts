import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/shared/services/aws-s3/aws-s3.service';
import { ConfigModule } from '@nestjs/config';
import { IFile } from 'src/common/interfaces';
import { User } from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('UsersService', () => {
  let userService: UsersService;
  let prismaService: PrismaService;
  let awsS3Service: AwsS3Service;

  let users: Array<User> = [
    {
      id: '1',
      firstName: 'John Doe',
      email: 'test@yopmail.com',
      avatarFileKye: '',
      isResettingPassword: false,
      password: 'password',
      resetPasswordToken: '',
      stripeAccountId: '',
      stripeProductId: '',
    },
  ];
  beforeEach(async () => {
    // Mock prisma service
    const prismaServiceMock = {
      user: {
        findMany: jest.fn().mockResolvedValue(users),
        findUnique: jest
          .fn()
          .mockImplementation(({ where }) =>
            users.find((user) => user.email === where.email),
          ),
        create: jest.fn().mockImplementation(async ({ data }) => {
          const newUser = { ...data, id: (users.length + 1).toString() };
          const existingUser = await prismaServiceMock.user.findUnique({
            where: { email: data.email },
          });

          if (existingUser) {
            throw new ConflictException();
          }

          users.push(newUser);
          return Promise.resolve(newUser);
        }),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const existingUser = await prismaServiceMock.user.findUnique({
            where: { email: where.email },
          });

          if (!existingUser) {
            throw new NotFoundException();
          }

          const updatedUser = {
            ...existingUser,
            ...data,
          };

          users = users.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          );

          const newUser = users.find((user) => user.id === updatedUser.id);

          return Promise.resolve(newUser);
        }),
        delete: jest.fn().mockImplementation(async ({ where }) => {
          const existingUser = await prismaServiceMock.user.findUnique({
            where: { email: where.email },
          });

          if (!existingUser) {
            throw new NotFoundException();
          }

          users = users.filter((user) => user.email === where.email);
          return Promise.resolve(existingUser);
        }),
      },
    };

    // Mock aws s3 service for isolate the test from aws s3 interactions
    const awsS3ServiceMock = {
      uploadSingleFile: async ({
        file,
        isPublic,
      }: {
        file: IFile;
        isPublic?: boolean;
      }) => {
        return Promise.resolve({ fileKey: 'new_file_key' });
      },
      getFileSignedUrl: async ({ fileKey }: { fileKey: string }) => {
        return Promise.resolve(fileKey);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: AwsS3Service, useValue: awsS3ServiceMock },
      ],
      imports: [ConfigModule],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    awsS3Service = module.get<AwsS3Service>(AwsS3Service);
  });

  it('Can create an instance of users service', () => {
    expect(userService).toBeDefined();
  });
  describe('find all', () => {
    it('Should return an array of users', async () => {
      expect(await userService.getAll({})).toBe(users);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const newUser = {
        email: 'test2@yopmail.com',
        password: 'test',
      };
      const result = await userService.create(newUser);

      expect(result).toBeDefined();
      expect(result.email).toBe(newUser.email);
    });

    it('it should not create user', async () => {
      const newUser = {
        email: 'test5@yopmail.com',
        password: 'test',
      };
      await userService.create(newUser);

      await expect(userService.create(newUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('get one', () => {
    it('should return specific user with current email', async () => {
      const result = await userService.getOne({
        where: { email: 'test2@yopmail.com' },
      });
      expect(result).toBeDefined();
      expect(result.email).toBe('test2@yopmail.com');
    });

    it('should not return specific user with current email', async () => {
      const result = await userService.getOne({
        where: { email: 'test88@yopmail.com' },
      });
      expect(result).toEqual(undefined);
    });
  });

  describe('update', () => {
    it('should update specific user with email', async () => {
      const result = await userService.update({
        where: { email: users[0].email },
        data: {
          firstName: 'Ahmed test',
        },
      });
      expect(result).toBeDefined();
      console.log('result', result);
      expect(result.firstName).toEqual('Ahmed test');
    });

    it('should not update specific user with email', async () => {
      const result = userService.update({
        where: { email: 'test08@yopmail.com' },
        data: {
          firstName: 'Ahmed test',
        },
      });

      await expect(result).rejects.toThrow(NotFoundException);
    });
  });
  describe('delete', () => {
    it('should delete user with current email', async () => {
      const result = await userService.delete({
        where: { email: users[0].email },
      });
      expect(result).toEqual(users[0]);
    });

    it('should not return specific user with current email', async () => {
      await expect(
        userService.delete({
          where: { email: 'test88@yopmail.com' },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
