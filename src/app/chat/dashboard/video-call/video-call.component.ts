import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import { VideoService } from './video-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit,OnDestroy {
  @Input() dialog: any;
  public _usersCache: any;

  userCacheSubscription: Subscription
  callEventSubscription: Subscription
  session;
  constructor(
    private dashboardService: DashboardService,
    public dialogService: DialogService,
    private userService: UserChatService,
    public videoService : VideoService
  ) {
    this._usersCache = this.userService._usersCache;
    if(!this.dialog){
      this.dialog = this.dialogService.currentDialog;
    }
    this.userCacheSubscription = this.userService.usersCacheEvent.subscribe((usersCache: Object) => {
      this._usersCache = usersCache;
    });
    this.session = this.videoService.currentSession;
    this.callEventSubscription = this.videoService.callEvent.subscribe((event: Object) => {
      console.log("event emiited" , event, event['session'].state);
        // if(event && event['name'] == 'OnCallListener'){
        //   //console.log('check',this.userService);
        //   //this.showCalling = true;
        //   this.session = event['session'];
        // }
        // if(event && (event['name'] == 'onStopCallListener' || event['name'] == 'onSessionCloseListener')){
        //   //this.showCalling = false;
        //   this.session = event['session'];
        // }
        this.session = this.videoService.currentSession;
    });
  }

  ngOnInit() {
    console.log("dailog", this.dialog);
  }

  endCall(){
    this.videoService.endCall();
  }


  goBack() {
    this.dashboardService.showComponent({
      'createGroupClicked': false,
      'videoDialog' :false,
      'updateDialog': false,
      'welcomeChat' : this.dashboardService.components.welcomeChat,
      'onChatClick': this.dashboardService.components.onChatClick
    });
    this.videoService.stopTimer();
  }

  noVideoToast(){
    this.userService.showToastr('info', 'Video not available in audio call','')
  }

  ngOnDestroy(){
    this.videoService.stopTimer();
    this.userCacheSubscription.unsubscribe();
    this.callEventSubscription.unsubscribe();
  }

}
