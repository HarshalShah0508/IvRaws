import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy, type StrategyOptionsWithRequest } from 'passport-jwt';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface RefreshRequestUser {
  userId: string;
  refreshToken: string;
}

const extractFromBody = (req: Request): string | null => req.body?.refreshToken ?? null;

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractFromBody,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') as string,
      passReqToCallback: true,
    } satisfies StrategyOptionsWithRequest);
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshRequestUser {
    return { userId: payload.sub, refreshToken: extractFromBody(req) as string };
  }
}
