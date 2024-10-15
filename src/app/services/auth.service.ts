import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SqliteService } from './sqlite.service';
import { Device } from '@capacitor/device';
import { CustomEmailValidators } from '../validators/email-validator';
import { CustomPasswordValidators } from '../validators/password-validator';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { User } from '../interface/user';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private isWeb: boolean = false;

  constructor(
    private readonly userService: UserService,
    private readonly sqliteService: SqliteService,
    private readonly router: Router,
    private navCtrl: NavController
  ) {
    this.initializePlatform();
    console.log('AuthService initialized');
  }

  setAuthenticated(state: boolean): void {
    console.log('setAuthenticated');
    this.isAuthenticatedSubject.next(state);
    console.log('User authenticated:', state);
  }

  async initializePlatform() {
    console.log('initializePlatform');
    const info = await Device.getInfo();
    console.log('Device info:', info);
    this.isWeb = info.platform === 'web';
    await this.sqliteService.init();
    console.log('SQLite initialized in initializePlatform');
  }

  async login(email: string, password: string): Promise<boolean> {
    console.log('login');
    console.log('Attempting to log in with email:', email);

    try {
      const isValid = await this.validateUser(email, password);
      if (isValid) {
        console.log('User successfully validated');

        const user = await SqliteService.getUserDetailsByEmail(email);

        if (user) {
          console.log('User found after successful validation');

          this.userService.setUser(user);

          await this.storeUserSession(user);

          await this.setAuthenticatedState(true);

          this.setAuthenticated(true);

          console.log('User authenticated');
          return true;
        } else {
          console.error('User not found after validation.');
          return false;
        }
      } else {
        console.log('Password is invalid or user was not found.');
        this.setAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  async setAuthenticatedState(isAuthenticated: boolean) {
    console.log('setAuthenticatedState');
    await Preferences.set({
      key: 'isAuthenticated',
      value: JSON.stringify(isAuthenticated),
    });
  }

  async getUser(email: string): Promise<void> {
    console.log('getUser');
    try {
      await SqliteService.ensureDbReady();
      console.log('Fetching user with email:', email);

      const db = await SqliteService.getDbConnection();
      if (!db) {
        console.error('Could not obtain database connection');
        return;
      }

      console.log('Database connection established in getUser');

      const query = `SELECT primerNombre, segundoNombre, primerApellido, segundoApellido, email, password, role, recoveryCode FROM users WHERE email = ?`;
      const result = await db.query(query, [email]);

      console.log('Query result:', result);
      console.log('Query result values:', result.values);

      if (result.values && result.values.length > 0) {
        const userRow = result.values[0];
        console.log('User row content:', userRow);

        if (Array.isArray(userRow)) {
          const user = this.userService.createUser(
            userRow[0], // primerNombre
            userRow[1], // segundoNombre
            userRow[2], // primerApellido
            userRow[3], // segundoApellido
            userRow[4], // email
            userRow[5], // password
            userRow[6], // role
            userRow[7] // recoveryCode
          );

          console.log('User created (array):', user);

          this.userService.setUser(user);

          await this.storeUserSession(user);
        } else if (typeof userRow === 'object') {
          const user = this.userService.createUser(
            userRow.primerNombre,
            userRow.segundoNombre,
            userRow.primerApellido,
            userRow.segundoApellido,
            userRow.email,
            userRow.password,
            userRow.role,
            userRow.recoveryCode
          );

          console.log('User created (object):', user);

          this.userService.setUser(user);

          await this.storeUserSession(user);
        } else {
          console.error(
            'User row format is neither array nor object:',
            userRow
          );
        }
      } else {
        console.warn('User not found in the database');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  async checkUserExists(email: string): Promise<boolean> {
    console.log('checkUserExists');
    try {
      await SqliteService.ensureDbReady();
      const userExists = await this.sqliteService.userExists(email);
      return userExists;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw new Error('Could not verify user existence. Please try again.');
    }
  }

  async getRecoveryCodeByEmail(email: string): Promise<string | null> {
    console.log('getRecoveryCodeByEmail');
    try {
      await SqliteService.ensureDbReady();
      const recoveryCode = await this.sqliteService.getRecoveryCodeByEmail(
        email
      );
      return recoveryCode ? recoveryCode : null;
    } catch (error) {
      console.error('Error getting recovery code:', error);
      throw new Error('Error retrieving recovery code. Please try later.');
    }
  }

  logout(): void {
    console.log('logout');
    this.setAuthenticated(false);
    this.userService.clearUser();
    this.clearUserData();
    this.clearAuthenticatedState();
    SqliteService.closeDbConnection().catch((error) => {
      console.error('Error closing database:', error);
    });
    this.redirectToLogin();
  }

  async clearAuthenticatedState(): Promise<void> {
    console.log('clearAuthenticatedState');
    await Preferences.remove({ key: 'isAuthenticated' });
  }

  private clearUserData(): void {
    console.log('clearUserData');
    Preferences.remove({ key: 'user' });
    Preferences.remove({ key: 'authToken' });
  }

  private redirectToLogin(): void {
    console.log('redirectToLogin');
    this.router.navigate(['/login']);
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    console.log('updatePassword');
    try {
      await SqliteService.ensureDbReady();
      const user = await SqliteService.getUserDetailsByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      await this.sqliteService.updateUser(
        user.id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        newPassword
      );
      console.log('Password successfully updated');
    } catch (error) {
      console.error('Error updating password', error);
      throw new Error('Could not update password. Please try later.');
    }
  }

  private async validateUser(
    email: string,
    password: string
  ): Promise<boolean> {
    console.log('validateUser');
    this.checkAllUsers();
    try {
      await SqliteService.ensureDbReady();
      const db = await SqliteService.getDbConnection();
      if (!db) {
        console.error('Could not obtain database connection');
        return false;
      }
      const query = `SELECT password FROM users WHERE email = ?`;
      const result = await db.query(query, [email]);
      if (result.values && result.values.length > 0) {
        const storedPassword = result.values[0].password;
        const isPasswordValid = storedPassword === password;
        return isPasswordValid;
      } else {
        console.warn('User not found with provided email');
        return false;
      }
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  async registerUser(
    primerNombre: string,
    segundoNombre: string,
    primerApellido: string,
    segundoApellido: string,
    email: string,
    password: string,
    recoveryCode: string
  ): Promise<string> {
    console.log('registerUser');
    try {
      await SqliteService.ensureDbReady();
      if (!this.validateEmailFormat(email)) {
        return 'Invalid email format.';
      }
      const passwordValidationResult =
        CustomPasswordValidators.passwordValidator({ value: password } as any);
      if (passwordValidationResult !== null) {
        return passwordValidationResult['invalidPassword'];
      }
      const userExists = await this.sqliteService.userExists(email);
      if (userExists) {
        return 'User already registered.';
      }
      await this.sqliteService.addUser(
        primerNombre.toLowerCase(),
        segundoNombre.toLowerCase(),
        primerApellido.toLowerCase(),
        segundoApellido.toLowerCase(),
        email.toLowerCase(),
        password,
        this.getRoleFromEmail(email),
        recoveryCode
      );
      return 'User successfully registered';
    } catch (error) {
      console.error('Error registering user:', error);
      return 'Error registering user. Please try again.';
    }
  }

  getRoleFromEmail(email: string): string {
    console.log('getRoleFromEmail');
    if (email.endsWith('@profesor.duoc.cl')) {
      return 'profesor';
    } else if (email.endsWith('@duocuc.cl')) {
      return 'alumno';
    }
    return 'alumno';
  }

  private validateEmailFormat(email: string): boolean {
    console.log('validateEmailFormat');
    const validationResult = CustomEmailValidators.emailValidator({
      value: email,
    } as any);
    return validationResult === null;
  }

  async checkAllUsers() {
    console.log('checkAllUsers');
    const allUsers = await this.sqliteService.getAllUsers();
    console.log('All users in database:', allUsers);
  }

  async storeUserSession(user: any): Promise<void> {
    console.log('storeUserSession');
    if (
      !user.email ||
      !user.primerNombre ||
      !user.primerApellido ||
      !user.role
    ) {
      console.error('Incomplete or invalid user data', user);
      return;
    }
    try {
      const userData = {
        email: user.email,
        role: user.role,
        primerNombre: user.primerNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        recoveryCode: user.recoveryCode,
      };
      await Preferences.set({
        key: 'userSession',
        value: JSON.stringify(userData),
      });
      await Preferences.set({ key: 'isAuthenticated', value: 'true' });
      this.userService.setUser(user);
      console.log('User and session stored successfully.');
    } catch (error) {
      console.error('Error storing user session:', error);
    }
  }

  async getAuthenticatedState(): Promise<boolean> {
    console.log('getAuthenticatedState');
    const { value } = await Preferences.get({ key: 'isAuthenticated' });
    return value === 'true';
  }

  async getUserSession(): Promise<User | null> {
    console.log('getUserSession');
    try {
      const { value } = await Preferences.get({ key: 'userSession' });
      if (!value) {
        return null;
      }
      const userData = JSON.parse(value);
      if (!userData.email || !userData.role) {
        return null;
      }
      return this.userService.createUser(
        userData.primerNombre,
        userData.segundoNombre || '',
        userData.primerApellido,
        userData.segundoApellido || '',
        userData.email,
        '',
        userData.role,
        userData.recoveryCode || ''
      );
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  async checkAuthentication() {
    console.log('checkAuthentication');
    const isAuthenticated = await this.getAuthenticatedState();
    if (isAuthenticated) {
      const userData = await this.getUserSession();
      if (userData) {
        this.userService.setUser(userData);
        this.navCtrl.navigateRoot('/home-page');
      }
    } else {
      this.navCtrl.navigateRoot('/login');
    }
  }

  async clearSession(): Promise<boolean> {
    console.log('clearSession');
    try {
      await Preferences.remove({ key: 'userSession' });
      await Preferences.remove({ key: 'isAuthenticated' });
      this.userService.clearUser();
      console.log('User session cleared.');
      return true;
    } catch (error) {
      console.error('Error clearing user session:', error);
      return false;
    }
  }
}
