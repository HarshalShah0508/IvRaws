import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { Prisma } from '../../generated/prisma/client.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly fallback = new HttpExceptionFilter();

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      return this.fallback.catch(
        new ConflictException(`Duplicate value for ${(exception.meta?.target as string[])?.join(', ') ?? 'field'}`),
        host,
      );
    }
    if (exception.code === 'P2025') {
      return this.fallback.catch(new NotFoundException('Resource not found'), host);
    }
    return this.fallback.catch(exception, host);
  }
}
