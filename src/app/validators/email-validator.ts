import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomEmailValidators {
    static emailValidator(control: AbstractControl): ValidationErrors | null {
      const email = control.value;
      const profesorRegex = /^[a-z]{2}\.[a-z]+@profesor\.duoc\.cl$/;
      const alumnoRegex = /^[a-z]{2}\.[a-z]+@duocuc\.cl$/;
  
      if (!email) {
        return null;
      }
  
      if (profesorRegex.test(email) || alumnoRegex.test(email)) {
        return null; 
      }
  
      return { invalidEmail: 'El formato del correo no es válido.' };
    }
  }