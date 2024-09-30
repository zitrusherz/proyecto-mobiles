import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { AuthenticationStateService } from 'src/app/services/authentication-state.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomEmailValidators } from 'src/app/validators/email-validator';
import { CustomPasswordValidators } from 'src/app/validators/password-validator';

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
export class LoginPage implements OnInit{
  email: string = '';
  password: string = '';
  passwordInputType: string = 'password';
  loginForm!: FormGroup;
  constructor(
    private authService: AuthService,
    private authStateService: AuthenticationStateService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, CustomEmailValidators.emailValidator]],  
      password: ['', [Validators.required, Validators.minLength(10),CustomPasswordValidators.passwordValidator]],  
      confirmPassword: ['', Validators.required]},
      {validator: CustomPasswordValidators.matchPassword
    });
  }
  // IMPLEMENTACION CON SQLITE
  async onLogin() {
    if(this.loginForm.valid){
      try {
        const isAuthenticated = await this.authService.login(this.email, this.password);

        if (isAuthenticated) {
          console.log("Autenticado")
          this.authStateService.setAuthenticated(true);
          this.navCtrl.navigateForward('/home-page');
        } else {
          console.log(" NO Autenticado")
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
  }
  
  //TERMINO
  /*loginUser() {
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
  }*/

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }


  togglePasswordVisibility() {
    this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }

  goToPasswordRecovery(){
    this.navCtrl.navigateForward('/password-recovery');
  }
}
