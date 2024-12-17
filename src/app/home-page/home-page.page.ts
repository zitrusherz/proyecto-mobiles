import { IonicCommonComponents } from '../components/ionic-common-components';
import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController} from '@ionic/angular';
import {UserService} from 'src/app/services/user.service';
import {User} from 'src/app/interface/user';
import {Subscription} from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';


@Component({
  selector: 'home-page',
  templateUrl: 'home-page.page.html',
  styleUrls: ['home-page.page.scss'],
  standalone: true,
  imports: [IonicCommonComponents,
     ReactiveFormsModule, CommonModule]  ,
})
export class HomePage implements OnInit, OnDestroy {
  usuario: User = {
    role: '',
    primerNombre: '',
    primerApellido: '',
    segundoApellido: '',
    email: '',
    password: '',
    recoveryCode: ''
  }; 
  userSubscription!: Subscription;

  constructor(
    private navCtrl: NavController,
    private userService: UserService, 
    private authService: AuthService
  ) {

    addIcons({ ...icons });
  }

  ngOnInit() {
    this.loadUser();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async loadUser() {
    try {
      this.userSubscription = this.userService.getUser().subscribe(
        (user) => {
          if (user) {
            this.usuario = user;
            console.log('Usuario cargado correctamente:', this.usuario);
          } else {
            console.error('No se encontró un usuario registrado');
          }
        },
        (error) => {
          console.error('Error al cargar el usuario en HomePage:', error);
        }
      );
    } catch (error) {
      console.error('Error al cargar el usuario en HomePage:', error);
    }
  }

  logOutAction() {
    this.authService.logout()
    
  }

  getRoleFromEmail(email: string): string {
    if (email.endsWith('@profesor.duoc.cl')) {
      return 'profesor';
    } else if (email.endsWith('@duocuc.cl')) {
      return 'estudiante';
    }
    return 'usuario';
  }
}
