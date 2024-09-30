import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>; 
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated$']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    authGuard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should redirect to login if the user is not authenticated', (done: DoneFn) => {
    
    //authService.isAuthenticated$ = of(false); 

    authGuard.canActivate().subscribe(isAllowed => {
      expect(isAllowed).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login'] as const);  
      done();
    });
  });

  it('should allow access if the user is authenticated', (done: DoneFn) => {
    
    //authService.isAuthenticated$ = of(true); 

    authGuard.canActivate().subscribe(isAllowed => {
      expect(isAllowed).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled(); 
      done();
    });
  });
});
