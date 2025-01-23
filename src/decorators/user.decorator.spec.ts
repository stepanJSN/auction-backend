import { ExecutionContext } from '@nestjs/common';
import { userFactory } from './user.decorator';
import { MOCK_EMAIL, MOCK_USER_ID } from 'config/mock-test-data';
import { JWTPayload } from 'src/auth/types/auth.type';
import { Role } from '@prisma/client';

describe('CurrentUser Decorator', () => {
  const user: JWTPayload = {
    id: MOCK_USER_ID,
    role: Role.User,
    email: MOCK_EMAIL,
  };
  const mockHttpContext = {
    getType: jest.fn().mockReturnValue('http'),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user,
      }),
    }),
  } as unknown as ExecutionContext;

  const mockWsContext = {
    getType: jest.fn().mockReturnValue('ws'),
    switchToWs: jest.fn().mockReturnValue({
      getClient: jest.fn().mockReturnValue({
        user,
      }),
    }),
  } as unknown as ExecutionContext;

  it('should return the full user object in HTTP context when no key is provided', () => {
    const result = userFactory(null, mockHttpContext);
    expect(result).toEqual(user);
  });

  it('should return the full user object in WebSocket context when no key is provided', () => {
    const result = userFactory(null, mockWsContext);
    expect(result).toEqual(user);
  });

  it('should return a specific user property in HTTP context when a key is provided', () => {
    const result = userFactory('email', mockHttpContext);
    expect(result).toBe(user.email);
  });

  it('should return a specific user property in WebSocket context when a key is provided', () => {
    const result = userFactory('email', mockWsContext);
    expect(result).toBe(user.email);
  });
});
