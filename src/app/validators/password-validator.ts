import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomPasswordValidators {
  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?¡¿":+{}|<>]/.test(password);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

    if (!valid) {
      return { invalidPassword: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.' };
    }
    return null;
  }

  
  static matchPassword(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsDontMatch: 'Las contraseñas no coinciden.' };
    }
    return null;
  }
}
