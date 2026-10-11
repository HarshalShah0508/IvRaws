import { IsString, MinLength } from 'class-validator';

export class CreateReturnRequestDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}
