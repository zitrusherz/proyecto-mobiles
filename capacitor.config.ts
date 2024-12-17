import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.RegistrAPP', // Identificador único de tu aplicación
  appName: 'RegistrAP', // Nombre visible de la app
  webDir: 'www/browser', 
  
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorSQLite: {
      webPort: 8080, 
    },
  },
};

export default config;
