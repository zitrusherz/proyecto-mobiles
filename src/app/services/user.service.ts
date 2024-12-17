import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {User} from '../interface/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor() {}

  setUser(user: User): void {
    this.userSubject.next(user);
  }

  getUser() {
    return this.userSubject.asObservable();
  }

  clearUser(): void {
    this.userSubject.next(null);
  }

  createUser(
    primerNombre: string,
    segundoNombre: string | null,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    password: string,
    role: string,
    recoveryCode: string
  ): User {
    const user = {
      primerNombre,
      segundoNombre: segundoNombre || '',
      primerApellido,
      segundoApellido,
      password,
      email,
      role,
      recoveryCode,
    };

    console.log('Usuario creado en UserService:', user);
    return user;
  }

  getRole(){
    return this.userSubject.value?.role
  }

  getFullName(){
    return this.userSubject.value?.primerNombre || ''+ this.userSubject.value?.segundoNombre || ''+
     this.userSubject.value?.primerApellido || ''+ this.userSubject.value?.segundoApellido
  }

  getEmail(){
    return this.userSubject.value?.email
  }
}
