import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { AuthenticationStateService } from 'src/app/services/authentication-state.service';

@Component({
  selector: 'app-login',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private authStateService: AuthenticationStateService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  async onLogin() {
    try {
      const isAuthenticated = await this.authService.login(this.email, this.password);

      if (isAuthenticated) {
        this.authStateService.setAuthenticated(true);
        this.navCtrl.navigateForward('/tabs');
      } else {
        const userExists = await this.authService.checkUserExists(this.email);
        if (userExists) {
          await this.presentToast('La contraseña es incorrecta.');
        } else {
          await this.presentToast('El usuario no existe.');
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      await this.presentToast('Error al intentar iniciar sesión.');
    } finally {
      
      this.email = '';
      this.password = '';
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }
}
