import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  validatePasswordComplexity(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('A jelszónak legalább 8 karakter hosszúnak kell lennie');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('A jelszónak tartalmaznia kell legalább egy nagybetűt');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('A jelszónak tartalmaznia kell legalább egy kisbetűt');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('A jelszónak tartalmaznia kell legalább egy számot');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A jelszónak tartalmaznia kell legalább egy speciális karaktert (!@#$%^&*(),.?":{}|<>)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  determineRoleFromEmail(email: string): 'student' | 'teacher' | 'admin' {
    if (email === 'admin@uni-pannon.hu') {
      return 'admin';
    }

    if (email.endsWith('@student.uni-pannon.hu')) {
      return 'student';
    }

    if (email.endsWith('@teacher.uni-pannon.hu')) {
      return 'teacher';
    }

    throw new BadRequestException(
      'Csak @student.uni-pannon.hu vagy @teacher.uni-pannon.hu email címmel lehet regisztrálni'
    );
  }

  validateEmailDomain(email: string): { isValid: boolean; error?: string } {
    if (email === 'admin@uni-pannon.hu') {
      return { isValid: true };
    }

    const validDomains = ['@student.uni-pannon.hu', '@teacher.uni-pannon.hu'];
    const isValid = validDomains.some(domain => email.endsWith(domain));

    if (!isValid) {
      return {
        isValid: false,
        error: 'Csak @student.uni-pannon.hu vagy @teacher.uni-pannon.hu email címmel lehet regisztrálni'
      };
    }

    return { isValid: true };
  }
}