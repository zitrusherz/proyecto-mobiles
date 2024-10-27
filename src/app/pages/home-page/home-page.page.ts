import {Component, OnInit} from '@angular/core';
import {NavController} from '@ionic/angular';
import {UserService} from 'src/app/services/user.service';
import {User} from 'src/app/interface/user';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.page.html',
  styleUrls: ['./home-page.page.scss'],
})
export class HomePagePage implements OnInit {
  usuario: User | null = null;
  userSubscription!: Subscription;

  constructor(
    private navCtrl: NavController,
    private userService: UserService
  ) {}

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
      // Suscribimos al Observable para cargar los detalles del usuario
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

  getRoleFromEmail(email: string): string {
    if (email.endsWith('@profesor.duoc.cl')) {
      return 'profesor';
    } else if (email.endsWith('@duocuc.cl')) {
      return 'estudiante';
    }
    return 'usuario';
  }
}
