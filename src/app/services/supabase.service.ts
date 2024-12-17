import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import {createClient, Session, SupabaseClient, User} from '@supabase/supabase-js';
import {environment} from 'src/environments/environment';
import {SqliteService} from './sqlite.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private _initFinished$ = new ReplaySubject<void>(1);
  private authChanges = new BehaviorSubject<Session | null>(null);
  private currentUser: BehaviorSubject<User | boolean> = new BehaviorSubject<
    boolean | User
  >(false);
  public readonly initFinished$ = this._initFinished$.asObservable();
  supabaseService: any;
  private supabaseClient!: SupabaseClient;
  private initialized = new BehaviorSubject<boolean>(false);
  constructor(private router: Router, private SqliteService: SqliteService) {
    if (!this.supabaseClient) {
      this.initClient();
    }

  }
  initClient() {
    this.supabase = createClient(
      environment.supabaseURL,
      environment.supabaseKey
    );
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authChanges.next(session);
    });
    this._initFinished$.next();
  }

  get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options: any;
  }) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options,
    });
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  async getUserProfile(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, profileData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(profileData)
      .eq('id', userId);
    if (error) throw error;
    return data;
  }

  async addUser(user: {
    primerNombre: string;
    segundoNombre: string;
    primerApellido: string;
    segundoApellido: string;
    email: string;
    password: string;
    role: string;
    recoveryCode: string;
  }): Promise<void> {
    const { data, error } = await this.supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) {
      throw new Error('No se encontró el ID del usuario después del registro');
    }

    const { error: insertError } = await this.supabase.from('users').insert([
      {
        email: user.email,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        password: user.password,
        role: user.role,
        recoveryCode: user.recoveryCode,
      },
    ]);

    if (insertError) throw insertError;
  }

  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<void> {
    if (rememberMe) {
      const localUser = await SqliteService.getUserDetailsByEmail(email);
      if (localUser && localUser.password === password) {
        return;
      }
    }

    const { data, error } = await this.signIn(email, password);
    if (error) throw error;

    if (rememberMe && data && data.user) {
      const userProfile = await this.getUserProfile(data.user.id);
      await this.SqliteService.addUser(
        userProfile.primerNombre,
        userProfile.segundoNombre,
        userProfile.primerApellido,
        userProfile.segundoApellido,
        email,
        password,
        userProfile.role,
        userProfile.recoveryCode
      );
    }
  }

  async saveValueQr(qr: string, id_profesor: number): Promise<boolean> {
    if (!qr && !id_profesor) return false;

    const { data, error } = await this.supabase
      .from('qr')
      .insert([{ valor_codificado: qr, id_profesor: id_profesor }]);

    if (error) {
      console.error('Error saving QR value:', error);
      throw error;
    }

    return true;
  }

  async qrExists(value: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('qr')
      .select('id')
      .eq('valor_codificado', value)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error checking QR existence:', error);
        throw error;
      }
      return false;
    }

    return !!data;
  }

  async getQrId(value: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('qr')
      .select('id')
      .eq('valor_codificado', value)
      .single();

    if (error) {
      console.error('Error getting QR ID:', error);
      throw error;
    }

    return data.id;
  }

  async getQrIdProfesor(value: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('qr')
      .select('id_profesor')
      .eq('valor_codificado', value)
      .single();

    if (error) {
      console.error('Error getting QR ID:', error);
      throw error;
    }
    return data.id_profesor;
  }

  async getEmailById(id: number): Promise<string> {
    const { data, error } = await this.supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting email by ID:', error);
      throw error;
    }

    return data.email;
  }

  async saveAttendance(idQr: number, idUser: number): Promise<boolean> {
    if (!idQr || !idUser) return false;

    const { data, error } = await this.supabase.from('asistencia').insert([
      {
        id_alumno: idUser,
        id_qr: idQr,
      },
    ]);

    if (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }

    return true;
  }

  async userExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  async getUserDetailsByEmail(email: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && !error.message.includes('No rows')) {
      throw error;
    }

    return data || null;
  }

  async updateUser(
    id: string,
    primerNombre?: string,
    segundoNombre?: string,
    primerApellido?: string,
    segundoApellido?: string,
    email?: string,
    password?: string,
    recoveryCode?: string
  ): Promise<void> {
    const updates: any = {};
    if (primerNombre) updates.primerNombre = primerNombre;
    if (segundoNombre) updates.segundoNombre = segundoNombre;
    if (primerApellido) updates.primerApellido = primerApellido;
    if (segundoApellido) updates.segundoApellido = segundoApellido;
    if (email) updates.email = email;
    if (recoveryCode) updates.recoveryCode = recoveryCode;

    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    if (password) {
      const { error: authError } = await this.supabase.auth.updateUser({
        password,
      });
      if (authError) throw authError;
    }
  }

  async getRecoveryCodeByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('recoveryCode')
      .eq('email', email)
      .single();

    if (error && !error.message.includes('No rows')) {
      throw error;
    }

    return data?.recoveryCode || null;
  }

  async getAllUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }

  get authChanges$() {
    return this.authChanges.asObservable();
  }
}
