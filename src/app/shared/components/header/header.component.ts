import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UserChatService } from 'src/app/chat/dashboard/user/user.service';
import { UserAuthService } from '../../services/auth/user-auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() headerTitle = '';
  user:any;QBuser:any;
  currentUrl:any;
  constructor(private userService : UserService, private userChatService : UserChatService, private userAuth : UserAuthService, private router: Router) { 
    this.userChatService.proFileUpdateEvent.subscribe((updatedUser: Object) => {
      this.getUsers();
    });
    this.getUsers();
  }

  ngOnInit(): void {
  }

  getLoggedInUser(){
    this.QBuser = this.userChatService.user;
    if(this.QBuser &&  this.QBuser.custom_data){
      try {
        this.QBuser.custom_data = JSON.parse(this.QBuser.custom_data);
      } catch (e) {}
      // if(this.QBuser.custom_data.ProfilePublicUrl){
      //   const url = this.QBuser.custom_data.ProfilePublicUrl.split('.').slice(0, -1).join('.');
      //   this.QBuser.custom_data.ProfilePublicUrl = url
      // }
    }
    //console.log('Logged In === ', this.QBuser);
  }

  getUsers(){
    this.user = this.userAuth.getStoredUser();
    this.getLoggedInUser();
    // this.QBuser = this.userAuth.getStoredQBUser();
    // if(this.QBuser && this.QBuser.custom_data){
    //   this.QBuser.custom_data = JSON.parse(this.QBuser.custom_data);
    //   if(this.QBuser.custom_data.ProfilePublicUrl){
    //     const url = this.QBuser.custom_data.ProfilePublicUrl.split('.').slice(0, -1).join('.');
    //     this.QBuser.custom_data.ProfilePublicUrl = url
    //   }
    // }
  }

  logOut(){
    this.userService.logout();
  }

  goToHome(){
    this.router.navigate(['/'])
  }


}
