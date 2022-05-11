import { Component, OnInit } from '@angular/core';
import { UserService } from '../shared/services/user.service'
import { UserAuthService } from '../shared/services/auth/user-auth.service'
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-subscription-history',
  templateUrl: './subscription-history.component.html',
  styleUrls: ['./subscription-history.component.css']
})
export class SubscriptionHistoryComponent implements OnInit {

  user :any;
  subHistory :any;
  showNoData :boolean =false;
  apiCalled :boolean =false;
  constructor(private userService : UserService , private userAuth : UserAuthService,
    private ngxloader : NgxUiLoaderService) {
    this.user = this.userAuth.getStoredUser();
    this.getSubscriptionHistory();
  }


  ngOnInit(): void {
  }

  getSubscriptionHistory(){
    this.ngxloader.start();
    this.userService.getsubscriptionHistory().subscribe(resp =>{
      console.log("sub history", resp);
      if(resp.status === 'success'){
        this.showNoData =false;
        this.subHistory = resp.data;
        if(this.subHistory.length === 0){
          this.showNoData = true;
        }
        //console.log(this.subHistory.length);
        this.apiCalled =true;
        this.ngxloader.stop();
      }else{
        this.showNoData = true;
      }
      this.apiCalled =true;
      this.ngxloader.stop();
    },error => {
      this.showNoData =true;
      this.apiCalled =true;
      this.ngxloader.stop();
    });
  }

  logOut(){
    this.userService.logout();
  }

}
