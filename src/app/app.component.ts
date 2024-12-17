import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Device } from '@capacitor/device';
import { IonToast, LoadingController, NavController, Platform } from '@ionic/angular';
import { SqliteService } from './services/sqlite.service';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { AuthService } from './services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupabaseService } from './services/supabase.service';
import { isPlatformBrowser } from '@angular/common';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastElement', { static: false }) toast!: IonToast;
  private readonly platform = inject(Platform);
  private readonly sqlite = inject(SqliteService);
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly formBuilder = inject(FormBuilder);

  isWeb: boolean = false;
  load: boolean = false;
  jeepSqliteAvailable: boolean = false;
  form!: FormGroup;
  submitted = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private supabaseService: SupabaseService) {
    console.log('AppComponent constructor');
  }

  async ngOnInit() {
    console.log('ngOnInit - Initializing jeepSqlite');
    jeepSqlite(window);
    await this.initApp();
    if (isPlatformBrowser(this.platform) && !this.supabaseService.client) {
      this.supabaseService.initClient();
    }
    this.initForm();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initApp() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando aplicación...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      await this.platform.ready();

      const deviceInfo = await Device.getInfo();
      this.isWeb = deviceInfo.platform === 'web';

      if (this.isWeb) {
        const jeepSqliteElement = document.querySelector('jeep-sqlite');
        this.jeepSqliteAvailable = jeepSqliteElement !== null;
        console.log('jeep-sqlite disponible:', this.jeepSqliteAvailable);
      }

      if (!SqliteService.isDbConnected) {
        await this.sqlite.init();
      }

      SqliteService.dbReady
        .pipe(takeUntil(this.destroy$))
        .subscribe((isReady) => {
          this.load = isReady;
          if (isReady) {
            console.log('Base de datos lista');
            this.checkAuthentication();
          }
        });
    } catch (error) {
      console.error('Error en la inicialización de la app:', error);
    } finally {
      await loading.dismiss();
    }
  }

  private async checkAuthentication() {
    try {
      const isAuthenticated = await this.authService.getAuthenticatedState();
      if (isAuthenticated) {
        console.log('Usuario autenticado, redirigiendo a home...');
        this.navCtrl.navigateRoot('/home-page');
      } else {
        console.log('Usuario no autenticado, redirigiendo a login...');
        this.navCtrl.navigateRoot('/');
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      this.showToast();
    }
  }

  private initForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  get formFields() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }
  }

  async showToast() {
    if (this.toast) {
      await this.toast.present();
    }
  }

  onReset() {
    this.submitted = false;
    this.form.reset();
  }
}
