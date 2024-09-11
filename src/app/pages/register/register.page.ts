import { Component, OnInit } from '@angular/core';
//import { AuthService } from 'src/app/services/auth.service';
import { NavController, ToastController } from '@ionic/angular';
//import { AuthenticationStateService } from 'src/app/services/authentication-state.service';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/interface/user'; 


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
  isEmailValidationInProgress: boolean = false;
  passwordInputType: string = 'password';
  recoveryCode: string = '';
  

  constructor(
    /*private authService: AuthService,
    private authStateService: AuthenticationStateService,*/
    private navCtrl: NavController,
    private toastController: ToastController,
    private userService: UserService,

  ) {
    this.generateRecoveryCode();
  }

  copyCode(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      
      this.presentToast('Texto copiado al portapapeles!');
    }).catch(err => {
      console.error('Error al copiar texto: ', err);
    });
  }

  generateRecoveryCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const codeLength = 10;
    let result = '';
    for (let i = 0; i < codeLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.recoveryCode = result;
  }

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

    if (profesorRegex.test(this.email.toLowerCase())) {
      this.emailError = '';
      console.log('Es un profesor');
    } else if (alumnoRegex.test(this.email.toLowerCase())) {
      this.emailError = '';
      console.log('Es un alumno');
    } else {
      this.emailError = 'El formato del correo no es válido.';
    }
  
    
  }

  /*async registerUser() {
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
  */
  // IMPLEMENTACION SIN BASE DE DATOS PARA PRIMERA ENTREGA
  registerUser() {
    if (this.validateForm()) {
      if (this.userService.isEmailRegistered(this.email.toLowerCase())) {
        this.presentToast('Este correo ya está registrado.');
        return;
      }

      const newUser: User = {
        primerNombre: this.primerNombre.toLowerCase(),
        segundoNombre: this.segundoNombre.toLowerCase(),
        primerApellido: this.primerApellido.toLowerCase(),
        segundoApellido: this.segundoApellido.toLowerCase(),
        email: this.email.toLowerCase(),
        password: this.password,
        codigoRecuperacion: this.recoveryCode,
      };
      console.log(this.recoveryCode, this.email.toLowerCase())
      this.userService.addUser(newUser);
      this.presentToast('Usuario registrado exitosamente');
      this.goToHome();
    } else {
      this.presentToast('Por favor, verifica los datos ingresados.');
    }
  }

  
  // TERMINA AQUI LOS CAMBIOS
  togglePasswordVisibility() {
    this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
  }

  validateForm(): boolean {
    this.validatePassword(this.password);
    this.validateConfirmPassword(this.confirmPassword);
    if (this.email.trim() !== '') {
      this.validateEmail();
    }
  
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
      duration: 1500, 
      position: 'bottom'
    });
    toast.present();
  }
}
