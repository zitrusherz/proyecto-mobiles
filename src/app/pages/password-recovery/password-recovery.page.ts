import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service'; // Usar AuthService en lugar de UserService
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomEmailValidators } from 'src/app/validators/email-validator';
import { CustomPasswordValidators } from 'src/app/validators/password-validator';
import { Requirements } from 'src/app/interface/password-req.interface'; // Importa la interfaz de requisitos de contraseña

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.page.html',
  styleUrls: ['./password-recovery.page.scss'],
})
export class PasswordRecoveryPage implements OnInit {
  passwordRecoveryForm!: FormGroup;
  passwordInputType: string = 'password';

  requirements: Requirements = {
    length: false,
    uppercase: false,
    number: false,
    special: false,
  };

  passwordMatchError: boolean = false;

  constructor(
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.passwordRecoveryForm = this.formBuilder.group(
      {
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            CustomEmailValidators.emailValidator,
          ],
        ],
        recoveryCode: ['', Validators.required],
        newPassword: [
          '',
          [Validators.required, CustomPasswordValidators.passwordValidator],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validator: CustomPasswordValidators.matchPassword,
      }
    );

    this.passwordRecoveryForm
      .get('newPassword')
      ?.valueChanges.subscribe((password: string) => {
        this.validatePassword(password);
      });

    this.passwordRecoveryForm
      .get('confirmPassword')
      ?.valueChanges.subscribe(() => {
        this.validateConfirmPassword();
      });
  }

  validatePassword(password: string) {
    this.requirements.length = password.length >= 10;
    this.requirements.uppercase = /[A-Z]/.test(password);
    this.requirements.number = /\d/.test(password);
    this.requirements.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  validateConfirmPassword(): void {
    const newPassword = this.passwordRecoveryForm.get('newPassword')?.value;
    const confirmPassword = this.passwordRecoveryForm.get('confirmPassword')?.value;

    this.passwordMatchError = newPassword !== confirmPassword;
  }

  async onSubmit() {
    if (this.passwordRecoveryForm.valid) {
      const { email, recoveryCode, newPassword } =
        this.passwordRecoveryForm.value;

      try {
        const userExists = await this.authService.checkUserExists(
          email.toLowerCase()
        );

        if (userExists) {
          const userRecoveryCode =
            await this.authService.getRecoveryCodeByEmail(email.toLowerCase());

          if (userRecoveryCode === recoveryCode) {
            await this.authService.updatePassword(email, newPassword);

            const alert = await this.alertCtrl.create({
              header: 'Éxito',
              message: 'La contraseña ha sido restablecida correctamente.',
              buttons: ['OK'],
            });
            await alert.present();

            this.navCtrl.navigateRoot('/login');
          } else {
            const alert = await this.alertCtrl.create({
              header: 'Error',
              message: 'El código de recuperación no es válido.',
              buttons: ['OK'],
            });
            await alert.present();
          }
        } else {
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'No se encontró ningún usuario con ese correo.',
            buttons: ['OK'],
          });
          await alert.present();
        }
      } catch (error) {
        console.error('Error al recuperar la contraseña', error);

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message:
            'Ocurrió un error al restablecer la contraseña. Por favor, intenta más tarde.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Por favor, revisa los campos e intenta de nuevo.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  togglePasswordVisibility() {
    this.passwordInputType =
      this.passwordInputType === 'password' ? 'text' : 'password';
  }

  goToHome() {
    this.navCtrl.navigateRoot('/');
  }
}
