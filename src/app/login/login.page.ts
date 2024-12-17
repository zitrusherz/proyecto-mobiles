import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicCommonComponents } from '../components/ionic-common-components';

import {NavController, ToastController} from '@ionic/angular';
import {AuthService} from 'src/app/services/auth.service';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicCommonComponents, CommonModule, FormsModule, ExploreContainerComponent,
     ReactiveFormsModule]  
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  passwordInputType: string = 'password';
  isLoading: boolean = false;

  constructor(private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly toastController: ToastController) {
      
addIcons({
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
});
     }

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
          const isAuthenticated = await this.authService.login(email, password, false);
  
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
