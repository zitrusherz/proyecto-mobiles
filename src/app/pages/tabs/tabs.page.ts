import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage implements OnInit, OnDestroy {
  isTab2Enabled: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.subscription.add(
      this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
        this.isTab2Enabled = isAuthenticated;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Asegura limpiar la suscripción
  }
}
