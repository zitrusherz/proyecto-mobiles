import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {createClient, Session, SupabaseClient, User} from '@supabase/supabase-js';
import {environment} from 'src/environments/environment';
import {SqliteService} from './sqlite.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private authChanges = new BehaviorSubject<Session | null>(null);
  private currentUser: BehaviorSubject<User | boolean> = new BehaviorSubject<
    boolean | User
  >(false);
  supabaseService: any;

  constructor(private router: Router, private SqliteService: SqliteService) {
    this.supabase = createClient(
      environment.supabaseURL,
      environment.supabaseKey
    );

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authChanges.next(session);
    });

    /*
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      console.log('Auth session:', session);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('SET USER: ', session);
        this.currentUser.next(session?.user || false);
        console.log('User signed in');
      } else {
        this.currentUser.next(false);
        console.log('User signed out');
      }
    });
    this.loadUser();
    */
  }

  /*
  async loadUser() {
    if (this.currentUser.value) {
      return;
    }
    const user = this.supabase.auth.getUser();
    if (user.data)
  }
*/
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

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
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
        id: userId,
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
