import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonicCommonComponents } from '../components/ionic-common-components';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';
import {  person, qrCodeOutline, informationCircleOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicCommonComponents],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  isAuthenticated: boolean = false; // Estado de autenticación
  isqrEnabled: boolean = true; // Habilitar o deshabilitar la pestaña QR

  constructor(private authService: AuthService) {
    addIcons({ ...icons });
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;
      this.isqrEnabled = isAuthenticated;
    });
  }
}
