import { Component, Input, OnInit ,Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { QBHelper } from 'src/app/shared/helper/qbHelper';
import { DashboardService } from '../dashboard.service';
import { DialogService } from '../dialogs/dialog.service';
import { UserChatService } from '../user/user.service';
import { VideoConferenceService } from './video-conference-service';

@Component({
  selector: 'app-video-group-call',
  templateUrl: './video-group-call.component.html',
  styleUrls: ['./video-group-call.component.css',]
})
export class VideoGroupCallComponent implements OnInit {

  @Input() dialog: any;

  public groupMembers: number[] = [];
  public loggedinUser: any;
  public selectedUsers: number[] = [];
  public InCallParticipants : number [] = [];
  public addParticipants : number [] = [];
  public searchText :string ;
  public _usersCache: any;

  userCacheSubscription: Subscription;
  callEventSubscription: Subscription;
  //to hold time out reference
  callEndTimeoutRef :any = null ;

  constructor( private userService: UserChatService,
    private dashboardService: DashboardService,
    public dialogService: DialogService,
    private qbHelper: QBHelper,
    private renderer : Renderer2,
    public videoConferenceService : VideoConferenceService) {
      this._usersCache = this.userService._usersCache;
      this.loggedinUser = this.userService.user;
      
      this.userCacheSubscription = this.userService.usersCacheEvent.subscribe((usersCache: Object) => {
        this._usersCache = usersCache;
      });
      //events for conference call
      this.callEventSubscription = this.videoConferenceService.conferenceCallEvent.subscribe((conferenceEvent)=>{
        console.log("conference event",conferenceEvent);
        if(conferenceEvent.name && conferenceEvent.name == 'joined'){
          //if someone join the call before end call timeout then clear the time out
          if(this.callEndTimeoutRef){
            clearTimeout(this.callEndTimeoutRef)
          }
          //-------------------------------------------------------------
          const index = this.InCallParticipants.indexOf(conferenceEvent.id);
          if (index < 0) {
            if( this.userService._usersCache[conferenceEvent.id] === undefined){
              console.log("joined if undefined");
              const self = this;
              (new Promise(function (resolve) {
                if(self.userService){
                  self.userService.getUserList({
                    field: 'id',
                    value: conferenceEvent.id,
                    per_page: 1
                  }).then(resolve);
                }
              })).then(() => {
                console.log("user details fetched");
                this.InCallParticipants.push(conferenceEvent.id);
                let username = this._usersCache[conferenceEvent.id].name;
                let message = username + " joined."; 
                this.userService.showToastr('info',message,"");
                if(this.InCallParticipants.length == 1 && this.videoConferenceService.text == '00:00:00'){
                  this.videoConferenceService.startTimer();
                }
              });
            }else{
              this.InCallParticipants.push(conferenceEvent.id);
              // console.log('start timer', this.InCallParticipants.length)
              let username = this._usersCache[conferenceEvent.id].name;
              let message = username + " joined."; 
              this.userService.showToastr('info',message,"");
              if(this.InCallParticipants.length == 1){
                this.videoConferenceService.startTimer();
              }
            } 
          }
        }else if(conferenceEvent.name && conferenceEvent.name == 'left'){
          const index = this.InCallParticipants.indexOf(conferenceEvent.id);
          if (index >= 0) {
            this.InCallParticipants.splice(index, 1);
            let username = this._usersCache[conferenceEvent.id].name;
              let message = username + " left."; 
              this.userService.showToastr('info',message,"");
            if(this.InCallParticipants.length == 0 && this.videoConferenceService.text != '00:00:00'){
              this.videoConferenceService.stopTimer();
              //End call after 10 sec in case user call drops and rejoin again.
              this.callEndTimeoutRef = setTimeout(() => {
                this.endCall();  
              }, 10000);
              
            }
          }
        }else if(conferenceEvent.name && conferenceEvent.name == 'callTimeOutUser'){
          const index = this.selectedUsers.indexOf(conferenceEvent.userId);
          if (index >= 0) {
            this.selectedUsers.splice(index, 1);
          }
        } 
      });
  }

  ngOnInit(): void {
    if(!this.dialog){
      this.dialog = this.videoConferenceService.currentdailog ? this.videoConferenceService.currentdailog  : this.dialogService.currentDialog;
    }
    //console.log("dialog" ,this.dialog , "conf" ,  this.videoConferenceService.currentdailog);
    this.groupMembers = this.dialog.occupants_ids;
    this.selectedUsers.push(this.loggedinUser.id);
  }


  makeCall(){
    //console.log("session", this.qbHelper.getSession());
    if(this.selectedUsers.length >= 1){
      this.videoConferenceService.startConference(this.selectedUsers);
      if(this.InCallParticipants.length > 1){
        this.InCallParticipants = []
      }
      this.videoConferenceService.showCallInterface();
      this.dashboardService.showComponent({
        'welcomeChat': true,
        'onChatClick': false
      });
    }else{
      console.log("select participants")
    }
    
  }

  makeVideoCall(){
    if(this.selectedUsers.length >= 1){
      this.videoConferenceService.startConference(this.selectedUsers);
      if(this.InCallParticipants.length > 1){
        this.InCallParticipants = []
      }
    }else{
      console.log("select participants")
    }
  }

  endCall(){
    if(this.InCallParticipants.length >= 1){
      this.videoConferenceService.stopConferenceCall(true);
      this.InCallParticipants = [];
    }else{
      this.videoConferenceService.stopConferenceCall();
    }
    this.closeconferencePopup();
  }

  toggleSelectItem(userId: number) {
    const index = this.selectedUsers.indexOf(userId);
    if (this.loggedinUser.id === userId) {
      return false;
    }
    if (index >= 0) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  selectParticipants(userId:number){
    if (this.loggedinUser.id === userId) {
      return false;
    }
    const index = this.InCallParticipants.indexOf(userId);
    const selindex = this.selectedUsers.indexOf(userId);
    if(index >= 0 || selindex >= 0){
      return;
    }

    const selUserindex = this.addParticipants.indexOf(userId);
    if (selUserindex >= 0) {
      this.addParticipants.splice(selUserindex, 1);
    } else {
      console.log(this.selectedUsers.length + this.InCallParticipants.length + this.addParticipants.length, "total should not be greater than 12");
      this.addParticipants.push(userId);
    }
  }

  closeconferencePopup(){
    this.videoConferenceService.closeconferencePopup();
  }

  toggleRemoteAudio(event:any,userId){
    if(userId){
      let status = this.videoConferenceService.toggleRemoteAudio(userId);
      let button = event.currentTarget;
      button.style.pointerEvents = 'none';
      this.replaceClass(event,'fa-volume-up' , 'fa-volume-mute');
      setTimeout(() => {
        button.style.pointerEvents = 'auto';
      }, 1000);
    }
  }

  toggleRemoteVideo(event:any,userId){
    if(userId){
      let status = this.videoConferenceService.toggleRemoteVideo(userId);
      let button = event.currentTarget;
      button.style.pointerEvents = 'none';
      this.replaceClass(event,'fa-video' , 'fa-video-slash');
      setTimeout(() => {
        button.style.pointerEvents = 'auto';
      }, 1000);
    }
  }

  toggleLocalAudio(event:any){
    if(this.loggedinUser.id){
      this.replaceClass(event,'fa-microphone' , 'fa-microphone-slash');
      this.videoConferenceService.toggleLocalAudio();
    }
  }

  toggleLocalVideo(event:any){
    if(this.loggedinUser.id){
      this.replaceClass(event,'fa-video' , 'fa-video-slash');
      this.videoConferenceService.toggleLocalVideo();
    }
  }

  replaceClass(event: any, className: string, addClassName :string) {
    const hasClass = event.target.classList.contains(className);
  
    if(hasClass) {
      this.renderer.removeClass(event.target, className);
      this.renderer.addClass(event.target , addClassName)
    } else {
      this.renderer.addClass(event.target, className);
      this.renderer.removeClass(event.target, addClassName);
    }
  }

  toggleFullscreen(el: HTMLElement){
    // console.log(el);
    let classname = this.videoConferenceService.callType == 1 ? 'full-video-click' : 'full-audio-click';
    let parentMain = el.parentElement.parentElement;
    //console.log(parentMain);
    if(parentMain.classList.contains(classname)){
      parentMain.classList.remove(classname);
    }else{
      parentMain.classList.add(classname);
    }
  }

  toggleAddParticipantPopup(){
    this.addParticipants.push(this.loggedinUser.id);
    this.videoConferenceService.addParticipants = !this.videoConferenceService.addParticipants;
  }

  addParticipantToCall(){
    if(this.addParticipants.length > 1){
      let filterArr = this.addParticipants.filter((userId) => {
        return userId !== this.userService.user.id;
      });
      // filter the array compare who are in call and who are selected.
      let res = [];
       res = filterArr.filter(userId => {
          return !this.InCallParticipants.find(userID => {
             return userId === userID;
          });
       });

      console.log("filtered array" , res);

      this.videoConferenceService.sendSystemMessage(this.videoConferenceService.callType, true, res);
      this.toggleAddParticipantPopup();
    }
  }


  showBitrate(userId){
    this.videoConferenceService.showBitrate(userId);
  }

  onAudioDeviceChange(deviceId){
    console.log('change the audio input ', deviceId);
    // call switch device function here
    this.videoConferenceService.switchAudioInput(deviceId);
  }

  onVideoDeviceChange(deviceId){
    console.log('change the video input ', deviceId);
    // call switch device function here
    this.videoConferenceService.switchVideoInput(deviceId);
  }

  ngOnDestroy(){
    this.videoConferenceService.stopConferenceCall(true);
    this.videoConferenceService.resetCallInterface();
    this.videoConferenceService.clearSysMsgIntervals();
    this.videoConferenceService.stopTimer();
    this.userCacheSubscription.unsubscribe();
    this.callEventSubscription.unsubscribe();
    this.videoConferenceService.currentdailog = null;
    clearTimeout(this.callEndTimeoutRef);
  }

}
