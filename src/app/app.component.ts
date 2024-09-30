import { Component, OnInit } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { SqliteService } from './services/sqlite.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public isWeb: boolean;
  public load: boolean;
  form!: FormGroup;
  submitted = false;

  constructor(private platform: Platform, private sqlite: SqliteService, private formBuilder: FormBuilder) {
    this.isWeb = false;
    this.load = false; 
    this.initApp();
  }

  initApp() {
    this.platform.ready().then( async () =>{
      const info = await Device.getInfo();
      this.isWeb = info.platform === 'web';

      
      this.sqlite.init();
      this.sqlite.dbReady.subscribe(load => {
        this.load = load;
      })
    });
  }

  get formFields(){
    return this.form.controls;
  }

  onReset() {
    this.submitted = false;
    this.form.reset();
}

}
