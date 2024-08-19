import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFile } from 'src/common/interfaces';
import { Config } from 'src/config';
import { createId } from '@paralleldrive/cuid2';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsS3Service {
  private client: S3Client;
  private bucketName: string;
  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      credentials: {
        accessKeyId:
          configService.get<Config['awsS3AccessKey']>('AWS_S3_ACCESS_KEY'),
        secretAccessKey: configService.get<Config['awsS3SecretAccessKey']>(
          'AWS_S3_SECRET_ACCESS_KEY',
        ),
      },
      region:
        configService.get<Config['awsS3RegionName']>('AWS_S3_REGION_NAME'),
    });
    this.bucketName =
      configService.get<Config['awsS3BucketName']>('AWS_S3_BUCKET_NAME');
  }

  // async getFileUrl(key: string) {
  //   return { url: `https://${this.bucketName}.s3.amazonaws.com/${key}` };
  // }

  async uploadSingleFile({
    file,
    isPublic = true,
  }: {
    file: IFile;
    isPublic?: boolean;
  }) {
    const fileKey = createId() + file.fieldname;
    const command = new PutObjectCommand({
      Bucket:
        this.configService.get<Config['awsS3RegionName']>('AWS_S3_REGION_NAME'),
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      const uploadResult = await this.client.send(command);

      if (uploadResult.$metadata.httpStatusCode !== 200) {
        console.error('error');
      }

      return { fileKey };
    } catch (error) {
      const { requestId, cfId, extendedRequestId } = error.$metadata;
      console.log({ requestId, cfId, extendedRequestId });
      throw new InternalServerErrorException(error);
    }
  }

  async deleteFile({ fileKey }: { fileKey: string }) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.client.send(command);

      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getFileSignedUrl({ fileKey }: { fileKey: string }) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });
      const result = await getSignedUrl(this.client, command);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
