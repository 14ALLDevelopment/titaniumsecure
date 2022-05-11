import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { CommonHttpClient } from './common/common-http.service';
import { UserAuthService } from './auth/user-auth.service';
import { NgxUiLoaderService } from "ngx-ui-loader";
import { ToastrService } from 'ngx-toastr';
import { QBHelper } from '../helper/qbHelper';
import { UserChatService } from 'src/app/chat/dashboard/user/user.service';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  signUpFormType = {
    first_name: '',
    last_name: '',
    email_id: '',
    phone_number: {},
    password: '',
    referral_code: '',
    acceptTermsAndConditions: false
}
  constructor(
    private chttp: CommonHttpClient,
    private authService: UserAuthService,
    private router: Router,
    private ngxService: NgxUiLoaderService,
    private toastr: ToastrService,
    private qbHelper: QBHelper,
    private userChatService : UserChatService,
  ) {}
 
  // USER
    firebaseToken$ = new BehaviorSubject('');
    isRedirected$ = new BehaviorSubject(false);
    signupFormData$ =  new BehaviorSubject(this.signUpFormType);
    Login = data => {
      this.ngxService.start();
      return this.chttp.post('user/login', data, false).pipe(
          tap((res: any) => {
            this.ngxService.stop();
              if (res.status === 'success') {
                  this.authService.storeUser(res.data);
              } else {
                this.router.navigate(['/login']);
              }
          })
      );
    }

    logout = () => {
      return this.chttp
          .post('user/logout', {}, false)
          .pipe(
              tap((res: any) => {
                  if (res.status === 'success') {
                      this.authService.removeUser();
                      this.userChatService.removeUser();
                      this.qbHelper.qbLogout();
                      this.router.navigate(['/login']);
                  }
              })
          )
          .subscribe();
    }

    validateReferralCode = (data) => {
      return this.chttp
          .post('validate-referral-code', data, false);
    }

    validateUserSubscription = (data) =>{
      return this.chttp
          .post('user/validate-subscription', data, false).pipe(
            tap((res: any) => {
                if (res.status === 'success') {
                    this.authService.storeUser(res.data);
                }
            })
          );
    }

    createUser = (data) =>{
      return this.chttp
          .post('user/create', data, false);
    }

    contactUs = (data) =>{
      return this.chttp
            .post('contact-us' , data,true);
    }


    //subscription related


    getSubscriptionDetails = () => {
      return this.chttp
          .get('subscription', false);
    }

    getsubscriptionHistory = () =>{
      return this.chttp
          .get('subscription/history', false);
    }

    cancelSubscription = (data) =>{
      return this.chttp
            .post('subscription/cancel', data, true);
    }


    showToastr(type, msg, title) {
      this.toastr[type](msg, title, {
          progressBar: true,
          progressAnimation: 'increasing',
          timeOut: 2000,
          positionClass: 'toast-bottom-right',
      });
    }
    
}
