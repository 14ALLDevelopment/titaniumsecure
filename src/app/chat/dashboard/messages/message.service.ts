import {EventEmitter, Injectable} from '@angular/core';
import {CONSTANTS} from 'src/app/QBconfig';
import {Helpers} from 'src/app/shared/helper/helpers';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import { VideoConferenceService } from '../video-group-call/video-conference-service';

declare var QB: any;

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  public messages: any = [];
  public datesIds: any = [];
  messagesEvent: EventEmitter<any> = new EventEmitter();
  public intersectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entrie) => {
      //console.log("entrie" , entrie.intersectionRatio, document.visibilityState)
      // if (document.visibilityState === 'visible' && entrie.isIntersecting) {
      if (document.visibilityState === 'visible' && entrie.intersectionRatio > 0) {
        //console.log("entrie" , entrie.intersectionRatio)
        const params = {
          messageId: entrie.target['dataset'].messageId,
          // tslint:disable-next-line:radix
          userId: parseInt(entrie.target['dataset'].userId),
          dialogId: entrie.target['dataset'].dialogId
        };
        const event = new CustomEvent('visibility', {
          detail: {
            dialogId: entrie.target['dataset'].dialogId,
            messageId: entrie.target['dataset'].messageId,
          }
        });
        entrie.target.dispatchEvent(event);
        QB.chat.sendReadStatus(params);
      }
    });
  }, {
    threshold: [0.6]
  });

  constructor(
    private userService: UserChatService,
    private dialogService: DialogService,
    private dashboardService: DashboardService,
    private videoConferenceService : VideoConferenceService,
  ) {
    QB.chat.onMessageListener = this.onMessageListener.bind(this);
    QB.chat.onSystemMessageListener = this.onSystemMessageListener.bind(this);
    QB.chat.onDeliveredStatusListener = this.onDeliveredStatusListener.bind(this);
    QB.chat.onReadStatusListener = this.onReadStatusListener.bind(this);
  }


  // Get Messages
  public getMessages(params): Promise<any> {
    return new Promise((resolve, reject) => {
      QB.chat.message.list(params, function (err, messages) {
        if (messages) {
          resolve(messages);
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
  }

  public deleteMessage(messageId) : Promise<any>{
    return new Promise((resolve, reject) => {
      let params = {
        force : 0
      }
      QB.chat.message.delete(messageId, params ,function (err, result) {
        if (result) {
          resolve(result);
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
  }

  public sendMessage(dialog, msg) {
    const
      message = JSON.parse(JSON.stringify(msg)),
      jidOrUserId = dialog.xmpp_room_jid || dialog.jidOrUserId || this.userService.getRecipientUserId(dialog.occupants_ids);
    message.id = QB.chat.send(jidOrUserId, msg);
    message.extension.dialog_id = dialog._id;
    return message;
  }

  public sendSystemMessage(userIds, systemMessage) {
    userIds.forEach((userId) => {
      QB.chat.sendSystemMessage(userId, systemMessage);
    });
  }

  public setMessages(messages, scrollTo): any {
    const
      self = this,
      uuid = messages.map((item) => {
        return item.sender_id;
      }).filter((value, index, array) => {
        return self.userService._usersCache[value] === undefined && array.indexOf(value) === index;
      });
    self.datesIds = [];
    //console.log('Unique User Ids: ', uuid);
    // Get User names in Messages List and add to cache
    (new Promise(function (resolve) {
      if (uuid.length > 0) {
        self.userService.getUserList({
          field: 'id',
          value: uuid,
          per_page: uuid.length
        }).then(resolve);
      } else {
        resolve('');
      }
    })).then(() => {
      messages.forEach( message => {
        if (!(message.date_sent instanceof Date)) {
          message.date_sent = new Date(+message.date_sent * 1000);
        }
        self.addMessageToDatesIds(message);
      });
      this.messages = messages;
      this.messagesEvent.emit(self.datesIds);
      //console.log("usercache", self.userService._usersCache)
      // setTimeout(() => {
      //   Helpers.scrollTo(document.querySelector('.scroll'), 'bottom');
      // },200);
    });
  }

  public addMessageToDatesIds(message) {
    const
      self = this,
      date = new Date(message.created_at),
      month = date.toLocaleString('en-us', {month: 'long'}),
      key = month + ' ' + date.getDate();
    if (self.datesIds[key] === undefined) {
      self.datesIds[key] = [];
    }
    message['status'] = self.getMessageStatus(message);
    if (message.attachments) {
      message.attachments = message.attachments.map(attachment => {
        //uid property is sent from , attachment.data is sent from android so handling accordingly.
        let uid = attachment.uid ? attachment.uid : (attachment.data ? attachment.data: null);
        if(uid){
          attachment.src = QB.content.publicUrl(uid) + '?token=' + QB.service.getSession().token;
        }
        return attachment;
      });
    }
    if (message.read_ids && message.read_ids.indexOf(self.userService.user.id) === -1) {
      message.visibilityEvent = true;
    }

    if (self.userService._usersCache[message.sender_id]) {
      if(self.userService._usersCache[message.sender_id].custom_data){
        message['custom_data'] = self.userService._usersCache[message.sender_id].custom_data;
      }
      message['full_name'] = self.userService._usersCache[message.sender_id].name;
    } else {
      if(message.sender_id == self.userService.user.id){
        if(self.userService.user.custom_data){
          message['custom_data']= self.userService.user.customdata;
        }    
        message['full_name'] = self.userService.user.full_name;
      }else{
        message['full_name'] = message.sender_id;
      }
    }
    self.datesIds[key].push(message);
  }

  public fillNewMessageParams(userId, msg) {
    const self = this,
      message = {
        _id: msg.id,
        attachments: [],
        created_at: +msg.extension.date_sent || Date.now(),
        date_sent: +msg.extension.date_sent || Date.now(),
        delivered_ids: [userId],
        message: msg.body,
        read_ids: [userId],
        sender_id: userId,
        chat_dialog_id: msg.extension.dialog_id,
        selfReaded: userId === this.userService.user.id,
        read: 0
      };

    if (msg.extension.attachments) {
      message.attachments = msg.extension.attachments;
    }

    if(msg.extension.message_deletion_duration){
      message['message_deletion_duration'] = msg.extension.message_deletion_duration;
    }

    if (msg.extension.notification_type) {
      message['notification_type'] = msg.extension.notification_type;
    }

    if (msg.extension.new_occupants_ids) {
      message['new_occupants_ids'] = msg.extension.new_occupants_ids;
    }

    message['status'] = (userId !== this.userService.user.id) ? self.getMessageStatus(message) : undefined;

    return message;
  }

  getMessageStatus(message) {
    if (message.sender_id !== this.userService.user.id) {
      return undefined;
    }
    const
      self = this,
      deleveredToOcuupants = message.delivered_ids.some(function (id) {
        return id !== self.userService.user.id;
      }),
      readedByOccupants = message.read_ids.some(function (id) {
        return id !== self.userService.user.id;
      });
    return !deleveredToOcuupants ? 'sent' :
      readedByOccupants ? 'read' : 'delivered';
  }

  private onSystemMessageListener = function (message) {
    if(message.userId == this.userService.user.id){
      return;
    }
    console.log("OnsystemMessage", message);
    const self = this;
    const dialogId = message.body ? message.body : (message.id ? message.id : message.extension.dialog_id );
    if (message.extension === undefined || dialogId === undefined) {
      return false;
    }
    // Events for conference call
    if(message.extension.SysMsgKey == "SysMsgGroupCall"){
      let sysMsg ={
        body : message.body,
        extension: {
          SysMsgKey : "SysMsgGroupCallReceived"
        }  
      }
      QB.chat.sendSystemMessage(message.userId, sysMsg);
      self.dialogService.getDialogById(message.body).then(function (dialog) {
        //console.log("sys", dialog);
        message['dialog'] = dialog;
        self.videoConferenceService.conferenceCallEvent.emit(message);        
      }).catch(error => {
        console.error(error);
        if(error.code == 401){
          self.userService.showToastr('info', "Session Timed Out", "Initialising auto-login ...");
          setTimeout(() => {
            self.userService.refreshFirebaseAndQBlogin();  
          }, 3000);
        }
      });
    }else if (message.extension.SysMsgKey == "SysMsgGroupCallEnd"){
      self.videoConferenceService.conferenceCallEvent.emit(message)
    }else if(message.extension.SysMsgKey == "SysMsgGroupCallReceived"){
      if(message.userId == self.userService.user.id){
        return;
      }
      self.videoConferenceService.conferenceCallEvent.emit(message)
    }else if(message.extension.SysMsgKey == "SysMsgSendBackConferenceType"){
      if(message.userId == self.userService.user.id){
        return;
      }
      if(self.videoConferenceService.callIsInProgress && this.dashboardService.components.videoConferenceDialog){
        let sysMsg = {
          body : this.dialogService.currentDialog._id,
          extension : {
              SysMsgKey: "SysMsgConferenceType",
              SysMsgKeyGroupCallType: self.videoConferenceService.callType
          }
        }
        QB.chat.sendSystemMessage(message.userId, sysMsg);
      }
    }else if( message.extension.SysMsgKey == "SysMsgConferenceType"){
      self.videoConferenceService.conferenceCallEvent.emit(message);
    }else if (message.extension.SysMsgKey == "SysMsgGroupCallStarted"){
      self.videoConferenceService.conferenceCallEvent.emit(message);
    } 

    if(message.extension.SysMsgKey == CONSTANTS.SYSTEM_MSG_KEY.NEW_DIALOG){
      self.dialogService.getDialogById(dialogId).then(function (dialog) {
        if((dialog.type == 2 && self.dashboardService.chatTabSelected == 'group') || dialog.type == 3 && self.dashboardService.chatTabSelected == 'chat'){
          if (dialog.xmpp_room_jid) {
            self.dialogService.joinToDialog(dialog);
          }
          const tmpObj = {};
          tmpObj[dialog._id] = dialog;
          self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
          self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
          self.userService.showToastr("info","You have been added to the group "+ dialog.name,"")
        }
      }).catch(error => {
        console.error(error);
      });
    }

    if(message.extension.SysMsgKey == CONSTANTS.SYSTEM_MSG_KEY.UPDATE_DIALOG){
      if(message.extension.SysMsgGroupAddRemoveDialog == 'Update' || message.extension.SysMsgGroupAddRemoveDialog == "Add"){
        self.dialogService.getDialogById(dialogId).then(dialog => {
          if((dialog.type == 2 && self.dashboardService.chatTabSelected == 'group') || dialog.type == 3 && self.dashboardService.chatTabSelected == 'chat'){
              if (dialog.xmpp_room_jid) {
                self.dialogService.joinToDialog(dialog);
              }
    
              if (self.dialogService.dialogs[dialog._id] === undefined) {
                const tmpObj = {};
                tmpObj[dialog._id] = dialog;
                self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
              }else{
                self.dialogService.dialogs[dialog._id] = dialog;
              }
              self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
              if( self.dialogService.currentDialog._id === dialog._id){
                self.dialogService.currentDialog = dialog;
                self.dialogService.currentDialogEvent.emit(dialog);
              }          
            // self.dashboardService.showComponent({
            //   'createGroupClicked': false,
            //   'updateDialog': false,
            //   'welcomeChat': false,
            //   'onChatClick': true
            // });
            //  self.userService.showToastr("info",""+ dialog.name+ " Group is updated","")
          }
        }).catch(error => {
          console.error(error);
        });
      }else if(message.extension.SysMsgGroupAddRemoveDialog == "Remove"){
        //remove the dialog as admin removed you
        if( self.dialogService.currentDialog._id === dialogId){
          self.dashboardService.showComponent({
              'createGroupClicked': false,
              'updateDialog': false,
              'welcomeChat': true,
              'onChatClick': false
            });
          self.userService.showToastr("info","Removed from the group " + self.dialogService.currentDialog.name ,"");
          self.dialogService.currentDialog = null;
        } 
        delete self.dialogService.dialogs[dialogId];
        self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
      }  
    }

    // switch (message.extension.notification_type) {
    //   case CONSTANTS.NOTIFICATION_TYPES.NEW_DIALOG :
    //     self.dialogService.getDialogById(message.extension.dialog_id).then(function (dialog) {
    //       if (
    //         (self.dashboardService.components.chatsClicked &&
    //           dialog.type !== CONSTANTS.DIALOG_TYPES.PUBLICCHAT) ||
    //         (!self.dashboardService.components.chatsClicked &&
    //           dialog.type === CONSTANTS.DIALOG_TYPES.PUBLICCHAT)
    //       ) {
    //         if (dialog.xmpp_room_jid) {
    //           self.dialogService.joinToDialog(dialog);
    //         }
    //         const tmpObj = {};
    //         tmpObj[dialog._id] = dialog;
    //         self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
    //         self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
    //       }
    //     }).catch(error => {
    //       console.error(error);
    //     });
    //     break;
    //   case CONSTANTS.NOTIFICATION_TYPES.UPDATE_DIALOG:
    //   case CONSTANTS.NOTIFICATION_TYPES.LEAVE_DIALOG:
    //     self.dialogService.getDialogById(dialogId).then(dialog => {
    //       if (dialog.xmpp_room_jid) {
    //         self.dialogService.joinToDialog(dialog);
    //       }
    //       const tmpObj = {};
    //       delete self.dialogService.dialogs[dialogId];
    //       tmpObj[dialogId] = dialog;
    //       self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
    //       self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
    //     });
    //     break;
    // }
  };


  getFileByUID(fileId){
    return new Promise((resolve, reject) => {
      QB.content.getFile(fileId, function (err, file) {
        // ...
        if (file) {
          resolve(file);
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
    
  }

  playNewMessageAudio(){
    let audio = new Audio();
    audio.src = "../../../assets/audio/New_Message_Tone.mp3";
    audio.load();
    audio.play();
  }
  

  private onMessageListener = function (userId, message) {
    this.playNewMessageAudio();
    const self = this;
    message.extension.date_sent = new Date(+message.extension.date_sent * 1000);
    message = self.fillNewMessageParams(userId, message);
    if (userId === self.userService.user.id) {
      return false;
    }
    if (message.markable) {
      QB.chat.sendDeliveredStatus({
        messageId: message._id,
        userId: userId,
        dialogId: message.chat_dialog_id
      });
    }
    self.dialogService.setDialogParams(message);
    if (message.chat_dialog_id === self.dialogService.currentDialog._id) {
      self.messages.push(message);
      self.addMessageToDatesIds(message);
      self.messagesEvent.emit(self.datesIds);
    }
  };

  private onReadStatusListener = function (messageId, dialogId) {
    const self = this;
    if (dialogId === self.dialogService.currentDialog._id) {
      for (const [key, messages] of Object.entries(self.datesIds)) {
        // @ts-ignore
        for (let i = 0; i < messages.length; i++) {
          if (messages[i]._id === messageId) {
            self.datesIds[key][i].status = 'read';
          }
        }
      }
      self.messagesEvent.emit(self.datesIds);
    }
  };

  private onDeliveredStatusListener = function (messageId, dialogId) {
    const self = this;
    if (dialogId === self.dialogService.currentDialog._id) {
      for (const [key, messages] of Object.entries(self.datesIds)) {
        // @ts-ignore
        for (let i = 0; i < messages.length; i++) {
          if (messages[i]._id === messageId && self.datesIds[key][i].status !== 'read') {
            self.datesIds[key][i].status = 'delivered';
          }
        }
      }
      self.messagesEvent.emit(self.datesIds);
    }
  };


}
