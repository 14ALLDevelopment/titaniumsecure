import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component' 
import { DashboardComponent } from './dashboard/dashboard.component'
import { SubscriptionHistoryComponent } from  './subscription-history/subscription-history.component'
import { SubscriptionCancelComponent } from  './subscription-cancel/subscription-cancel.component'
import { ServerErrorComponent } from './server-error/server-error.component'
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component'
//auth guards
import { FrontAntiAuthGuard } from './shared/services/auth/front-anti-auth.guard';
import { FrontAuthGuard } from  './shared/services/auth/front-auth.guard'
import { ServiceAggrementComponent } from './service-aggrement/service-aggrement.component';

const routes: Routes = [
  {path: '', component: HomeComponent, pathMatch: 'full',},
  {path: 'login', component: LoginComponent, pathMatch: 'full', canActivate:[FrontAntiAuthGuard]},
  {path: 'signup', component: SignupComponent, pathMatch: 'full', canActivate:[FrontAntiAuthGuard]},
  {path: 'dashboard', component: DashboardComponent, pathMatch: 'full', canActivate:[FrontAuthGuard]},
  {path: 'subscription-history', component: SubscriptionHistoryComponent, pathMatch: 'full', canActivate:[FrontAuthGuard]},
  {path: 'subscription-cancel', component: SubscriptionCancelComponent, pathMatch: 'full', canActivate:[FrontAuthGuard]},
  {path: 'privacy-policy', component: PrivacyPolicyComponent, pathMatch: 'full'},
  {path: 'server-error', component: ServerErrorComponent, pathMatch: 'full'},
  {path: 'service-aggrement', component: ServiceAggrementComponent, pathMatch: 'full'},
  {path: 'chat', loadChildren:()=>import("./chat/chat.module").then(m=>m.ChatModule)},
  {path: '**', redirectTo: '', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes,  {
    scrollPositionRestoration: 'enabled', // Add options right here
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
