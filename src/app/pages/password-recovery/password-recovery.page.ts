import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service'; 

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.page.html',
  styleUrls: ['./password-recovery.page.scss'],
})
export class PasswordRecoveryPage implements OnInit {
  email: string = '';
  emailError: string = '';
  recoveryCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  requirements = {
    length: 0,
    uppercase: false,
    number: false,
    special: false,
  };
  passwordInputType: string = 'password';
  passwordMatchError: boolean = false;

  constructor(
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private userService: UserService 
  ) {}

  ngOnInit() {}

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
  
    const user = this.userService.getUserByEmail(this.email.toLowerCase());
    console.log(user?.codigoRecuperacion, user?.email);
    if (!user || !user.codigoRecuperacion) {
      this.emailError = 'Este correo no tiene un código de recuperación asociado.';
    }
  }

  validatePassword(password: string) {
    this.requirements.length = password.length;
    this.requirements.uppercase = /[A-Z]/.test(password);
    this.requirements.number = /\d/.test(password);
    this.requirements.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  validateConfirmPassword(confirmPassword: string) {
    this.passwordMatchError = this.newPassword !== confirmPassword;
  }

  async onSubmit() {
    if (!this.emailError && !this.passwordMatchError && this.newPassword) {
      const email = this.email.toLowerCase();
      const user = this.userService.getUserByEmail(email);

      if (user && user.codigoRecuperacion === this.recoveryCode) {
        // Actualizar la contraseña si el código de recuperación es correcto
        this.userService.updatePassword(user, this.newPassword);

        const alert = await this.alertCtrl.create({
          header: 'Éxito',
          message: 'La contraseña ha sido restablecida correctamente.',
          buttons: ['OK'],
        });
        await alert.present();
      } else {
        // Si el código de recuperación es incorrecto
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'El código de recuperación no es válido para este correo.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Por favor, revisa los campos y asegúrate de que todo es correcto.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  togglePasswordVisibility() {
    this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
  }

  goToHome() {
    this.navCtrl.navigateRoot('/');
  }
}
