import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { NavController, ToastController } from '@ionic/angular';
import { AuthenticationStateService } from 'src/app/services/authentication-state.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomEmailValidators } from 'src/app/validators/email-validator';
import { CustomPasswordValidators } from 'src/app/validators/password-validator';


@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  
  requirements = {
    length: false,
    uppercase: false,
    number: false,
    special: false
  };
  passwordMatchError: boolean = false;
  passwordInputType: string = 'password';
  recoveryCode: string = '';
  registerForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private authStateService: AuthenticationStateService,
    private navCtrl: NavController,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
  ) {
    this.generateRecoveryCode();
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      primerNombre: ['', [Validators.required]],  
      segundoNombre: [''],  
      primerApellido: ['', [Validators.required]],  
      segundoApellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, CustomEmailValidators.emailValidator]],  
      password: ['', [Validators.required, Validators.minLength(10),CustomPasswordValidators.passwordValidator]],  
      confirmPassword: ['', Validators.required]},
      {validator: CustomPasswordValidators.matchPassword
    });

    this.registerForm.get('password')?.valueChanges.subscribe((password: string) => {
      this.validatePassword(password);
    });
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

  async registerUser() {
    if (this.registerForm.valid) {
      try {
        const formValues = this.registerForm.value;
        const primerNombre = formValues.primerNombre.toLowerCase();
        const segundoNombre = formValues.segundoNombre.toLowerCase();
        const primerApellido = formValues.primerApellido.toLowerCase();
        const segundoApellido = formValues.segundoApellido.toLowerCase();
        const email = formValues.email.toLowerCase();
        const password = formValues.password;
        const codeRecovery = this.recoveryCode;
  
        const resultMessage = await this.authService.registerUser(
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          password,
          codeRecovery
        );
        
        await this.presentToast(resultMessage);
        if (resultMessage === 'Usuario registrado exitosamente') {
          this.authStateService.setAuthenticated(true);
          this.goToLogin();
          this.registerForm.reset(); 
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

  goToLogin() {
    this.navCtrl.navigateRoot('/');
  }
  validatePassword(password: string) {
    this.requirements.length = password.length >= 10;
    this.requirements.uppercase = /[A-Z]/.test(password);
    this.requirements.number = /\d/.test(password);
    this.requirements.special = /[!@#$%^&*(),.?¿¡"+:{}|<>]/.test(password);

    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    this.passwordMatchError = password !== confirmPassword;
  }
  
  

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500, 
      position: 'bottom'
    });
    toast.present();
  }
}
