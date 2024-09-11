
import { Injectable } from '@angular/core';
import { User } from 'src/app/interface/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: User[] = [];

  constructor() {}

  addUser(user: User) {
    this.users.push(user);
  }

  getUsers(): User[] {
    return this.users;
  }

  isEmailRegistered(email: string): boolean {
    return this.users.some((user) => user.email === email);
  }

  getUserByRecoveryCode(recoveryCode: string): User | undefined {
    return this.users.find(user => user.codigoRecuperacion === recoveryCode);
  }
  getUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  updatePassword(user: User, newPassword: string): void {
    const foundUser = this.users.find(u => u.email === user.email);
    if (foundUser) {
      foundUser.password = newPassword;
    }
  }

}