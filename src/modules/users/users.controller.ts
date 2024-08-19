import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { UserDto } from '../auth/dtos/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { IFile } from 'src/common/interfaces';

@Controller('users')
@Serialize(UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('')
  getUsers() {
    return this.usersService.getAll({});
  }
  @Get('/:userId')
  getUser(@Param('userId') userId: string) {
    return this.usersService.getOne({ where: { id: userId } });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:userId')
  @UseInterceptors(FileInterceptor('file'))
  updateUser(
    @Param('userId') userId: string,
    // @AuthUser() user: User,
    @Body() updateUserData: Partial<UserDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000_000_000_000 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
        fileIsRequired: false,
      }),
    )
    file: IFile,
  ) {
    return this.usersService.update({
      where: { id: userId },
      data: updateUserData,
      file: file,
    });
  }
}
