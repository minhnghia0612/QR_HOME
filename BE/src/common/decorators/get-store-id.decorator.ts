import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the store ID from the 'x-store-id' request header.
 * Use this in conjunction with JwtAuthGuard to get the current store the admin is operating on.
 */
export const GetStoreId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const storeId = request.headers['x-store-id'];
    return typeof storeId === 'string' && storeId.trim() ? storeId.trim() : undefined;
  },
);
