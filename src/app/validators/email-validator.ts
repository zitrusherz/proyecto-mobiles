import {AbstractControl, ValidationErrors} from '@angular/forms';

export class CustomEmailValidators {
  private static readonly profesorRegex =
    /^[a-z]{2}\.[a-z]+@profesor\.duoc\.cl$/;
  private static readonly alumnoRegex = /^[a-z]{2}\.[a-z]+@duocuc\.cl$/;

  private static readonly allowedDomains = [
    { domain: '@profesor.duoc.cl', type: 'profesor' },
    { domain: '@duocuc.cl', type: 'alumno' },
  ];

  static emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) {
      return null;
    }

    const isValidEmail =
      CustomEmailValidators.profesorRegex.test(email) ||
      CustomEmailValidators.alumnoRegex.test(email);

    return isValidEmail
      ? null
      : { invalidEmail: 'El formato del correo no es válido.' };
  }

  static isEmailType(
    control: AbstractControl,
    expectedType: string
  ): ValidationErrors | null {
    const email = control.value;
    if (!email) {
      return null;
    }

    const matchingDomain = CustomEmailValidators.allowedDomains.find(
      (domainInfo) => email.endsWith(domainInfo.domain)
    );

    if (matchingDomain && matchingDomain.type === expectedType) {
      return null;
    }

    return {
      invalidEmailType: `El correo no corresponde al tipo ${expectedType}.`,
    };
  }
}
