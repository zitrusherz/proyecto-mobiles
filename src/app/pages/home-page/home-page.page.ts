import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.page.html',
  styleUrls: ['./home-page.page.scss'],
})
export class HomePagePage implements OnInit {
  usuario: any;
  constructor(private navCtrl: NavController, private route: ActivatedRoute,private sqliteService: SqliteService,
    private authService: AuthService ) {}

  ngOnInit() {
    
    this.loadUserData();
  }

  async loadUserData() {
    try {
      
      if (this.sqliteService.dbReady.getValue()) {
        
        const email = await this.authService.isAuthenticated$.toPromise();

        
        const query = `SELECT primerNombre, segundoNombre, primerApellido, segundoApellido, email FROM users WHERE email = ?`;
        const result = await this.sqliteService.getDbConnection()?.query(query, [email]);

        if (result && result.values && result.values.length > 0) {
          const userData = result.values[0];
          this.usuario = {
            nombre: userData.primerNombre,
            segundoNombre: userData.segundoNombre,
            primerApellido: userData.primerApellido,
            segundoApellido: userData.segundoApellido,
            email: userData.email,
            rol: this.getRolFromEmail(userData.email)
          };
        } else {
          console.error('No se encontró el usuario en la base de datos.');
        }
      } else {
        console.error('Base de datos no está lista.');
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
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

