import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWTPayload } from 'src/auth/types/auth.type';

export const userFactory = (data: keyof JWTPayload, ctx: ExecutionContext) => {
  let user: JWTPayload;

  if (ctx.getType() === 'http') {
    const request = ctx.switchToHttp().getRequest();
    user = request.user;
  } else if (ctx.getType() === 'ws') {
    const client = ctx.switchToWs().getClient();
    user = client.user;
  }

  return data ? user[data] : user;
};

export const CurrentUser = createParamDecorator(userFactory);
