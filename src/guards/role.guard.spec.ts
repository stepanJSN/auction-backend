import { RoleGuard } from './role.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('RoleGuard', () => {
  let roleGuard: RoleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    roleGuard = new RoleGuard(reflector);
  });

  const mockExecutionContext = (userRole: Role | null) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: userRole },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  it('should allow access if no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockExecutionContext(null);
    const result = await roleGuard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access if user has a required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    const context = mockExecutionContext(Role.Admin);
    const result = await roleGuard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user does not have a required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    const context = mockExecutionContext(Role.User);
    const result = await roleGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access if user role is null and roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    const context = mockExecutionContext(null);
    const result = await roleGuard.canActivate(context);

    expect(result).toBe(false);
  });
});
