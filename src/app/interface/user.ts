export interface User {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido: string;
    email: string;
    password: string;
    role: string;
    recoveryCode: string;
  }