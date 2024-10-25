import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Device} from '@capacitor/device';
import {IonToast, LoadingController, NavController, Platform,} from '@ionic/angular';
import {SqliteService} from './services/sqlite.service';
import {defineCustomElements as jeepSqlite} from 'jeep-sqlite/loader';
import {AuthService} from './services/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastElement', { static: false }) toast!: IonToast;
  public isWeb: boolean;
  public load: boolean;
  public jeepSqliteAvailable: boolean = false;
  form!: FormGroup;
  submitted = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly platform: Platform,
    private readonly sqlite: SqliteService,
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly formBuilder: FormBuilder
  ) {
    console.log('AppComponent constructor');
    this.isWeb = false;
    this.load = false;
  }

  async ngOnInit() {
    console.log('ngOnInit - Initializing jeepSqlite');
    jeepSqlite(window);
    await this.initApp();
    this.initForm();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.destroy$.next();
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

  async checkAuthentication() {
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

  initForm() {
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
