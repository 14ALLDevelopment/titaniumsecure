
import {EventEmitter, Injectable} from '@angular/core';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {Helpers} from 'src/app/shared/helper/helpers';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {CONSTANTS} from 'src/app/QBconfig';

declare var QB: any;

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  public currentSession: any = null;
  public user;
  public callingAudio ; ringtoneAudio ; callEndAudio;
  public screenShareActive:boolean = false;
  callEvent: EventEmitter<any> = new EventEmitter();

  /** This variables is used for call timer */
  callTime = 0; // to increse the timer
  public text; // to show the timer text
  interval; // to hold the interval id.
  /** end */

  /** flags for audio/video mute/unmute */
    videoMute : boolean = false;
    audioMute : boolean = false;
  /** end  */
  public userMedia :boolean = false;
  showCalling:boolean = false; // to display the calling popup with accept and reject buttons
  
  constructor(
    private userService: UserChatService,
    private dialogService: DialogService,
    private dashboardService: DashboardService
  ) {
    this.user = this.userService.user;
    this.setListeners();
  }

    setListeners(){
        if(QB && QB.webrtc){
            QB.webrtc.onCallListener = this.onCallListener.bind(this);
            QB.webrtc.onAcceptCallListener = this.onAcceptCallListener.bind(this);
            QB.webrtc.onRejectCallListener = this.onRejectCallListener.bind(this);
            QB.webrtc.onStopCallListener = this.onStopCallListener.bind(this);
            QB.webrtc.onUpdateCallListener = this.onUpdateCallListener.bind(this);
            QB.webrtc.onInvalidEventsListener = this.onInvalidEventsListener.bind(this);
            QB.webrtc.onUserNotAnswerListener = this.onUserNotAnswerListener.bind(this);
            QB.webrtc.onRemoteStreamListener = this.onRemoteStreamListener.bind(this);
            QB.webrtc.onSessionConnectionStateChangedListener = this.onSessionConnectionStateChangedListener.bind(this);
            QB.webrtc.onSessionCloseListener = this.onSessionCloseListener.bind(this);
            QB.webrtc.onCallStatsReport = this.onCallStatsReport.bind(this);
        }   
    }

    createSessionAndMakeCall(occupants_ids,calltype){
        if(!window.navigator.onLine) {
            //shows toast here of no internet 
            console.log("No internet, Please check your internet connection.")
            return false;
        }
        const callee_ids = occupants_ids.filter((userId) => {
            return userId !== this.userService.user.id;
          });
        if(!callee_ids.length){
            //show toast no callee found
            console.log("No occupant to call");
            return false;
        }
        console.log("setting up web rtc session")
        let sessionType = calltype == "audio" ? QB.webrtc.CallType.AUDIO : QB.webrtc.CallType.VIDEO ;
        let additionalOptions = {};
        if(this.currentSession){
            this.endCall();
        }
        this.currentSession = QB.webrtc.createNewSession(callee_ids, sessionType, null, additionalOptions);

        let mediaParams
        if(sessionType == QB.webrtc.CallType.AUDIO ){
            mediaParams = {
                audio: true,
                video: false,
            };  
        }else{
            mediaParams = {
                audio: true,
                video: true,
            };   
        }

        const self=this;
        this.currentSession.getUserMedia(mediaParams, function (error, stream) {
            if (error || !stream.getAudioTracks().length || (sessionType == QB.webrtc.CallType.AUDIO ? false : !stream.getVideoTracks().length)) {
                //show error msg in toast here
                console.log(error,"error");
                //self.userService.showToastr('error',error,'')
                self.userService.showToastr('error','Video camera/Microphone not found, Please connect and try again','')
                // if(error == "NotFoundError: Requested device not found"){
                //     self.userService.showToastr('error','Video camera/Microphone not found, Please connect and try again','')
                // }
                self.currentSession.stop({});
                self.currentSession =null;
            } else {
                //console.log(stream,"success")
                self.userMedia = true;
                //to show the video component
                self.showVideoCallComponent();
                //run call function here
                if(sessionType == QB.webrtc.CallType.VIDEO){
                    setTimeout(() => {
                        self.currentSession.attachMediaStream('localVideo', stream);    
                    }, 500);
                }else{
                   // self.currentSession.attachMediaStream('localAudio', stream);
                }
                self.currentSession.call({}, function(error,success) {
                    if(error){
                        console.log("error", error)
                    }else{
                        self.playCallingAudio('start');
                        //self.sendPushNotification(callee_ids);
                        //show calling dialog here
                        console.log("calling ... ",success);
                        let eventParams ={
                            "name" : 'calling',
                            "session" : self.currentSession
                        } 
                        self.resetTimer();
                        self.callEvent.emit(eventParams);
                    }
                });
            }
        });

    }

    sendPushNotification(userIDs){
        // and also send push notification about incoming call
        // (corrently only iOS/Android users will receive it)
        //
        var params = {
            notification_type: 'push',
            user: {ids: userIDs},
            environment: 'development', // environment, can be 'production' as well.
            message: QB.pushnotifications.base64Encode(JSON.stringify({
                "message": this.user.full_name + " is calling you",
            }))
        };
        //
        QB.pushnotifications.events.create(params, function(err, response) {
            if (err) {
                console.log(err);
            } else {
                // success
                console.log("Push Notification is sent.");
            }
        });
    }

    acceptCall(){
        if(this.currentSession){
            let mediaParams
            if(this.currentSession.callType == QB.webrtc.CallType.AUDIO ){
                mediaParams = {
                    audio: true,
                    video: false,
                };  
            }else{
                mediaParams = {
                    audio: true,
                    video: true,
                };   
            }

            // if you are going to take a call  
            const self =this;
            this.currentSession.getUserMedia(mediaParams, function (error, stream) {
                if (error || !stream.getAudioTracks().length || (self.currentSession.callType == QB.webrtc.CallType.AUDIO ? false : !stream.getVideoTracks().length)) {
                    //show error msg in toast here
                    console.log(error,"error");
                    self.userService.showToastr('error','Video camera/Microphone not found, Please connect and try again','')
                    // if(error == "NotFoundError: Requested device not found"){
                    //     self.userService.showToastr('error','Video camera/Microphone not found, Please connect and try again','')
                    // }
                    if(self.currentSession){
                        self.currentSession.stop({});
                    } 
                } else {
                    //console.log(stream,"success")
                    //run call function here
                    
                    //to show the video component
                    self.showVideoCallComponent();

                    if(self.currentSession.callType == QB.webrtc.CallType.VIDEO){
                        setTimeout(() => {
                            self.currentSession.attachMediaStream('localVideo', stream); 
                        }, 500);
                    }else{
                        // setTimeout(() => {
                        //     self.currentSession.attachMediaStream('localAudio', stream); 
                        // }, 500);
                    }
                    self.currentSession.accept({});
                    self.toggleRingToneAudio('end');
                    self.startTimer();
                }
            })
        }
    }

    endCall(){
        if(this.currentSession){
            this.currentSession.stop({});
            this.currentSession = null;
            this.stopTimer();
        } 
    }

    rejectCall(){
        if(this.currentSession){
            this.currentSession.reject({});
            this.currentSession = null; 
        }
    }

    startTimer() {
        this.resetTimer();
        this.interval = setInterval(() => {
          this.updTimer();
        }, 1000);
    }

    resetTimer(){
        this.callTime = 0;
        this.text = '00:00:00';
    }
    
    updTimer() {
        this.callTime += 1000;
        //console.log('', this.callTime);
        this.text = new Date(this.callTime).toUTCString().split(/ /)[4];
    }

    stopTimer() {
        if(this.interval){
            clearInterval(this.interval);
        }
    }

    toggleVideo(){
        if(this.currentSession){
            if(this.videoMute){
                this.currentSession.unmute('video');
            }else{
                this.currentSession.mute('video');
            }
            this.videoMute = !this.videoMute;
        }
    }

    toggleAudio(){
        if(this.currentSession){
            if(this.audioMute){
                this.currentSession.unmute('audio');
            }else{
                this.currentSession.mute('audio');
            }
            this.audioMute = !this.audioMute;
        }
    }

    async runScreenSharing() {
        const mediaDevices = navigator.mediaDevices as any;
        await mediaDevices.getDisplayMedia({
            video: true,
          }).then((stream) => {
            let videoTrack = stream.getVideoTracks()[0];
            videoTrack.onended = this.stopScreenSharing;
            this.switchMediaTrack(videoTrack);
            this.screenShareActive = true;
          });
    }
      
    stopScreenSharing () {
    navigator.mediaDevices
        .getUserMedia({
        video: true,
        })
        .then((stream) => {
        this.switchMediaTrack(stream.getVideoTracks()[0]);
        this.screenShareActive = false;
        });
    }

    switchMediaTrack(track) {
        this.currentSession.localStream.getVideoTracks()[0].stop();
        let stream = this.currentSession.localStream.clone();
        stream.removeTrack(stream.getVideoTracks()[0]);
        stream.addTrack(track);
        this.currentSession.localStream.getAudioTracks()[0].stop();
        this.currentSession._replaceTracks(stream);
        this.currentSession.localStream = stream;
        return true;
    };

    toggleRingToneAudio(type){
        if(type == 'end'){
            if(this.ringtoneAudio){
                this.ringtoneAudio.pause();
                this.ringtoneAudio.currentTime = 0;
            }
        }else{
            if(!this.ringtoneAudio){
                this.ringtoneAudio = new Audio();
                this.ringtoneAudio.src = "../../../assets/audio/ringtone.mp3";
                this.ringtoneAudio.loop = true;
                this.ringtoneAudio.load();
                this.ringtoneAudio.play();
            }else{
                if(this.ringtoneAudio.paused){
                    this.ringtoneAudio.play();
                }else{
                    this.ringtoneAudio.pause();
                    this.ringtoneAudio.currentTime = 0;
                }
            }
        }
        
    }

    playCallingAudio(type){

        if(type == 'end'){
            if(this.callingAudio){
                this.callingAudio.pause();
                this.callingAudio.currentTime = 0;
            }
        }else{
            if(!this.callingAudio){
                this.callingAudio = new Audio();
                this.callingAudio.src = "../../../assets/audio/calling.mp3";
                this.callingAudio.loop = true;
                this.callingAudio.load();
                this.callingAudio.play();
            }else{
                if(this.callingAudio.paused){
                    this.callingAudio.play();
                }else{
                    this.callingAudio.pause();
                    this.callingAudio.currentTime = 0;
                }
            }
        }
    }

    playEndCallAudio(){
        let audio = new Audio();
        audio.src = "../../../assets/audio/end_of_call.mp3";
        audio.load();
        audio.play();
    }

    showVideoCallComponent(){
        this.dashboardService.showComponent({
            'videoDialog' : true,
        });
    }

    closeVideoCallComponent(){
        this.userMedia = false
        this.dashboardService.showComponent({
            'videoDialog' :false,
        });
    }


    private onCallListener(session,extension){
        console.group('OnCallListener.');
            console.log('extension: ', extension);
            console.log('Session: ', session );
        console.groupEnd();
        let eventParams ={
            "name" : 'OnCallListener',
            "session" : session,
            "extension" : extension
        }
       
        this.currentSession = session;
        if(this.currentSession.initiatorID !== this.userService.user.id){
            this.toggleRingToneAudio('start');
            this.callEvent.emit(eventParams);
            this.showCalling = true;
            this.resetTimer();
        }
        
    }

    private onAcceptCallListener(session, userId, extension){
        console.log("onAcceptCallListener", session , extension ,userId);
        this.currentSession = session;
        this.playCallingAudio('end');
        this.startTimer();
        //this.callEvent.emit(eventParams);
    }

    private onRejectCallListener(session, userId, extension){
        console.log("onRejectCallListener", session , extension ,userId);
        this.currentSession = session;
        this.playCallingAudio('end');
    }

    private onStopCallListener(session, userId, extension){
        console.group('onStopCallListener.');
            console.log('extension: ', extension);
            console.log('Session: ', session);
            console.log('userId: ', userId)
        console.groupEnd();
        let eventParams ={
            "name" : 'onStopCallListener',
            "session" : session,
            "extension" : extension,
            "userId" : userId
        }
        this.currentSession = session;
        this.callEvent.emit(eventParams);
        this.playCallingAudio('end');
        this.toggleRingToneAudio('end');
        this.showCalling = false;
        this.stopTimer();
    }

    private onUpdateCallListener(session, userId, extension){
        console.log("onUpdateCallListener", session , extension ,userId);
    }

    private onInvalidEventsListener(eventName, session, userId, userInfo){
        console.log("onInvalidEventsListener", eventName, session, userId, userInfo);
    }

    private onUserNotAnswerListener(session, userId){
        console.log("onUpdateCallListener", session,userId);
    }

    private onRemoteStreamListener(session, userId, stream) {
        console.log("onRemoteStreamListener", session, userId, stream);
        this.currentSession = session
        if(this.currentSession.callType == QB.webrtc.CallType.VIDEO){
            this.currentSession.attachMediaStream('remoteVideo', stream);
        }
        this.currentSession.attachMediaStream("remoteAudio", stream);
    }

    private onSessionConnectionStateChangedListener(session, userId, connectionState) {
        console.group('onSessionConnectionStateChangedListener.');
            console.log('Session: ', session);
            console.log('userId: ', userId);
            console.log('connectionState: ', connectionState);
        console.groupEnd();
        this.currentSession = session;
    }

    private onSessionCloseListener(session) {
        console.group('onSessionCloseListener.');
            console.log('Session: ', session);
        console.groupEnd();
        let eventParams ={
            "name" : 'onSessionCloseListener',
            "session" : session,
        }
        this.currentSession = session;
        this.toggleRingToneAudio('end');
        this.playCallingAudio('end');
        this.callEvent.emit(eventParams);
        this.stopTimer();
        this.showCalling = false;
        this.closeVideoCallComponent();
    }

    private onCallStatsReport (session, userId, stats, error) { 
        console.log("onSessionCloseListener", session, userId, stats, error);
    }
}
