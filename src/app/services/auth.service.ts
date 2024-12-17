import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {SqliteService} from './sqlite.service';
import {SupabaseService} from './supabase.service';
import {Device} from '@capacitor/device';
import {CustomEmailValidators} from '../validators/email-validator';
import {CustomPasswordValidators} from '../validators/password-validator';
import {Preferences} from '@capacitor/preferences';
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {User as AppUser} from '../interface/user';
import {NavController} from '@ionic/angular';
import { first } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private isWeb: boolean = false;

  constructor(
    private readonly userService: UserService,
    private readonly sqliteService: SqliteService,
    private readonly supabaseService: SupabaseService,
    private readonly router: Router,
    private readonly navCtrl: NavController
  ) {
    this.initialize();
    this.supabaseService.initFinished$.pipe(first()).subscribe(() => {
      this.checkInitialAuthState();
    });
    console.log('AuthService initialized');
  }

  private async initialize() {
    try {
      await this.initializePlatform();
      await this.checkAuthentication();
    } catch (error) {
      console.error('Error during AuthService initialization:', error);
    }
  }
  private async checkInitialAuthState() {
    const session = await this.supabaseService.client.auth.getSession();
  }
  setAuthenticated(state: boolean): void {
    this.isAuthenticatedSubject.next(state);
    console.log('User authenticated:', state);
  }

  private async initializePlatform() {
    const info = await Device.getInfo();
    this.isWeb = info.platform === 'web';
    await this.sqliteService.init();
  }

  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<boolean> {
    console.log('Attempting to log in with email:', email);

    try {
      let user: AppUser | null = null;

      if (rememberMe) {
        user = await SqliteService.getUserDetailsByEmail(email);
        if (user && user.password === password) {
          console.log('User authenticated locally (SQLite)');
          this.userService.setUser(user);
          this.setAuthenticated(true);
          return true;
        }
      }

      const { data, error } = await this.supabaseService.signIn(
        email,
        password
      );
      if (error) {
        console.error('Error during Supabase sign-in:', error.message);
        return false;
      }

      if (data && data.user) {
        console.log('User authenticated with Supabase');

        const userProfile = await this.supabaseService.getUserProfile(email);

        const appUser: AppUser = this.mapSupabaseUserToAppUser(userProfile);

        if (rememberMe) {
          await this.sqliteService.addUser(
            appUser.primerNombre,
            appUser.segundoNombre ?? '',
            appUser.primerApellido,
            appUser.segundoApellido ?? '',
            appUser.email,
            password,
            appUser.role,
            appUser.recoveryCode ?? ''
          );
        }

        this.userService.setUser(appUser);
        this.setAuthenticated(true);
        return true;
      } else {
        console.log('User not found in Supabase.');
        this.setAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  private async handleSuccessfulLogin(user: AppUser) {
    console.log('Handling successful login');
    this.userService.setUser(user);
    await this.storeUserSession(user);
    this.setAuthenticated(true);
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

        let user: AppUser;

        if (Array.isArray(userRow)) {
          user = {
            primerNombre: userRow[0],
            segundoNombre: userRow[1],
            primerApellido: userRow[2],
            segundoApellido: userRow[3],
            email: userRow[4],
            password: userRow[5],
            role: userRow[6],
            recoveryCode: userRow[7],
          };

          console.log('User created (array):', user);
        } else if (typeof userRow === 'object') {
          user = {
            primerNombre: userRow.primerNombre,
            segundoNombre: userRow.segundoNombre,
            primerApellido: userRow.primerApellido,
            segundoApellido: userRow.segundoApellido,
            email: userRow.email,
            password: userRow.password,
            role: userRow.role,
            recoveryCode: userRow.recoveryCode,
          };

          console.log('User created (object):', user);
        } else {
          console.error(
            'User row format is neither array nor object:',
            userRow
          );
          return;
        }

        this.userService.setUser(user);
        await this.storeUserSession(user);
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
      const userExists =
        (await this.sqliteService.userExists(email)) ||
        this.supabaseService.userExists(email);
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
      return recoveryCode;
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

      console.log('Query result:', result);

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
  ): Promise<boolean | string> {
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

      const userExistsInSupabase = await this.supabaseService.userExists(
        email.toLowerCase()
      );
      if (userExistsInSupabase) {
        console.log('User already registered in Supabase.');
      }

      try {
        await this.supabaseService.addUser({
          primerNombre: primerNombre.toLowerCase(),
          segundoNombre: segundoNombre ? segundoNombre.toLowerCase() : '',
          primerApellido: primerApellido.toLowerCase(),
          segundoApellido: segundoApellido.toLowerCase(),
          email: email.toLowerCase(),
          password: password,
          role: this.getRoleFromEmail(email),
          recoveryCode: recoveryCode,
        });

        console.log('User successfully registered in Supabase.');

        const userExistsInSQLite = await this.sqliteService.userExists(
          email.toLowerCase()
        );
        if (userExistsInSQLite) {
          console.log('User already registered locally.');
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

        console.log(
          'User successfully registered in both Supabase and SQLite.'
        );
        return true;
      } catch (supabaseError) {
        console.error('Error registering user in Supabase:', supabaseError);
        return 'Error registering user in Supabase.';
      }
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
    try {
      if (
        !user.email ||
        !user.primerNombre ||
        !user.primerApellido ||
        !user.role
      ) {
        console.error('User object is missing required properties');
        throw new Error('Invalid user object');
      }

      const userData = {
        email: user.email,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre || '',
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido || '',
        role: user.role,
        recoveryCode: user.recoveryCode || '',
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

  async getUserSession(): Promise<AppUser | null> {
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

      const user: AppUser = {
        primerNombre: userData.primerNombre,
        segundoNombre: userData.segundoNombre || '',
        primerApellido: userData.primerApellido,
        segundoApellido: userData.segundoApellido || '',
        email: userData.email,
        password: '',
        role: userData.role,
        recoveryCode: userData.recoveryCode || '',
      };

      return user;
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
      } else {
        this.navCtrl.navigateRoot('/login');
      }
    } else {
      this.navCtrl.navigateRoot('/login');
    }
  }

  private mapSupabaseUserToAppUser(userProfile: any): AppUser {
    return {
      email: userProfile.email,
      primerNombre: userProfile.primerNombre,
      segundoNombre: userProfile.segundoNombre || '',
      primerApellido: userProfile.primerApellido,
      segundoApellido: userProfile.segundoApellido,
      password: '',
      role: userProfile.role,
      recoveryCode: userProfile.recoveryCode,
    };
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
