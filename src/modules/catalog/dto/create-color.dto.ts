import { IsHexColor, IsString, MinLength } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsHexColor()
  hexCode!: string;
}
