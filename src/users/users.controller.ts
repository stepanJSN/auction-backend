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
import { FindAllUsers } from './dto/find-all-users.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorators/public.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.Admin)
  @UseGuards(RoleGuard)
  @Get()
  findAll(@Query() findAllUsers: FindAllUsers) {
    return this.usersService.findAll(findAllUsers.page, findAllUsers.take);
  }

  @Get('/:userId')
  findOneById(@Param('userId', ParseUUIDPipe) id: string) {
    return this.usersService.findOneById(id);
  }

  @Put('/:userId')
  update(
    @Param('userId', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.Admin)
  @UseGuards(RoleGuard)
  @Patch('/role')
  changeRole(@Body() changeRoleDto: ChangeRoleDto) {
    return this.usersService.changeRole(changeRoleDto);
  }

  @Delete('/:userId')
  delete(@Param('userId', ParseUUIDPipe) id: string) {
    this.usersService.delete(id);
  }
}
