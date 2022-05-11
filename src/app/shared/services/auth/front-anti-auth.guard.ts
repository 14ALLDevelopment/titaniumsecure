import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserAuthService } from './user-auth.service';

@Injectable({
    providedIn: 'root'
})
export class FrontAntiAuthGuard implements CanActivate, CanActivateChild {
    constructor(private auth: UserAuthService, private router: Router) {}

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        const user = this.auth.getStoredUser();
        const QBuser = this.auth.getStoredQBUser();
        if (user && QBuser) {
            this.router.navigate(['/dashboard']);
            return false;
        } else {
            return true;
        }
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        // return this.canActivate(route, state);
        return this.canActivate(route, state);
    }
}
