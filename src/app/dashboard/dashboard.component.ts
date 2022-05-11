import { Component, OnInit } from '@angular/core';
import { UserService } from '../shared/services/user.service';
import { UserAuthService } from '../shared/services/auth/user-auth.service'
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  user :any;
  subscriptionDetails :any;
  apiCalled :boolean =false;
  showNoData :boolean = false;
  constructor(private userService : UserService, private userAuth : UserAuthService,private _location: Location,
    private ngxloader : NgxUiLoaderService,private router: Router) { 
    this.user = this.userAuth.getStoredUser();
    console.log("User", this.user);
    this.getSubscriptionDetails();
  }

  ngOnInit(): void {
  }

  getSubscriptionDetails(){
    this.ngxloader.start();
    this.userService.getSubscriptionDetails().subscribe(resp => {
      console.log(resp);
      if(resp.status == 'success'){
        this.showNoData = false;
        this.subscriptionDetails = resp.data
      }else{
        this.showNoData = true;
      }
      this.apiCalled =true;
      this.ngxloader.stop();
    },error => {
      this.showNoData = true;
      this.apiCalled = true;
      this.ngxloader.stop();
    })
  }

  logOut(){
    this.userService.logout();
  }

  backClicked() {
    // if(this.router.navigated){
    //   this._location.back();
    // }else{
      this.router.navigate(['/chat']);
   // }
    
  }


}
