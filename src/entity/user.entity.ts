import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { UserBalance } from './user-balance.entity';
import { Cart } from './cart.entity';
import { Purchase } from './purchase.entity';
import { Webshop } from './webshop.entity';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

@Entity()
@Index(['email'])
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true, comment: 'Felhasználónév - bármi lehet' })
  username: string;

  @Column({ unique: true, comment: 'Email cím - szerepkör meghatározásához' })
  email: string;

  @Column({ comment: 'Bcrypt hash-elt jelszó' })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
    comment: 'Felhasználói szerepkör - email domain alapján automatikusan beállítva'
  })
  role: UserRole;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Regisztráció időpontja'
  })
  created_at: Date;

  @OneToMany(() => UserBalance, userBalance => userBalance.user)
  balances: UserBalance[];

  @OneToMany(() => Cart, cart => cart.user)
  carts: Cart[];

  @OneToMany(() => Purchase, purchase => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => Webshop, webshop => webshop.teacher)
  webshops: Webshop[];

  static determineRoleFromEmail(email: string): UserRole {
    if (email.endsWith('@student.uni-pannon.hu')) {
      return UserRole.STUDENT;
    } else if (email.endsWith('@teacher.uni-pannon.hu')) {
      return UserRole.TEACHER;
    } else if (email === 'admin@uni-pannon.hu') {
      return UserRole.ADMIN;
    }
    return UserRole.STUDENT;
  }
}