import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorators/public.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';
import { CurrentUser } from 'src/decorators/user.decorator';

@Controller('users')
@UseGuards(RoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() findAllUsersDto: FindAllUsersDto) {
    return this.usersService.findAll(findAllUsersDto);
  }

  @Get('/current')
  findCurrentUser(@CurrentUser('id') userId: string) {
    return this.usersService.findOneByIdWithBalance(userId);
  }

  @Get('/:userId')
  findOneById(@Param('userId', ParseUUIDPipe) id: string) {
    return this.usersService.findOneByIdWithBalance(id);
  }

  @Put('/:userId')
  update(
    @Param('userId', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('/role')
  @Roles(Role.Admin)
  changeRole(@Body() changeRoleDto: ChangeRoleDto) {
    return this.usersService.changeRole(changeRoleDto);
  }

  @Delete('/:userId')
  delete(@Param('userId', ParseUUIDPipe) id: string) {
    this.usersService.delete(id);
  }
}
