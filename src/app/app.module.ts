import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module'
//components
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ToastrModule } from 'ngx-toastr';
import { NgxUiLoaderModule, NgxUiLoaderConfig, NgxUiLoaderService } from 'ngx-ui-loader';

import { CommonHttpClient } from './shared/services/common/common-http.service';
import { UserService } from './shared/services/user.service';
import { FirebaseService } from './shared/services/firebase.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CreditCardDirectivesModule } from 'angular-cc-library';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServerErrorComponent } from './server-error/server-error.component';


import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { NgxOtpInputModule } from 'ngx-otp-input';
import { SubscriptionHistoryComponent } from './subscription-history/subscription-history.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { UserChatService } from './chat/dashboard/user/user.service';
import { ChatModule } from './chat/chat.module';
import { SubscriptionCancelComponent } from './subscription-cancel/subscription-cancel.component';
import { ServiceAggrementComponent } from './service-aggrement/service-aggrement.component';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  'bgsOpacity': 0.5,
  'bgsPosition': 'bottom-right',
  'bgsSize': 60,
  'bgsType': 'ball-spin-clockwise',
  'blur': 11,
  'fgsPosition': 'center-center',
  'fgsSize': 70,
  'fgsColor': '#ffffff',
  'fgsType': 'square-jelly-box',
  'gap': 24,
  'logoPosition': 'center-center',
  'logoSize': 120,
  'logoUrl': '',
  'masterLoaderId': 'master',
  'overlayBorderRadius': '0',
  'overlayColor': 'rgba(40, 40, 40, 0.8)',
  'pbDirection': 'ltr',
  'pbThickness': 3,
  'hasProgressBar': true,
  'text': '',
  'textPosition': 'center-center',
};

const ngxToastrConfig = {

  maxOpened: 5,
  autoDismiss: true,
  positionClass: 'toast-bottom-right',
  preventDuplicates: true,

}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    SignupComponent,
    DashboardComponent,
    ServerErrorComponent,
    SubscriptionHistoryComponent,
    PrivacyPolicyComponent,
    SubscriptionCancelComponent,
    ServiceAggrementComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    CreditCardDirectivesModule,
    ToastrModule.forRoot(ngxToastrConfig),
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    AngularFireModule,
    AngularFireAuthModule,
    NgxIntlTelInputModule,
    NgxOtpInputModule,
    ChatModule,
  ],
  providers: [CommonHttpClient, UserService, FirebaseService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
