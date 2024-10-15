import { Component, OnInit, OnDestroy } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform, NavController, LoadingController } from '@ionic/angular';
import { SqliteService } from './services/sqlite.service';
import { AuthService } from './services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public isWeb: boolean;
  public load: boolean;
  public jeepSqliteAvailable: boolean = false; // Nueva propiedad para verificar disponibilidad
  form!: FormGroup;
  submitted = false;
  private dbReadySubscription!: Subscription;
  private authSubscription!: Subscription;

  constructor(
    private platform: Platform,
    private sqlite: SqliteService,
    private authService: AuthService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private formBuilder: FormBuilder
  ) {
    console.log('AppComponent constructor');
    this.isWeb = false;
    this.load = false;
  }

  async ngOnInit() {
    console.log('ngOnInit');
    await this.initApp();
    this.initForm();
    this.checkAuthentication();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    if (this.dbReadySubscription) {
      this.dbReadySubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async initApp() {
    console.log('initApp');
    const loading = await this.loadingCtrl.create({
      message: 'Cargando aplicación...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      await this.platform.ready();

      const info = await Device.getInfo();
      this.isWeb = info.platform === 'web';

      if (this.isWeb) {
        const jeepSqliteElement = document.querySelector('jeep-sqlite');
        this.jeepSqliteAvailable = jeepSqliteElement !== null;
        console.log('jeep-sqlite disponible:', this.jeepSqliteAvailable);
      }

      if (!SqliteService.isDbConnected) {
        await this.sqlite.init();
      }

      if (!this.dbReadySubscription) {
        this.dbReadySubscription = SqliteService.dbReady.subscribe(
          (isReady) => {
            this.load = isReady;
            if (isReady) {
              console.log('Base de datos lista');
              loading.dismiss();
              this.checkAuthentication();
            }
          }
        );
      }
    } catch (error) {
      console.error('Error en la inicialización de la app:', error);
      await loading.dismiss();
    }
  }

  async checkAuthentication() {
    console.log('checkAuthentication');
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
    }
  }

  initForm() {
    console.log('initForm');
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  get formFields() {
    console.log('formFields');
    return this.form.controls;
  }

  onSubmit() {
    console.log('onSubmit');
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    console.log('Formulario enviado:', this.form.value);
  }

  onReset() {
    console.log('onReset');
    this.submitted = false;
    this.form.reset();
  }
}
