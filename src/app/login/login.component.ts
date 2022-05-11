import { Component, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../shared/services/user.service';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/auth';
import {environment} from '../../environments/environment'
import { NgxUiLoaderService } from "ngx-ui-loader";
import { FirebaseService } from '../shared/services/firebase.service';
import { UserAuthService } from '../shared/services/auth/user-auth.service'
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';
import { NgxOtpInputConfig } from 'ngx-otp-input';
import { UserChatService } from '../chat/dashboard/user/user.service';
import { Subscription, timer } from 'rxjs';



declare var QB: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger(
      'slideView',
      [
        state('true', style({ transform: 'translateX(100%)', opacity: 0 })),
        state('false', style({ transform: 'translateX(0)', opacity: 1 })),
        transition('0 => 1', animate('500ms', style({ transform: 'translateX(0)', 'opacity': 1 }))),
        transition('1 => 1', animate('500ms', style({ transform: 'translateX(100%)', 'opacity': 0 }))),
      ]),

    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-in', style({ transform: 'translateX(0%)', 'opacity': 1 }))
      ]),
      
      transition(':leave', [
        style({ transform: 'translateX(0%)', opacity: 1 }),
        animate('0ms ease-in', style({ transform: 'translateX(100%)', 'opacity': 0 }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {

  otpInputConfig: NgxOtpInputConfig = {
    otpLength: 6,
    autofocus: true,
    classList: {
      inputBox: "my-super-box-class",
      input: "my-super-class",
      inputFilled: "my-super-filled-class",
      inputDisabled: "my-super-disable-class",
      inputSuccess: "my-super-success-class",
      inputError: "my-super-error-class"
    }
  };
  
  error : string ;
  success : string;
  loginForm: FormGroup;
  //to show/hide Password
  show : boolean = false
  //To show otp screen
  showOTP :boolean =false;
  // variables required for firebase otp
  windowRef: any;
  recaptchaVerifier : any;
  firebaseToken : string ; 
  verificationConfirmation:any;
  ///
  //variables for int number 
  separateDialCode = true;
	SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.India];
  ////end

  //for otp timer
  countDown: Subscription;
  counter = 120;
  tick = 1000;
  ////
  showResendOTP: boolean = false // to show resend otp button

  constructor(private userService : UserService,private ngxloader : NgxUiLoaderService,
     private auth :UserAuthService, private userChatService : UserChatService,
     private router : Router, private firebaseService :FirebaseService) { 
    this.initLoginForm();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.withoutCaptha(); 
    });
  }

  get f(){
    return this.loginForm.controls;
  }

  QBSession(){
    QB.createSession(function(error, result) {
      // callback function
      if(result){
        console.log("session",result);
        window.localStorage.setItem('sessionResponse',JSON.stringify(result))
      }
      if(error){
        console.log("QBSeesioncreate erro", error)
      }
    });
  }

  showPassword() {
    this.show = !this.show;
  }

  initLoginForm(){
    this.loginForm = new FormGroup({
      phone_number : new FormControl('' , [ Validators.required ]),
      password : new FormControl('' , [ Validators.required ])
    });
  }

  login() {
    if (this.loginForm.valid) {
        this.userService.Login(this.loginForm.value).subscribe(resp => {
            //console.log(resp);
            if ( resp.status === 'success') {
                this.router.navigate(['/dashboard']);
            } else {
                this.error=resp.message;
            }
        });
    }
  }

  verifyUserSubscription(){
    this.error = null;
    this.success = null;
    let phone = this.loginForm.get('phone_number').value;
    //console.log("phone",phone);
    if(phone){
      let data = {
        phone_number : this.removePlusFromstring(phone.e164Number)
      }
      this.userService.validateUserSubscription(data).subscribe(resp =>{
        //console.log("verify user resp", resp);
        if ( resp.status === 'success') {
            this.sendOtp();
        } else {
            this.error=resp.message;
        }
      });
    }else{
      this.error = "Please enter phone number";
    }
    
  }

   //firebase otp code here

   sendOtp() {
    this.ngxloader.start();
    let phone = this.loginForm.get('phone_number').value;
    let appVerifier;
    if(this.recaptchaVerifier){
      appVerifier = this.recaptchaVerifier;
    }else{
      appVerifier = this.windowRef.recaptchaVerifier;
    }
    //console.log(appVerifier,"verified")
    firebase.auth()
      .signInWithPhoneNumber(phone.e164Number, appVerifier)
      .then(result => {
        //console.log(result);
        this.ngxloader.stop();
        this.success = "OTP sent successfully";
        this.verificationConfirmation = result;
        this.showOTP = true
        this.startOTPTimer();
        this.windowRef.confirmationResult = result
      })
      .catch( error => {
        this.ngxloader.stop();
        if(error.code === "auth/invalid-phone-number"){
          this.error =  "Invalid Phone number, Please add valid phone with country code";
        }else{
          this.error = error.message;
        }
        console.log('error', error) 
      });
  }

  verifyLoginCode() {
    if(this.loginForm.get('password').value){
      this.ngxloader.start();
      this.windowRef.confirmationResult
      .confirm(this.loginForm.get('password').value)
      .then( result => { 
        //console.log(result);
        this.ngxloader.start();
        let obj = this;
        result.user.getIdToken(true).then(function (idToken) {
          obj.firebaseToken = idToken;
          obj.QBLogin();
        });
      })
      .catch( error => {
        this.ngxloader.stop();
        this.error = "Incorrect code entered"
        console.log(error, "Incorrect code entered?")
      });   
    }else{
      this.error = "Please enter OTP ";
    }
  }

  withoutCaptha(){
    this.windowRef = this.firebaseService.windowRef;
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {

      },
      'expired-callback': () => {
      }
    });

    //console.log(this.recaptchaVerifier,"capcha")
  }

  withRecapcha(){
    this.windowRef = this.firebaseService.windowRef;
    this.windowRef.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container')
    this.windowRef.recaptchaVerifier
                  .render()
                  .then( widgetId => {
                    console.log(widgetId, "captcha")
                    this.windowRef.recaptchaWidgetId = widgetId
                  });
  }

  ////

  QBLogin(){
    this.ngxloader.stop();
    this.userChatService.loginQb(this.firebaseToken);
  }

  handeOtpChange(value: string[]): void {
    //console.log(value);
    value.forEach(input => {
      if(input == ''){
        this.loginForm.get('password').setValue(null);
      }
    });
  }

  handleFillEvent(value: string): void {
    //console.log("filled",value);
    this.loginForm.get('password').setValue(value);

    //auto verfiy when otp is filled
    //this.verifyLoginCode();
  }

  removePlusFromstring(phoneNumber){
    return phoneNumber.split('+').join('')
  }

  resetOTPTimer(){
    this.showResendOTP = false;
    this.counter = 120
  }

  startOTPTimer(){
    this.resetOTPTimer();
    this.countDown = timer(0, this.tick).subscribe((count) => {
      if (count == 120) {
        console.log('timer completed', count, this.counter);
        //show resent otp button
        this.showResendOTP = true; 
        if (this.countDown) {
          this.countDown.unsubscribe();
        }
      }
      --this.counter;
    });
  }

  goTOHome(){
    this.router.navigate(['/'])
  }

  formStepPrev(){
    this.showOTP = false;
  }

  ngOnDestroy() {
    if(this.countDown){
      this.countDown.unsubscribe();
    }
  }

}
