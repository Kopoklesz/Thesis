import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entity/user.entity';
import { UserBalance } from '../entity/user-balance.entity';
import { Webshop } from '../entity/webshop.entity';
import { CreateUserDto, UserResponseDto } from '../dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserBalance)
    private userBalanceRepository: Repository<UserBalance>,
    @InjectRepository(Webshop)
    private webshopRepository: Repository<Webshop>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password, role } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException('A felhasználó már létezik');
    }

    const newUser = this.userRepository.create({
      username,
      email,
      password,
      role: role as UserRole || UserRole.STUDENT,
    });

    const savedUser = await this.userRepository.save(newUser);
    return this.transformToResponseDto(savedUser);
  }

  async getUser(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.transformToResponseDto(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      order: { username: 'ASC' },
    });

    return users.map(user => this.transformToResponseDto(user));
  }

  async getUserBalance(userId: number, webshopId: number): Promise<number> {
    const balance = await this.userBalanceRepository.findOne({
      where: {
        user: { user_id: userId },
        webshop: { webshop_id: webshopId },
      },
    });

    return balance ? Number(balance.amount) : 0;
  }

  async updateUserBalance(userId: number, webshopId: number, amount: number): Promise<UserBalance> {
    let balance = await this.userBalanceRepository.findOne({
      where: {
        user: { user_id: userId },
        webshop: { webshop_id: webshopId },
      },
    });

    if (balance) {
      balance.amount = amount;
    } else {
      balance = this.userBalanceRepository.create({
        user: { user_id: userId } as User,
        webshop: { webshop_id: webshopId } as any,
        amount: amount,
      });
    }

    return await this.userBalanceRepository.save(balance);
  }

  async updateBalance(
    teacherId: number,
    teacherRole: UserRole,
    studentId: number,
    webshopId: number,
    amount: number
  ): Promise<{ message: string; newBalance: number }> {
    const webshop = await this.webshopRepository.findOne({
      where: { webshop_id: webshopId }
    });

    if (!webshop) {
      throw new NotFoundException('Webshop nem található');
    }

    if (teacherRole !== UserRole.ADMIN) {
      if (webshop.teacher_id !== teacherId) {
        throw new ForbiddenException('Csak a saját webshopodhoz tartozó egyenlegeket módosíthatod');
      }
    }

    const student = await this.userRepository.findOne({
      where: { user_id: studentId }
    });

    if (!student) {
      throw new NotFoundException('Hallgató nem található');
    }

    const updatedBalance = await this.updateUserBalance(studentId, webshopId, amount);

    return {
      message: 'Egyenleg sikeresen módosítva',
      newBalance: Number(updatedBalance.amount)
    };
  }

  async adjustUserBalance(userId: number, webshopId: number, amountChange: number): Promise<UserBalance> {
    const currentBalance = await this.getUserBalance(userId, webshopId);
    const newBalance = currentBalance + amountChange;

    if (newBalance < 0) {
      throw new BadRequestException('Az egyenleg nem lehet negatív');
    }

    return this.updateUserBalance(userId, webshopId, newBalance);
  }

  async getUserBalances(userId: number): Promise<UserBalance[]> {
    return await this.userBalanceRepository.find({
      where: { user: { user_id: userId } },
      relations: ['webshop'],
      order: { webshop: { subject_name: 'ASC' } },
    });
  }

  async getUsersByRole(role: 'student' | 'teacher' | 'admin'): Promise<UserResponseDto[]> {
    const userRole = role === 'student' ? UserRole.STUDENT : 
                     role === 'teacher' ? UserRole.TEACHER : UserRole.ADMIN;
    
    const users = await this.userRepository.find({
      where: { role: userRole },
      order: { username: 'ASC' },
    });

    return users.map(user => this.transformToResponseDto(user));
  }

  async findUserByIdentifier(identifier: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: [
        { username: identifier },
        { email: identifier }
      ]
    });

    return user ? this.transformToResponseDto(user) : null;
  }

  async getBalancesByWebshop(webshopId: number): Promise<{ username: string; email: string; amount: number }[]> {
    const balances = await this.userBalanceRepository.find({
      where: { webshop: { webshop_id: webshopId } },
      relations: ['user'],
      order: { amount: 'DESC' },
    });

    return balances.map(balance => ({
      username: balance.user.username,
      email: balance.user.email,
      amount: Number(balance.amount),
    }));
  }

  private transformToResponseDto(user: User): UserResponseDto {
    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role as 'student' | 'teacher' | 'admin',
      is_demo: user.is_demo,
      created_at: user.created_at,
    };
  }
}