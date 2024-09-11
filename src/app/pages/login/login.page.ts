import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
//import { AuthService } from 'src/app/services/auth.service';
//import { AuthenticationStateService } from 'src/app/services/authentication-state.service';
import { UserService } from 'src/app/services/user.service';
interface User {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss']
})
export class LoginPage {
  //email: string = '';
  //password: string = '';
  users: User[] = [];
  loginEmail: string = '';
  loginPassword: string = '';
  constructor(
    /*private authService: AuthService,
    private authStateService: AuthenticationStateService,*/
    private navCtrl: NavController,
    private toastController: ToastController,
    private userService: UserService
  ) {}
  // IMPLEMENTACION CON SQLITE
  /*async onLogin() {
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
  */
  //TERMINO
  loginUser() {
    const user = this.userService.getUsers().find(user => 
      user.email === this.loginEmail.toLowerCase() && 
      user.password === this.loginPassword
    );

    if (user) {
      this.presentToast('Inicio de sesión exitoso');
      this.goToHome(user);  
    } else {
      this.presentToast('Correo electrónico o contraseña incorrectos');
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

  goToHome(user: User) {
    this.navCtrl.navigateForward('/home-page', {
      queryParams: {
        nombre: user.primerNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        email: user.email
      }
    });
  }


  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }

  goToPasswordRecovery(){
    this.navCtrl.navigateForward('/password-recovery');
  }
}
