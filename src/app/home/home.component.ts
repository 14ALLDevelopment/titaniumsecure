import { Component, HostListener, OnInit } from '@angular/core';
import * as AOS from 'aos'
import { UserAuthService } from '../shared/services/auth/user-auth.service'
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  user:any;QBuser:any;
  constructor(private userService : UserService,private userAuth : UserAuthService) {
    setTimeout(() => {AOS.refresh();}, 500);
    this.user = this.userAuth.getStoredUser();
    this.QBuser = this.userAuth.getStoredQBUser();
    if(this.QBuser && this.QBuser.custom_data){
      this.QBuser.custom_data = JSON.parse(this.QBuser.custom_data);
      if(this.QBuser.custom_data.ProfilePublicUrl){
        const url = this.QBuser.custom_data.ProfilePublicUrl.split('.').slice(0, -1).join('.');
        this.QBuser.custom_data.ProfilePublicUrl = url
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (document.body.scrollTop > 1 ||     
    document.documentElement.scrollTop > 1) {
      document.body.classList.add('show-video-bg');
    }else{
      document.body.classList.remove('show-video-bg');
    }
  }

  ngOnInit(): void {}

   // TODO: Cross browsing
   gotoTop() {
    window.scroll({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth' 
    });
  }

  logOut(){
    this.userService.logout();
  }

}
