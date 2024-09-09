import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SqliteService } from './sqlite.service';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private dbinit = SqliteService;
  
  constructor(private sqliteService: SqliteService) {
    this.sqliteService.init()
  }

  async login(email: string, password: string): Promise<boolean> {
    const isValid = await this.validateUser(email, password);
    this.isAuthenticatedSubject.next(isValid);
    return isValid;
  }

  private async validateUser(email: string, password: string): Promise<boolean> {
    if (!this.sqliteService.dbReady.getValue()) {
      throw new Error('Database not ready');
    }
  
    const db = this.sqliteService.getDbConnection();
    if (!db) {
      throw new Error('Database connection is not available');
    }
  
    const query = `SELECT password FROM users WHERE email = ?`;
    try {
      const result = await db.query(query, [email]);
  
      if (result.values && result.values.length > 0) {
        const hashedPassword = result.values[0][0];
        return await bcrypt.compare(password, hashedPassword);
      }
      return false;
    } catch (error) {
      console.error('Error validating user', error);
      return false;
    }
  }
  

  async registerUser(
    primerNombre: string,
    segundoNombre: string,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    password: string
  ): Promise<string> {
    if (!this.sqliteService.dbReady.getValue()) {
      throw new Error('Database not ready');
    }
  
    try {
      const userExists = await this.sqliteService.userExists(email);
      if (userExists) {
        return 'El usuario ya ha sido registrado.';
      }
  
      await this.sqliteService.addUser(
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        email,
        password,
        email.endsWith('@profesor.duoc.cl') ? 'profesor' : 'alumno'
      );
  
      return 'Usuario registrado exitosamente';
    } catch (error) {
      console.error('Error registering user', error);
      return 'Error al registrar usuario';
    }
  }
  
  async checkUserExists(email: string): Promise<boolean> {
    return this.sqliteService.userExists(email);
  }
  

}
