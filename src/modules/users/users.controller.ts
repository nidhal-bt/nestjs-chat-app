import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('')
  getUsers() {
    return this.usersService.getUsers({});
  }
  @Get('/:userId')
  getUser(@Param('userId') userId: string) {
    console.log('userId', userId);
    return this.usersService.getUser({ id: userId });
  }
}
