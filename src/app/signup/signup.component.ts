import { Component, OnInit,OnDestroy } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CreditCardValidators } from 'angular-cc-library';
import { UserService } from '../shared/services/user.service';
import { FirebaseService } from '../shared/services/firebase.service'
import { Router } from '@angular/router';
import { NgxUiLoaderService } from "ngx-ui-loader";
import firebase from 'firebase/app';
import 'firebase/auth';
import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';
import { NgxOtpInputConfig } from 'ngx-otp-input';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
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
        animate('200ms ease-in', style({ transform: 'translateX(0%)', 'opacity': 1 }))
      ]),
      
      transition(':leave', [
        style({ transform: 'translateX(0%)', opacity: 1 }),
        animate('0ms ease-in', style({ transform: 'translateX(100%)', 'opacity': 0 }))
      ])
    ])
  ]
})
export class SignupComponent implements OnInit,OnDestroy {

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

  error :string ; success :string;
  signupForm: FormGroup;
  signSubmit :boolean =false;
  ccSubmit : boolean =false
  creditCardForm : FormGroup;
  redirected :boolean =false ;
  steps:number ;
  updated_price : string ;
  ShowThankyouScreen : boolean = false;
  // variables required for firebase otp
  windowRef: any;
  recaptchaVerifier : any;
  firebaseToken : string ; 
  //
  //variables for int number 
  separateDialCode = true;
	SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.India];
  ////end

  //to Display otp input
  showOTP : boolean = false; //this should false when init
  showResendOTP: boolean = false // to show resend otp button -- should be false when init

   //for otp timer
   countDown: Subscription;
   counter = 120;
   tick = 1000;

  constructor(private userService : UserService, private ngxloader : NgxUiLoaderService,
    private router: Router,private firebaseService :FirebaseService) {
    this.initSignUpForm();
    //this.initSignUpFormWithValues();
        //this is for preserve steps=2 when redirect to url = /sigup when step=2
        this.userService.isRedirected$.subscribe(data=>{
          this.redirected = data;
          this.steps = this.redirected ? 2 :1 ;
        });
        this.userService.firebaseToken$.subscribe(data=>{
          console.log(data,"---------");
          this.firebaseToken = data;
        })
        this.userService.signupFormData$.subscribe((data)=>{
          if(Object.keys(data).length>0){
            console.log(data,"---------");
            let formData={
            first_name : data.first_name,
            last_name : data.last_name,
            email_id : data.email_id,
            phone_number : data.phone_number,
            password : data.password,
            referral_code : data.referral_code,
            acceptTermsAndConditions : data.acceptTermsAndConditions
            }
            //if it is redirect from another page then set datat from user service
            this.signupForm.setValue(formData);
          }
        })
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.withoutCaptha(); 
    });  
  }

  get f(){
    return this.signupForm.controls;
  }

  get ccf(){
    return this.creditCardForm.controls;
  }

  initSignUpFormWithValues(){
    this.signupForm = new FormGroup({
      first_name : new FormControl('Anuj' , [ Validators.required ]),
      last_name : new FormControl('T' , [ Validators.required ]),
      email_id : new FormControl('anuj@zap' , [ Validators.required ]),
      phone_number : new FormControl('+16505551234', [Validators.required]),
      password : new FormControl('' , [ Validators.required ]),
      referral_code : new FormControl('' , []),
    });

    this.creditCardForm = new FormGroup({
      card_holder_name : new FormControl('Nikhil Gandhi', Validators.required),
      card_number: new FormControl('4242424242424242', [Validators.required,CreditCardValidators.validateCCNumber]),
      exp_month : new FormControl('08', [Validators.required]),
      exp_year : new FormControl('2026', [Validators.required]),
      cvv: new FormControl('426', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
      postal_code: new FormControl('58962',[Validators.required])
    });

  }

  initSignUpForm(){
    this.signupForm = new FormGroup({
      first_name : new FormControl('' , [ Validators.required ]),
      last_name : new FormControl('' , [ Validators.required ]),
      email_id : new FormControl('' , [ Validators.required, Validators.email ]),
      phone_number : new FormControl('', [Validators.required]),
      password : new FormControl('' , [ Validators.required ]),
      referral_code : new FormControl('' , []),
      acceptTermsAndConditions : new FormControl(false , [Validators.requiredTrue]),
    });

    this.creditCardForm = new FormGroup({
      card_holder_name : new FormControl('', Validators.required),
      card_number: new FormControl('', [Validators.required,CreditCardValidators.validateCCNumber]),
      exp_month : new FormControl('', [Validators.required]),
      exp_year : new FormControl('', [Validators.required]),
      cvv: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
      postal_code: new FormControl('',[Validators.required])
    });

  }


  verifyUserSubscription(){
    this.clearInfoMessages();
    let phone = this.signupForm.get('phone_number').value;
    if(phone){
      let data = {
        phone_number : this.removePlusFromstring(phone.e164Number)
      }
      this.userService.validateUserSubscription(data).subscribe(resp =>{
        //console.log("verify user resp", resp);
        if ( resp.status === 'success') {
          this.error= "This number is already registered";
        } else { 
          this.sendOtp();
        }
      });
    }else{
      this.error = "Please enter phone number";
    }
    
  }

  //firebase otp code here

  sendOtp() {
    
    this.error = null;
    this.success = null;
    let phone = this.signupForm.get('phone_number').value;
    if(phone){
      this.ngxloader.start();
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
              this.showOTP = true;
              this.startOTPTimer();
              this.windowRef.confirmationResult = result;
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
    }else{
      this.error = "Please enter phone number";
    }
    
  }

  verifyLoginCode() {
    this.clearInfoMessages();
    if(this.signupForm.get('password').value){
      if(this.windowRef?.confirmationResult){
        this.ngxloader.start();
        this.windowRef.confirmationResult
        .confirm(this.signupForm.get('password').value)
        .then( result => { 
          //console.log(result);
          let obj = this;
          result.user.getIdToken(true).then(function (idToken) {
            obj.firebaseToken = idToken;
            obj.ngxloader.stop();
            obj.steps = 2;
            console.log(idToken);
            //store this token in userservice brcause it is required in step 3 and if page is redirected from other page then it's value is undefiend so set it in service
            obj.userService.firebaseToken$.next(idToken);
          });
        })
        .catch( error => {
          this.ngxloader.stop();
          this.error = "Incorrect code entered"
          console.log(error, "Incorrect code entered?")
        });
      }else{
        this.error = "Please enter valid OTP, You can get OTP by pressing 'Get OTP' button"
      }
    }else{
      this.error = "Please Enter OTP"
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

    //console.log(this.recaptchaVerifier,"kadsdnasdn")
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

  nextStep(){
    if(this.updated_price == '0'){
      this.byPassPayment();
    }else{
      this.steps = 3;
    }
  }

  previousStep(){
    this.clearInfoMessages();
    this.showOTP = false;
    this.steps = 1;
  }

  clearInfoMessages(){
    this.error = null;
    this.success = null;
  }

  onNext(){
    this.signSubmit = true;
    console.log(this.signupForm)
    this.clearInfoMessages();
    if(this.signupForm.valid){
      if(this.signupForm.get('referral_code').value){
        this.validateReferalCode();
      }else{
        //this.verifyLoginCode();
        this.nextStep();
      }
    }else{
      this.error = "Please fill up all the required fields with valid details"
    }
  }

  validateReferalCode(){
    // Call validate referal API here
    let data = {
      "referral_code" : this.signupForm.get('referral_code').value
    } 
    //console.log(data);
    this.userService.validateReferralCode(data).subscribe(resp => {
      //console.log(resp);
      if ( resp.status === 'success') {
          this.updated_price = resp.data.updated_price;
          this.nextStep();
      } else {
        this.error=resp.message;
      }
    });
  }

  byPassPayment(){
    this.ngxloader.start();
    this.clearInfoMessages();
    if(this.signupForm.get('phone_number').value?.e164Number){
      let phoneNumber = this.signupForm.get('phone_number').value.e164Number;
      this.signupForm.get('phone_number').patchValue(this.removePlusFromstring(phoneNumber));
    }
    let createUserData = {
      ...this.signupForm.value,
      firebase_token : this.firebaseToken
    }
    delete createUserData['password'];
    createUserData = this.filterEmptyFields(createUserData);
    console.log(createUserData, "<<<<<<<<<<<<<<<<<<<<<<<<");
    this.userService.createUser(createUserData).subscribe(res =>{
      if(res.status === 'success'){
        this.ngxloader.stop();
        console.log("User created successfully");
        //this.router.navigate(['/login']);
        this.showThankyou();
        this.userService.signupFormData$.next(
          {
            first_name: '',
            last_name: '',
            email_id: '',
            phone_number: {},
            password: '',
            referral_code: '',
            acceptTermsAndConditions: false
        }
      );
      this.userService.firebaseToken$.next('');
      }else{
        this.ngxloader.stop();
        this.error = res.message;
      }
    });
  }

  removeSpaceBetween(value){
    return value.toString().replace(/\s/g, "");
  }

  createUser(){ 
    this.ccSubmit =true
    this.clearInfoMessages();
    //console.log(this.creditCardForm.value);
    if(this.creditCardForm.valid){
      this.ngxloader.start();
      let unformattedCardNumber =  this.creditCardForm.get('card_number').value;
      this.creditCardForm.get('card_number').setValue(this.removeSpaceBetween(unformattedCardNumber));
      if(this.signupForm.get('phone_number').value?.e164Number){
        let phoneNumber = this.signupForm.get('phone_number').value.e164Number;
        this.signupForm.get('phone_number').patchValue(this.removePlusFromstring(phoneNumber));
      }
      let createUserData = {
        ...this.signupForm.value,
        ...this.creditCardForm.value,
        firebase_token : this.firebaseToken
      }
      delete createUserData['password']
      
      createUserData = this.filterEmptyFields(createUserData);
      //console.log(createUserData, "<<<<<<<<<<<<<<<<<<<<<<<<");
      this.userService.createUser(createUserData).subscribe(res =>{
          if(res.status === 'success'){
            this.ngxloader.stop();
            console.log("User created successfully");
            //this.router.navigate(['/login']);
            this.showThankyou();
            this.userService.signupFormData$.next(
              {
                first_name: '',
                last_name: '',
                email_id: '',
                phone_number: {},
                password: '',
                referral_code: '',
                acceptTermsAndConditions: false
            }
          );
          this.userService.firebaseToken$.next('');            
          }else{
            this.ngxloader.stop();
            this.error = res.message;
          }
      });
    }else{
      console.log(this.creditCardForm);
      this.error = "Please fill up all the required fields with valid details"
    }
  }

  removePlusFromstring(phoneNumber){
    return phoneNumber.split('+').join('')
  }

  filterEmptyFields(data: any): any {    // Filter any fields that aren't empty & store in a new object - To be passed on the Pipe map's caller
    let fields = {};
    Object.keys(data).forEach(key =>  data[key] != '' ? fields[key] = data[key] : key);

    return fields;   
  }

  handeOtpChange(value: string[]): void {
    //console.log(value);
    value.forEach(input => {
      if(input == ''){
        this.signupForm.get('password').setValue(null);
      }
    });
  }

  handleFillEvent(value: string): void {
    //console.log("filled",value);
    this.signupForm.get('password').setValue(value);

    //for auto-login 
    // setTimeout(() => {
    //   this.verifyLoginCode();  
    // });
    
  }

  showThankyou(){
    this.ShowThankyouScreen = true;
  }

  resetOTPTimer(){
    this.showResendOTP = false;
    this.counter = 120
  }

  startOTPTimer(){
    this.resetOTPTimer();
    this.countDown = timer(0, this.tick).subscribe((count) => {
      if (count == 120) {
        //console.log('timer completed', count, this.counter);
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

  reload(){
    window.location.reload();
  }
  ngOnDestroy(): void {
    //pass data to user service to store signup data before destroy of his component 
    this.userService.signupFormData$.next(
        this.signupForm.value
    );
    //isRedirected$ value is true from privacy and service aggrement so set false when destroy the component
    this.userService.isRedirected$.next(false);
  }
}
