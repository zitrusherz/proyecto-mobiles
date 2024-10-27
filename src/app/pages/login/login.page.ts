import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NavController, ToastController} from '@ionic/angular';
import {AuthService} from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  passwordInputType: string = 'password';
  isLoading: boolean = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly toastController: ToastController
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.isLoading = true;

      try {
        const isAuthenticated = await this.authService.login(email, password, true);

        this.isLoading = false;

        if (isAuthenticated) {
          this.goToHome();
        } else {
          this.handleLoginFailure();
        }
      } catch (error: any) {
        console.error('Error during login:', error);
        let errorMessage = 'Error al intentar iniciar sesión.';

        if (error.message && error.message.includes('network')) {
          errorMessage = 'Error de red. Verifique su conexión.';
        }

        await this.presentToast(errorMessage);

        this.isLoading = false;
      }
    } else {
      await this.presentToast(
        'Por favor, llena todos los campos correctamente.'
      );
    }
  }

  async handleLoginFailure() {
    const userExists = await this.authService.checkUserExists(
      this.loginForm.get('email')?.value
    );
    if (userExists) {
      await this.presentToast('La contraseña es incorrecta.');
    } else {
      await this.presentToast('El usuario no existe.');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }

  togglePasswordVisibility() {
    this.passwordInputType =
      this.passwordInputType === 'password' ? 'text' : 'password';
  }

  goToHome() {
    this.navCtrl.navigateForward('/home-page');
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }

  goToPasswordRecovery() {
    this.navCtrl.navigateForward('/password-recovery');
  }
}
