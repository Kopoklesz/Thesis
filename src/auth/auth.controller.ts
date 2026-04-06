import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { DemoGuard } from './guards/demo.guard';
import { Roles } from './decorators/roles.decorator';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  LoginResponseDto,
  UserResponseDto,
} from '../dto/auth.dto';
import { UserRole } from '../entity/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<UserResponseDto> {
    const userId = req.user?.sub || req.user?.user_id || req.user?.userId || req.user?.id;

    console.log('🔍 GET PROFILE - req.user:', req.user);
    console.log('🔍 Extracted user ID:', userId);

    if (!userId) {
      throw new HttpException('User ID not found in JWT token', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.findUserById(userId);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard, DemoGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user?.sub || req.user?.user_id || req.user?.userId || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in JWT token', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return { message: 'Sikeresen kijelentkeztél' };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.authService.getAllUsers();
  }

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getTeachers(): Promise<UserResponseDto[]> {
    return this.authService.getTeachers();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id', ParseIntPipe) userId: number): Promise<{ message: string }> {
    return this.authService.deleteUser(userId);
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body('role') newRole: UserRole,
  ): Promise<UserResponseDto> {
    return this.authService.updateUserRole(userId, newRole);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getUserById(@Param('id', ParseIntPipe) userId: number): Promise<UserResponseDto> {
    return this.authService.findUserById(userId);
  }

  @Put('users/:id/demo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleDemoMode(
    @Param('id', ParseIntPipe) userId: number,
    @Body('is_demo') isDemo: boolean,
  ): Promise<UserResponseDto> {
    return this.authService.toggleDemoMode(userId, isDemo);
  }
}