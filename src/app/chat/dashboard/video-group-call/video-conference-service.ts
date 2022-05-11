
import {EventEmitter, Injectable} from '@angular/core';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {environment} from 'src/environments/environment'

declare var QB: any;
declare var QBVideoConferencingClient :any

@Injectable({
  providedIn: 'root'
})
export class VideoConferenceService {

  conferenceClient : any; // conference client 
  public user;
  public callingAudio ; ringtoneAudio ; callEndAudio;
  conferenceCallEvent: EventEmitter<any> = new EventEmitter();
  currentdailog ;
  /** This variables is used for call timer */
  callTime = 0; // to increse the timer
  public text = '00:00:00'; // to show the timer text
  interval; // to hold the interval id.
  /** */
  callIsInProgress : boolean = false // to check whether call is in progress.
  callType :number = 1 ;   // 1 is video , 2 is audio
  showCalling:boolean = false; // to display the calling popup with accept and reject buttons
  eventType :string = '';
  receipientIds : [] ;
  onlineParticiPants=[] ;
  sysMsgIntevals = [] ;
  iceFailedTimers = [];

  userAudioInputDevices = [];
  userVideoInputDevices = [];
  //boolean to manage the conference component popup
  public firstTime : boolean = true ; public isInCall :boolean = false;
  public addParticipants :boolean = false;

  constructor(
    private userService: UserChatService,
    private dialogService: DialogService,
    private dashboardService: DashboardService
  ) {
    this.user = this.userService.user;
    //this.setListeners();
    this.initConference();
  }

    initConference(){
        this.conferenceClient = new QBVideoConferencingClient(environment.conferenceConfig);
        //console.log("init conference config", this.conferenceClient);
        //this.createSession();
    }

    startConference(selectedUsers){

        if(selectedUsers.length && selectedUsers.length >= 1){
            this.receipientIds = selectedUsers.filter((userId) => {
                return userId !== this.userService.user.id;
            });
        }      
        const self= this;
        this.conferenceClient
        .createSession()
        .then(() => {
            // session created
            console.log('conference session created.');
            self.callIsInProgress = true;
            self.setClientListeners();
            self.attachConferencePlugin(null);
        })
        .catch((error) => {
            // some error occurred
            console.log("error creating session", error);
        });
    }

    checkOngoingCall(){
        let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id ;
        this.userService.retriveOnlineGroupUser(roomId).then(users => {
            console.log("online user in group are : ", users);
            if(users){
                this.sendSysMessageIsCallOnGoing(users);
            }
        }).catch(err =>{
            console.log("Not able to fetch online user.", err)
        });
    }

    sendSysMessageIsCallOnGoing(user){
        let sysMsg = {
            body : this.dialogService.currentDialog._id,
            extension : {
                SysMsgKey: "SysMsgSendBackConferenceType",
            }
        }

        user.forEach(userId => {
            QB.chat.sendSystemMessage(userId, sysMsg);
        });
    }

    acceptIncomingConferenceCall(){
        this.showCalling = false
        this.toggleRingToneAudio('end');
        this.showCallInterface();
        if(this.conferenceClient){
            this.eventType = 'accept'
            this.startConference([]);
        }
    }

    rejectIncomingConferenceCall(){
        this.showCalling =false;
        this.toggleRingToneAudio('end');
        this.currentdailog = null;
    }

    showCallInterface(){
        this.firstTime = false;
        this.isInCall = true;
    }

    resetCallInterface(){
        this.firstTime = true;
        this.isInCall = false;
        this.callType = 1;
        this.eventType = '';
        this.resetTimer();
    }

    joinRoom(){
        let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id;
        console.log('joining room ..',roomId ,this.dialogService.currentDialog,this.currentdailog);
        const joinParams = {
            roomId: roomId,
            userId: this.userService.user.id,
            display: this.userService.user.full_name,
            video: "stdres",
        };
          console.log('joining room params', joinParams);
          const self = this;
          this.conferenceClient
            .join(joinParams)
            .then(() => {
              //joined successfully
              console.log("Joined Room successfully");
              if(self.eventType != 'accept'){
                self.conferenceClient
                .listOnlineParticipants(roomId)
                .then((participants)=>{
                    console.log("checking online participants", participants);
                    if(participants && participants.length > 1){
                        //console.log("already ongoing call");  
                        //alert("Ongoing call already in progress");
                        // self.userService.showToastr('info',"Ongoing call already in progress, Try again later","");
                        // setTimeout(() => {
                        //     self.stopConferenceCall(true);    
                        // });
                    }else{
                        self.sendSystemMessage(this.callType);
                        self.sendPushNotification(self.receipientIds);
                        self.sendSysMsgCallStarted();
                    }
                }).catch((error) => {
                    console.log("error fetching online participant");
                    //to show the video component
                    self.showConferencePopup();
                });
                
              }else{
                  //to show the video component
                  self.showConferencePopup();
              }
            })
            .catch((error) => {
              // handle error
              console.log("Joining Rooom unsuccessfull" , error);
              self.userService.showToastr('info',"Not able to join call, Try again later","");
            });
    }

    showConferencePopup(){    
        this.dashboardService.showComponent({
            'createGroupClicked': false,
            'updateDialog': false,
            'videoConferenceDialog' : true,
            'videoDialog' : false,
            'welcomeChat': true,
            'onChatClick': false
            });

        this.userService.showToastr('info',"Joined the call","");
    }

    closeconferencePopup(){
        this.dashboardService.showComponent({
          'videoConferenceDialog' : false,
          'welcomeChat': this.dashboardService.components.welcomeChat,
          'onChatClick': this.dashboardService.components.onChatClick
        });
        this.resetCallInterface();
      }

    sendSysMsgCallStarted(){
        let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id ;
        let sysMsg = {
            body : roomId,
            extension : {
                SysMsgKey: "SysMsgGroupCallStarted",
                SysMsgKeyGroupCallType: this.callType
            }
        }
        this.userService.retriveOnlineGroupUser(roomId).then((users : any) => {
            console.log("online user in group are : ", users);
            if(users && users.length){
                users.forEach(userId => {
                    QB.chat.sendSystemMessage(userId, sysMsg);
                });  
            }
        }).catch(err =>{
            console.log("Not able to fetch online user.", err)
        });        
    }
    
    listOnlineParticipants(){
        let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id ;
        this.userService.retriveOnlineGroupUser(roomId).then((users : any) => {
            console.log("online user in group are : ", users);
            if(users && users.length){
                this.onlineParticiPants = users;
                this.sendSystemMsgCallEnd(roomId);
            }
        }).catch(err =>{
            console.log("Not able to fetch online user.", err)
        });

        // let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id ;
        // const self = this;
        // this.conferenceClient
        // .listOnlineParticipants(roomId)
        // .then((participants) => { 
        //     if(participants && participants.length){
        //         console.log("listOnlineParticipants: ", participants);
        //         self.onlineParticiPants = participants.filter((user) => {
        //             return user.id != self.userService.user.id;
        //         });    
        //         self.sendSystemMsgCallEnd();
        //     }
        // })
        // .catch((error) => {
        //     console.error("Can't got list of online participants:", error);
        // });
    }

    sendSystemMessage(calltype, addparticipant=false , addparticipants = []){
        let roomId = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id ;
        let sysMsg = {
            body : roomId,
            extension : {
                SysMsgKey: "SysMsgGroupCall",
                SysMsgKeyGroupCallType: calltype
            }
        }
        //console.log("sending system messagee" , this.receipientIds)
        if(!addparticipant){
            this.receipientIds.forEach(userId => {
                let timeOut = 0;
                let id = setInterval(() => {
                    timeOut += 1;
                    QB.chat.sendSystemMessage(userId, sysMsg);
                    console.log('sending sys mesg', userId , sysMsg )
                    if(timeOut == 60){
                        console.log('Timed out, stop sys msg send');
                        this.stopSysMessage(userId);
                        let event = {
                            name : "callTimeOutUser",
                            userId : userId,
                        }
                        this.conferenceCallEvent.emit(event);
                    }
                },1000);
                let obj = {
                    userId : userId,
                    intervalId : id 
                }
                this.sysMsgIntevals.push(obj);
            });
            console.log('sysMsg', this.receipientIds , this.sysMsgIntevals);
        }else{
            if(addparticipants.length >= 1){
                addparticipants.forEach(userId => {
                    let timeOut = 0;
                    let id = setInterval(() => {
                        timeOut += 1;
                        QB.chat.sendSystemMessage(userId, sysMsg);
                        console.log('sending sys mesg', userId , sysMsg );
                        if(timeOut == 60){
                            console.log('Timed out, stop sys msg send');
                            this.stopSysMessage(userId);
                            let event = {
                                name : "callTimeOutUser",
                                userId : userId,
                            }
                            this.conferenceCallEvent.emit(event);
                        }
                    },1000);
                    let obj = {
                        userId : userId,
                        intervalId : id 
                    }
                    this.sysMsgIntevals.push(obj);
                });
                console.log('sysMsg add', addparticipants , this.sysMsgIntevals);
            }
            
        }
    }

    stopSysMessage(userId){
        //console.log("removing inteval",userId);
        this.sysMsgIntevals.forEach(obj => {
            if(obj.userId == userId){
                clearInterval(obj.intervalId);
            }
        });
        
        let index = this.sysMsgIntevals.findIndex((obj) => {
            return obj.userId === userId;
        });
       if (index !== -1) this.sysMsgIntevals.splice(index, 1);
       console.log("removing id from array", this.sysMsgIntevals);
    }

    clearSysMsgIntervals(){
        this.sysMsgIntevals.forEach(obj => {
            clearInterval(obj.intervalId);
        });
        this.sysMsgIntevals = [];
    }

    setClientListeners(){
        this.conferenceClient.on(this.conferenceClient.events.PARTICIPANT_JOINED, (info, userDisplayName) => {
            console.log('joined' , userDisplayName , info.id);
            
            if (info.id) {
                let joinEvent = {
                    name : 'joined',
                    id : info.id
                }
                this.conferenceCallEvent.emit(joinEvent);
                this.attachPlugin(true, info.id);

            } else {
                // updateDialogsUsersStorage([participant.id], function () {
                //   attachPlugin(true, participant.id);
                // });
            }
        });

        this.conferenceClient.on(this.conferenceClient.events.PARTICIPANT_LEFT, (userId, userDisplayName) => {
            console.log('left' , userDisplayName , userId);
            let joinEvent = {
                name : 'left',
                id : userId
            }
            this.conferenceCallEvent.emit(joinEvent);
            //remove video element and clean handlers
        });

        this.conferenceClient.on(this.conferenceClient.events.LOCAL_STREAM, (stream) => {
            let videoTracks = stream.getVideoTracks();
            console.log("video track local stream", videoTracks);
            if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                if(this.callType != 2){
                    const localVideo = document.getElementById("localVideo");
                    // add an image with the message "video not found"
                    //localVideo.setAttribute("poster", "https://dummyimage.com/300x350/000/fff.jpg&text=Stream+Not+Found");
                    localVideo.setAttribute("poster", "assets/images/stream_not_found.png");
                }
                //localVideo.setAttribute("style", "visibility:hidden");
                //QBVideoConferencingClient.attachMediaStream(localAudio, stream);
            }else{
                const localVideo = document.getElementById("localVideo");
                if(localVideo){
                    QBVideoConferencingClient.attachMediaStream(localVideo, stream);
                }else{
                    setTimeout(() => {
                        QBVideoConferencingClient.attachMediaStream(localVideo, stream);
                    }, 2000);
                }
                
            }
            //this.showBitrate(this.userService.user.id);
        });

        this.conferenceClient.on(this.conferenceClient.events.REMOTE_STREAM, (stream, userId) => {
            var videoTracks = stream.getVideoTracks();
            var audioTracks = stream.getAudioTracks();

            console.info(
            'Got a remote stream for user ' + userId +
            '. audioTracks: ' + audioTracks.length +
            '. videoTracks: ' + videoTracks.length , QBVideoConferencingClient.currentRoomId
            );
            this.attachRemoteStreamToElement(stream,userId);
        });

        this.conferenceClient.on(this.conferenceClient.events.SESSION_DESTROYED, () => {
            console.log('Session destroyed, removing all handlers');
            const self =this;
            Object.values(this.conferenceClient.events).map(function (eventName) {
                self.conferenceClient.removeAllListeners(eventName);
            });
        });

        this.conferenceClient.on(this.conferenceClient.events.ERROR, (error) => {
            // handle error
            console.error('Received error: ', error);
            //this.userService.showToastr("error",error,"")
            //this.closeconferencePopup();
        });
    }

    // to connect remote user stream to element recurrsive
    attachRemoteStreamToElement(stream,userId){
        let videoTracks = stream.getVideoTracks();
        if(this.callType == 2){
            const remoteAudio = document.getElementById("remoteAudio"+userId);
            if(remoteAudio){
                QBVideoConferencingClient.attachMediaStream(remoteAudio, stream);
            }else{
                setTimeout(() => {
                    this.attachRemoteStreamToElement(stream,userId);
                    console.error("element not found to which stream can be attached,trying to reattach"); 
                 },1000);
            }
        }else{
            if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                const remoteAudio = document.getElementById("remoteAudio"+userId);
                if(remoteAudio){
                    QBVideoConferencingClient.attachMediaStream(remoteAudio, stream);
                }else{
                    setTimeout(() => {
                        this.attachRemoteStreamToElement(stream,userId);
                        console.error("element not found to which stream can be attached,trying to reattach"); 
                    },1000);
                }
            }else{
                const remoteVideo = document.getElementById("remoteVideo"+userId);
                if(remoteVideo){
                    QBVideoConferencingClient.attachMediaStream(remoteVideo, stream);
                }else{
                    setTimeout(() => {
                    this.attachRemoteStreamToElement(stream,userId); 
                    console.error("element not found to which stream can be attached,trying to reattach");
                    },1000);
                } 
            }
        }
    }

    async attachConferencePlugin(remoteUser){
        const isRemote = remoteUser ? true : false;
        const userId = remoteUser ? remoteUser.id : null;
        const self = this;
        try {
            let plugin = await this.conferenceClient.attachVideoConferencingPlugin(isRemote, userId);
            this.setListeners(plugin,userId);
            this.joinRoom();
        } catch (error) {
            console.error("Error in creating plugin: ", error);
        }
    }

    async attachPlugin(isRemote, userId) {
        try {
          let plugin = await this.conferenceClient.attachVideoConferencingPlugin(isRemote, userId);
          this.setListeners(plugin,userId);
        } catch (error) {
          console.error("Error in creating plugin: ", error);
        }
    }

    setListeners(plugin,userId){
        if(plugin){
            console.log('setting up plugin listeners')
            let handlers = this.createPluginHandlers(userId);
            plugin.addListener(plugin.events.CONSENT_DIALOG, handlers.consentDialog.bind(this));
            plugin.addListener(plugin.events.MEDIA_STATE, handlers.mediaState.bind(this));
            plugin.addListener(plugin.events.WEBRTC_STATE, handlers.webrtcState.bind(this));
            plugin.addListener(plugin.events.SLOW_LINK, handlers.slowLink.bind(this));
            plugin.addListener(plugin.events.ICE_STATE, handlers.iceState.bind(this));
            plugin.addListener(plugin.events.DETACHED, handlers.detached.bind(this));
            plugin.addListener(plugin.events.CLEANUP, handlers.cleanup.bind(this));    
        }
    }

    clearEventsListeners() {
        this.conferenceClient.removeAllListeners("participantjoined");
        this.conferenceClient.removeAllListeners("participantleft");
        this.conferenceClient.removeAllListeners("localstream");
        this.conferenceClient.removeAllListeners("remotestream");
    }

    sendSystemMsgCallEnd(roomId){
        let sysMsg = {
            body : roomId,
            extension : {
                SysMsgKey: "SysMsgGroupCallEnd"
            }
        }
        console.log("end call", this.onlineParticiPants);
        if(this.onlineParticiPants && this.onlineParticiPants.length){
            this.onlineParticiPants.forEach((participant) => {
                if(participant && participant['id']){
                    QB.chat.sendSystemMessage(participant['id'], sysMsg);
                    console.log('sending sys msg CALL END', participant['id'] , sysMsg )
                }else {
                    QB.chat.sendSystemMessage(participant, sysMsg);
                    console.log('sending sys msg CALL END', participant, sysMsg )
                }
            });
            this.onlineParticiPants = [];
        } 
    }

    async stopConferenceCall(ongoingCall=false){
        if (this.callIsInProgress) {
             this.stopAllICEFailedTimers();
             try {
                if(!ongoingCall){
                    console.log("stop call", this.callIsInProgress , ongoingCall);
                    await this.listOnlineParticipants();  
                    this.callIsInProgress = false;   
                }
                await this.leaveRoom();
                await this.detachVideoConferencePlugin();
                await this.destroySession();
                console.info("Success detachVideoConferencingPlugin");
                this.closeconferencePopup();
             } catch (error) {
               console.warn('Error: ', error);
               await this.leaveRoom();
               await this.detachVideoConferencePlugin();
               await this.destroySession();
               this.closeconferencePopup()
             }
        }
    }

    showBitrate(userId){
        console.log('showBitrate', userId)
        const bitrateNode = document.getElementById("bitrate"+userId);
        console.log(bitrateNode)
        this.conferenceClient.showBitrate(userId, bitrateNode);
    }

    sendPushNotification(userIDs){
        // and also send push notification about incoming call
        // (currently only iOS/Android users will receive it)
        //
        let environmentParam = environment.production ? 'production' : 'development' ;
        let dialogName = this.currentdailog ? this.currentdailog.name : this.dialogService.currentDialog.name;
        let dialogID = this.currentdailog ? this.currentdailog._id : this.dialogService.currentDialog._id;
        var params = {
            notification_type: 'push',
            user: {ids: userIDs},
            environment: environmentParam, // environment, can be 'production' as well.
            message: QB.pushnotifications.base64Encode(JSON.stringify({
                "message": this.user.full_name + " has started the " + dialogName +" conference call",
                "ios_sound" : "msgReceive.wav",
                // custom params
                "chat_dialog_id" : dialogID,
                "isCall" : "YES"
            }))
        };
        //
        console.log('sending notifitions to :- ', userIDs);
        QB.pushnotifications.events.create(params, function(err, response) {
            if (err) {
                console.log("Not able to send push notification, User not subscribe to it", err);
            } else {
                // success
                console.log("Push Notification is sent.",response);
            }
        });
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

    switchAudioInput(deviceId, toast=true){
        if(deviceId){
            this.conferenceClient
            .switchAudioInput(deviceId)
            .then(() => {
                // switched successfully
                if(toast){this.userService.showToastr("info","Audio channel changed","");}
            })
            .catch((error) => {
                // handle error
                this.userService.showToastr("error","Not able to change the Audio channel","");
            });
        }
        
    }

    switchVideoInput(deviceId,toast=true){
        if(deviceId){
            this.conferenceClient
            .switchVideoInput(deviceId)
            .then(() => {
                // switched successfully
                if(toast){this.userService.showToastr("info","Video channel changed","");}
                
            })
            .catch((error) => {
                // handle error
                this.userService.showToastr("error","Not able to change the Video channel","");
            });
        }
    }

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

    toggleRemoteAudio(userId){
        const muted = this.conferenceClient.toggleRemoteAudioMute(userId);
        console.info("Now remote audio is muted=" + muted);
        return muted;
    }

    toggleLocalVideo(){
        const muted = this.conferenceClient.toggleVideoMute();
        console.info("Now video is muted=" + muted);
    }

    toggleRemoteVideo(userId){
        const muted = this.conferenceClient.toggleRemoteVideoMute(userId);
        console.info("Now remote video is muted=" + muted);
        return muted;
    }

    toggleLocalAudio(){
        const muted = this.conferenceClient.toggleAudioMute();
        console.info("Now local audio is muted=" + muted);
    }

    leaveRoom(){
        this.conferenceClient
        .leave()
        .then(() => {
            // left room successfully
        })
        .catch((error) => {
            // handle error
        });
    }

    detachVideoConferencePlugin(){
        this.conferenceClient
        .detachVideoConferencingPlugin()
        .then(() => {
            // successfully detached
        })
        .catch((error) => {
            // handle error
        });
    }

    destroySession(){
        this.conferenceClient
        .destroySession()
        .then(() => {
            // success
            this.clearEventsListeners();
            this.receipientIds = [];
            this.clearSysMsgIntervals();
        })
        .catch((error) => {
            // handle error
        });
    }

    runICEFailedTimer(medium) {
    console.info("Ran 'ICE failed' timer for 5 seconds.");
    const self = this;
    this.iceFailedTimers[medium] = setInterval(() => {
        console.info("Closing session because of 'ICE failed'..");
        self.stopConferenceCall();        
        self.userService.showToastr("info","The connectivity is gone because of heavy data loss. Please rejoin the call.","");
    }, 5000);
    }

    stopICEFailedTimer(medium) {
    if (this.iceFailedTimers[medium]) {
        clearInterval(this.iceFailedTimers[medium]);
        this.iceFailedTimers[medium] = null;
    }
    console.info("Stopped 'ICE failed' timer");
    }

    stopAllICEFailedTimers() {
        console.log("stopALL" , Object.keys(this.iceFailedTimers));
        for (const [key, value] of Object.entries(this.iceFailedTimers)) {
            console.log(`${key}: ${value}`);
            clearInterval(this.iceFailedTimers[key]);
          }
        this.iceFailedTimers = [];
    }


    listUserMedia(connect=false){
        QBVideoConferencingClient
        .listVideoInputDevices()
        .then(videoinputDevices => {
            this.userVideoInputDevices = videoinputDevices;
            if(this.userVideoInputDevices.length == 0){
                this.userService.showToastr("info","No video input found","")
            }else{
                if(connect){
                    console.log("video device id",this.userVideoInputDevices[0].deviceId);
                    this.switchVideoInput(this.userVideoInputDevices[0].deviceId,false);
                }
            }
            console.log("video input availble", videoinputDevices);
        });
        QBVideoConferencingClient
        .listAudioInputDevices()
        .then(audioInputDevices => {
            // handle as necessary
            this.userAudioInputDevices = audioInputDevices;
            if(this.userAudioInputDevices.length == 0){
                this.userService.showToastr("info","No Audio input found","")
            }else{
                if(connect){
                    console.log(this.userAudioInputDevices[0].deviceId);
                    this.switchAudioInput(this.userAudioInputDevices[0].deviceId, false);
                }
            }
            console.log("audio input availble", audioInputDevices)
        });
    }

    checkUserstreamAvailable(){
        this.listUserMedia(true);
    }

    ICERestartServer(userId){
        this.conferenceClient
            .iceRestart(userId)
            .then(function () {
            console.info("iceRestart success");
            })
            .catch(function (error) {
            console.warn("iceRestart error: " + JSON.stringify(error));
            });
    }

    /**
     *  Listener handler function  
     */
    createPluginHandlers(userId) {
        return {
          consentDialog: (on) => {
            console.info('Consent dialog should be ' + (on ? 'on' : 'off'));
          },
          mediaState: (media, receiving) => {
            console.group('mediaState.');
                console.log(
                    (userId ? 'REMOTE ' : 'LOCAL ') +
                    'MediaState (' + userId + '):  ' +
                    (receiving ? 'started' : 'stopped') +
                    ' receiving our ' + media
                );
            console.groupEnd();

            if (!userId) {
                // Trying to fix 'ICE failed' error.
                // If it's happened - then close current session.
            
                if (receiving) {
                    this.stopICEFailedTimer(media);
                } else {
                    //this.userService.showToastr("info","Stopped receiving our "+media, "" );
                    if(media == 'video'){
                        this.userVideoInputDevices = [];
                    }else{
                        //audio here
                        this.userAudioInputDevices = [];
                    }

                    if(this.userAudioInputDevices.length == 0 && this.userVideoInputDevices.length == 0){
                        //if both userinput devices is null so we have not received both media so its network issue
                        //we will run ice failed and stop the conference call.
                        this.runICEFailedTimer(media);
                    }
                    
                }
                
              }
            
          },
          webrtcState: (on, reason) => {
            console.group('webrtcState.');
                console.log(
                (userId ? 'REMOTE ' : 'LOCAL ') +
                'WebRTC PeerConnection is ' +
                (on ? 'up' : 'down' + ' now') +
                (reason ? ' (reason: ' + reason + ')' : '') +
                ' (userId: ' + userId + ')'
                );
            console.groupEnd();
            if (on && !userId) {
                this.listUserMedia();
                // if(reason == "(reason: ICE failed)"){
                //     this.ICERestartServer(userId);
                // }
            }
          },
          slowLink: (uplink, nacks) => {
            console.group('slowLink.');
                console.warn(
                (userId ? 'REMOTE ' : 'LOCAL ') +
                'slowLink detected (userId' + userId + '):' +
                'uplink: ' + uplink + '. nacks: ' + nacks
                );
            console.groupEnd();
          },
          iceState: (state) => {
            console.group('iceState.');
                console.info(
                (userId ? 'REMOTE ' : 'local ') + 'iceState (' + userId + '): ' + state
                );
            console.groupEnd();
            if (state === 'failed') {

                console.error(
                  'Peer connection has failed because of ICE failed.' +
                  ' User ID: ' + userId
                );
                console.info('Trying ICE restart...');
        
                // perform ICE restart
                this.ICERestartServer(userId);
              }
          },
          detached: () => {
            console.group('detached.');
                console.info(
                'The plugin handle has been detached' +
                (userId ? ' (userId: ' + userId + ')' : '')
                );
            console.groupEnd();
          },
          cleanup: () => {
            console.info("Got a cleanup notification (user " + userId + ")");
          }
        }
    }
}
