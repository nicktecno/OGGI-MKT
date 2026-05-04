import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres.' })
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['SUPPLIER', 'EXECUTOR', 'CUSTOMER'])
  role!: 'SUPPLIER' | 'EXECUTOR' | 'CUSTOMER';

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  @MinLength(2)
  businessName?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  @MinLength(8)
  cep?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  phone?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  addressLine1?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsOptional()
  @IsString()
  addressComplement?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  city?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'SUPPLIER')
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  stateUf?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  @MinLength(8)
  executorCep?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  executorPhone?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  executorAddressLine1?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsOptional()
  @IsString()
  executorAddressComplement?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  executorCity?: string;

  @ValidateIf((o: RegisterDto) => o.role === 'EXECUTOR')
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  executorStateUf?: string;
}
