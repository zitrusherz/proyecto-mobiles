import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SqliteService } from './sqlite.service';
import * as bcrypt from 'bcryptjs';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<string | null>(null); 
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private dbinit = SqliteService;
  private isWeb: boolean = false;

  constructor(private sqliteService: SqliteService) {
    this.initializePlatform();
  }

  // Inicialización de la plataforma para determinar si es web o móvil
  private async initializePlatform() {
    const info = await Device.getInfo();
    this.isWeb = info.platform === 'web';
    await this.sqliteService.init();
  }

  // Método para iniciar sesión
  async login(email: string, password: string): Promise<boolean> {
    const isValid = await this.validateUser(email, password);
    if (isValid) {
      this.isAuthenticatedSubject.next(email); // Cambia esto para guardar el email autenticado
    }
    return isValid;
  }

  // Validación de usuario, con distinción entre plataformas
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
        const storedPassword = result.values[0][0];
        
        // Si es web, no usa bcrypt
        if (this.isWeb) {
          return storedPassword === password;
        } else {
          // Para plataformas móviles, usa bcrypt para comparar
          return await bcrypt.compare(password, storedPassword);
        }
      }
      return false;
    } catch (error) {
      console.error('Error validating user', error);
      return false;
    }
  }

  // Registro de usuario con lógica condicional para encriptación
  async registerUser(
    primerNombre: string,
    segundoNombre: string,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    codeRecovery: string,
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

      let hashedPassword: string;

      // En la web, no se aplica bcrypt
      if (this.isWeb) {
        hashedPassword = password;
      } else {
        // Para plataformas móviles, encripta la contraseña con bcrypt
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Guarda el usuario con la contraseña (encriptada o no, dependiendo de la plataforma)
      await this.sqliteService.addUser(
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        email,
        hashedPassword,  // Asegúrate de pasar la contraseña encriptada o no
        codeRecovery,
        email.endsWith('@profesor.duoc.cl') ? 'profesor' : 'alumno'
      );
  
      return 'Usuario registrado exitosamente';
    } catch (error) {
      console.error('Error registering user', error);
      return 'Error al registrar usuario';
    }
  }
  
  // Método para verificar si el usuario ya existe
  async checkUserExists(email: string): Promise<boolean> {
    return this.sqliteService.userExists(email);
  }
}
