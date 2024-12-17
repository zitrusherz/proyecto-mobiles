import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicCommonComponents } from '../components/ionic-common-components';

import {AuthService} from 'src/app/services/auth.service';
import {LoadingController, NavController, ToastController,} from '@ionic/angular';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomEmailValidators} from 'src/app/validators/email-validator';
import {CustomPasswordValidators} from 'src/app/validators/password-validator';
import {debounceTime, Subscription} from 'rxjs';
import {Requirements} from 'src/app/interface/password-req';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, ExploreContainerComponent,IonicCommonComponents,
     ReactiveFormsModule,
  ]
})
export class RegisterPage implements OnInit, OnDestroy {
  requirements: Requirements = {
    length: false,
    uppercase: false,
    number: false,
    special: false,
  };

  passwordMatchError: boolean = false;
  passwordInputType: string = 'password';
  recoveryCode: string = '';
  registerForm!: FormGroup;
  isLoading = false;

  private subscriptions: Subscription = new Subscription();
  constructor(
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly toastController: ToastController,
    private loadingController: LoadingController,
    private readonly formBuilder: FormBuilder
  ) {
    this.generateRecoveryCode();
  }

  ngOnInit() {
    this.initializeForm();
    this.setupSubscriptions();
  }

  initializeForm() {
    this.registerForm = this.formBuilder.group(
      {
        primerNombre: ['', Validators.required],
        segundoNombre: [''],
        primerApellido: ['', Validators.required],
        segundoApellido: ['', Validators.required],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            CustomEmailValidators.emailValidator,
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            CustomPasswordValidators.passwordValidator,
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: CustomPasswordValidators.matchPassword }
    );
  }

  setupSubscriptions() {
    const passwordSubscription = this.registerForm
      .get('password')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((password) => {
        this.validatePassword(password);
      });

    const emailSubscription = this.registerForm
      .get('email')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((email) => {});

    if (passwordSubscription) {
      this.subscriptions.add(passwordSubscription);
    }
    if (emailSubscription) {
      this.subscriptions.add(emailSubscription);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  copyCode(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.presentToast('Texto copiado al portapapeles!');
      })
      .catch((err) => {
        console.error('Error al copiar texto: ', err);
      });
  }

  generateRecoveryCode() {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const codeLength = 10;
    let result = '';
    for (let i = 0; i < codeLength; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    this.recoveryCode = result;
  }

  async registerUser() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      try {
        const {
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          password,
        } = this.registerForm.value;

        const resultMessage = await this.authService.registerUser(
          primerNombre.toLowerCase(),
          segundoNombre ? segundoNombre.toLowerCase() : '',
          primerApellido.toLowerCase(),
          segundoApellido.toLowerCase(),
          email.toLowerCase(),
          password,
          this.recoveryCode
        );

        console.log('Usuario registrado:', resultMessage);
        //await this.presentToast('Registro exitoso');

        if (resultMessage) {
          console.log('Redirigiendo a la página de login...');
          this.goToLogin();
          this.registerForm.reset();
        }
      } catch (error) {
        console.error('Error al registrar usuario', error);
        let errorMessage = 'Error al registrar usuario';
        if ((error as any).status === 409) {
          errorMessage = 'El correo electrónico ya está en uso';
        } else if ((error as any).status === 500) {
          errorMessage = 'Error del servidor, por favor intenta más tarde';
        }
        await this.presentToast(errorMessage);
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log('Formulario inválido');
    }
  }

  togglePasswordVisibility() {
    this.passwordInputType =
      this.passwordInputType === 'password' ? 'text' : 'password';
  }

  goToLogin() {
    this.navCtrl.navigateRoot('/');
  }

  validatePassword(password: string) {
    if (!password) {
      return;
    }

    this.requirements.length = password.length >= 10;
    this.requirements.uppercase = /[A-Z]/.test(password);
    this.requirements.number = /\d/.test(password);
    this.requirements.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    this.passwordMatchError = password !== confirmPassword;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
    });
    toast.present();
  }

}
