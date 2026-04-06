import { IsNotEmpty, IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Az email cím megadása kötelező' })
  @IsEmail({}, { message: 'Érvényes email címet adj meg' })
  @Matches(
    /@(student|teacher)\.uni-pannon\.hu$|^admin@uni-pannon\.hu$/,
    { message: 'Csak @student.uni-pannon.hu vagy @teacher.uni-pannon.hu email címmel lehet regisztrálni' }
  )
  email: string;

  @IsNotEmpty({ message: 'A jelszó megadása kötelező' })
  @IsString()
  @MinLength(8, { message: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' })
  password: string;
}

export class LoginDto {
  @IsNotEmpty({ message: 'A felhasználónév vagy email megadása kötelező' })
  @IsString()
  identifier: string;

  @IsNotEmpty({ message: 'A jelszó megadása kötelező' })
  @IsString()
  password: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  role?: 'student' | 'teacher' | 'admin';
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'A jelenlegi jelszó megadása kötelező' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'Az új jelszó megadása kötelező' })
  @IsString()
  newPassword: string;
}

export class UserResponseDto {
  user_id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  is_demo: boolean;
  created_at: Date;
}

export interface JwtPayload {
  sub: number; 
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export class LoginResponseDto {
  access_token: string;
  user: UserResponseDto;
}