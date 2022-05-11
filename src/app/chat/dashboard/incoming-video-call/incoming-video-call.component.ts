import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserChatService } from '../user/user.service';
import { VideoService } from '../video-call/video-service';
import { VideoConferenceService } from '../video-group-call/video-conference-service';

@Component({
  selector: 'app-incoming-video-call',
  templateUrl: './incoming-video-call.component.html',
  styleUrls: ['./incoming-video-call.component.css']
})
export class IncomingVideoCallComponent implements OnInit ,OnDestroy{

  _userCache;

  constructor(public videoService : VideoService,
    public videoConferenceService : VideoConferenceService,
    public userChatService: UserChatService) {
      this._userCache = this.userChatService._usersCache
    }

  ngOnInit(): void {
  }

  rejectCall(){
    this.videoService.rejectCall();
    this.videoService.showCalling = false;
  }

  acceptCall(){
    this.videoService.acceptCall();
    this.videoService.showCalling = false;
  }

  ngOnDestroy(){
    this.videoConferenceService.toggleRingToneAudio('end');
  }

}
