import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Never throws: an invalid/missing token simply means req.user stays undefined
  // so guest requests fall through instead of being rejected.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
