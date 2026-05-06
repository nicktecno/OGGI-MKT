import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @MinLength(2, { message: 'Nome muito curto.' })
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(10, { message: 'Escreva uma mensagem com pelo menos 10 caracteres.' })
  @MaxLength(5000)
  message!: string;
}
