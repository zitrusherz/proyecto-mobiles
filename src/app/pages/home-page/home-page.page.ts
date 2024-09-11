import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.page.html',
  styleUrls: ['./home-page.page.scss'],
})
export class HomePagePage implements OnInit {
  usuario: any;
  constructor(private navCtrl: NavController, private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit() {
    
    this.route.queryParams.subscribe(params => {
      if (params && params['nombre']) {
        this.usuario = {
          nombre: params['nombre'],
          primerApellido: params['primerApellido'],
          segundoApellido: params['segundoApellido'],
          email: params['email'],
          rol: this.getRolFromEmail(params['email'])
        };
        
      }
    });
  }

  getRolFromEmail(email: string): string {
    if (email.endsWith('@profesor.duoc.cl')) {
      return 'profesor';
    } else if (email.endsWith('@duocuc.cl')) {
      return 'estudiante';
    }
    return 'usuario';
  }
}

