import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NavController, ToastController } from '@ionic/angular';
import { AuthenticationStateService } from 'src/app/services/authentication-state.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  primerNombre: string = '';
  segundoNombre: string = '';
  primerApellido: string = '';
  segundoApellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  requirements = {
    length: 0,
    uppercase: false,
    number: false,
    special: false
  };
  inputFocused: boolean = false;
  passwordMatchError: boolean = false;
  emailError: string = '';
  passwordInputType: string = 'password';

  constructor(
    private authService: AuthService,
    private authStateService: AuthenticationStateService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  validatePassword(password: string) {
    if (password === undefined || password === null) {
      password = '';
    }
    this.requirements.length = password.length;
    this.requirements.uppercase = /[A-Z]/.test(password);
    this.requirements.number = /\d/.test(password);
    this.requirements.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    this.passwordMatchError = this.password !== this.confirmPassword;
  }
  
  validateConfirmPassword(confirmPassword: string) {
    if (confirmPassword === undefined || confirmPassword === null) {
      confirmPassword = '';
    }
    this.passwordMatchError = this.password !== confirmPassword;
  }

  validateEmail() {
    const profesorRegex = /^[a-z]{2}\.[a-z]+@profesor\.duoc\.cl$/;
    const alumnoRegex = /^[a-z]{2}\.[a-z]+@duocuc\.cl$/;

    if (profesorRegex.test(this.email)) {
      this.emailError = '';
      console.log('Es un profesor');
    } else if (alumnoRegex.test(this.email)) {
      this.emailError = '';
      console.log('Es un alumno');
    } else {
      this.emailError = 'El formato del correo no es válido.';
    }
  }

  async registerUser() {
    if (this.validateForm()) {
      try {
        
        const primerNombre = this.primerNombre.toLowerCase();
        const segundoNombre = this.segundoNombre.toLowerCase();
        const primerApellido = this.primerApellido.toLowerCase();
        const segundoApellido = this.segundoApellido.toLowerCase();
        const email = this.email.toLowerCase();
        const password = this.password;
  
        
        const resultMessage = await this.authService.registerUser(
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          password
        );
  
        
        await this.presentToast(resultMessage);
        if (resultMessage === 'Usuario registrado exitosamente') {
          this.authStateService.setAuthenticated(true);
          this.goToHome();
        }
      } catch (error) {
        console.error('Error al registrar usuario', error);
        await this.presentToast('Error al registrar usuario');
      }
    }
  }
  

  togglePasswordVisibility() {
    this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
  }

  validateForm(): boolean {
    this.validatePassword(this.password);
    this.validateConfirmPassword(this.confirmPassword);
    this.validateEmail();
  
    return (
      !this.passwordMatchError &&
      this.requirements.length >= 8 &&
      this.requirements.uppercase &&
      this.requirements.number &&
      this.requirements.special &&
      !this.emailError
    );
  }

  onFocus() {
    this.inputFocused = true;
  }

  onBlur() {
    this.inputFocused = false;
  }

  goToHome() {
    this.navCtrl.navigateRoot('/');
  }

  ngOnInit() {}

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, 
      position: 'bottom'
    });
    toast.present();
  }
}
