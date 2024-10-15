import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomPasswordValidators {
  // Validador principal para verificar los criterios de seguridad de la contraseña
  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValidLength = password.length >= 10 && password.length <= 50;

    const valid =
      hasUpperCase && hasLowerCase && hasNumeric && hasSpecial && isValidLength;

    if (!valid) {
      let errorMessage = 'La contraseña debe contener: ';
      if (!hasUpperCase) errorMessage += 'una mayúscula, ';
      if (!hasLowerCase) errorMessage += 'una minúscula, ';
      if (!hasNumeric) errorMessage += 'un número, ';
      if (!hasSpecial) errorMessage += 'un carácter especial, ';
      if (!isValidLength)
        errorMessage += 'y debe tener entre 8 y 20 caracteres.';

      return { invalidPassword: errorMessage };
    }
    return null;
  }

  // Validador para comparar contraseña y confirmación
  static matchPassword(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsDontMatch: 'Las contraseñas no coinciden.' };
    }
    return null;
  }
}
