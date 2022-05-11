import {Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CONSTANTS} from 'src/app/QBconfig';
import {QBHelper} from 'src/app/shared/helper/qbHelper';
import {Helpers} from 'src/app/shared/helper/helpers';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {MessageService} from 'src/app/chat/dashboard/messages/message.service';
import { NgScrollbar } from 'ngx-scrollbar';
import { ToastrService } from 'ngx-toastr';
import { VideoService } from '../video-call/video-service';
import { VideoConferenceService } from '../video-group-call/video-conference-service';
import { Subscription } from 'rxjs';

declare var QB: any;

const message_deletion_duration = 120 ;

@Component({
  selector: 'app-dialogs',
  templateUrl: './dialogs.component.html',
  styleUrls: ['./dialogs.component.css','../../chat.component.css']
})
export class DialogsComponent implements OnInit, OnChanges , OnDestroy {

  @Input() dialog: any;
  @ViewChild('field') field: ElementRef;

  @ViewChild(NgScrollbar) scrollbarRef: NgScrollbar;

  chatName: string;
  CONSTANTS = CONSTANTS;
  messages: any = [];
  messageField = '';
  userId = this.userService.user.id;
  attachments: any = [];
  shiftDown = false;

  //To store the timeout ids
  timeOut = [];
  //timeOut obj with timeout ids and message ids
  timeOutObject = [];
  //message_deletion_duration
  message_deletion_duration : number;
  //messages loaded status
  messagesLoaded : boolean = false;
  // attachment uploading status
  attachment_uploading =  false

  //lighbox
  showFlag: boolean = false;
  selectedImageIndex: number = -1;
  imageObject : any =  []
  //Document 
  showDocument :boolean = false;
  documentAttachment;
  //video
  showVideo :boolean = false;
  videoAttachment;
  //subscription
  dailogEventSubscription: Subscription
  messageEventSubscription: Subscription

  constructor(
    private dashboardService: DashboardService,
    private dialogService: DialogService,
    private qbHelper: QBHelper,
    private userService: UserChatService,
    private messageService: MessageService,
    private toastr: ToastrService,
    public videoService : VideoService,
    public videoConferenceService : VideoConferenceService,
  ) {
    this.dailogEventSubscription = this.dialogService.currentDialogEvent.subscribe((dilog: Object) => {
      this.dialog = dilog;
    });
    this.messageEventSubscription = this.messageService.messagesEvent.subscribe((messages: Object) => {
      this.messages = Object.keys(messages).map(function (key) {
        return [key, messages[key]];
      });
      this.messages.forEach(message => {  
        if(message[1].length > 0){
          this.checkEphemeralMessages(message[1]);
        }
      });
    });
    
  }

  ngOnInit(){}

  ngOnChanges() {
    //check if there is ongoing call;
    if(this.dialog.type != 3){
      this.videoConferenceService.checkOngoingCall();
    }
    this.messagesLoaded = false;
    this.messageField = '';
    setTimeout(() => {
      this.field.nativeElement.focus();  
    });
    
    const
      self = this,
      params = {
        chat_dialog_id: this.dialog._id,
        sort_desc: 'date_sent',
        limit: 100,
        skip: 0,
        markAsRead: false
      };
    self.dialogService.currentDialog.full = false;
    this.messageService.getMessages(params)
      .then((res) => {
        if (res.items.length < 100) {
          self.dialogService.currentDialog.full = true;
          console.log("messages ==", res.items);
          self.clearTimeouts();
          self.checkEphemeralMessages(res.items);
        }
        this.messageService.setMessages(res.items.reverse(), 'bottom');
        setTimeout(() => {
          this.scrollbarRef.scrollTo({bottom: 0,duration: 0});
        }, 800);
      })
      .catch((err) => {
        console.log('Messages Error: ', err);
        if(err.code === 401){
          window.location.reload();
        }
      });
  }

  getMessageDeletionDuration(){
    this.message_deletion_duration = this.dialogService.getEphemeralduration(this.dialog,this.userId);
    if(!this.message_deletion_duration){
      this.message_deletion_duration = message_deletion_duration;
    }
    console.log("message delete duration",this.message_deletion_duration);
  }

  checkEphemeralMessages(messages :Array<any>){
    //console.log("check ephemeral",this.messages , this.messagesLoaded , messages);
    if(messages.length > 0){
      //this.clearTimeouts();
      messages.forEach(message => {
        if(!this.messageTimeoutExists(message._id) && !message.notification_type){
          //console.log("message not exists")
          if(message.message_deletion_duration){
            //console.log("date ",message.date_sent);
            let differenceSeconds  =  Helpers.getimeDifference(message.date_sent, new Date());
            //console.log("time difference", message.date_sent, message.message , differenceSeconds);
            if(differenceSeconds > message.message_deletion_duration  && message?.read_ids?.includes(this.userService.user?.id)){
              console.log("To delete", message.message, differenceSeconds); 
              this.deleteMessageFromQB(message._id);
            }else if (message?.read_ids?.includes(this.userService.user?.id)){ // msg already read but duration not completed
              console.log("read but timer not completed", differenceSeconds, message.message);
              let delay = message.message_deletion_duration - differenceSeconds ;
              let timeout = setTimeout(() => {
                this.deleteMessageFromQB(message._id);
              }, delay * 1000);
              let timeOutObj = {
                id: timeout,
                message_id : message._id,
              }
              this.timeOutObject.push(timeOutObj);
              //this.timeOut.push(timeout);
            }else{ // first time read
              console.log("FTR", message.message, differenceSeconds);
              let timer = setTimeout(() => {
                this.deleteMessageFromQB(message._id);
              }, message.message_deletion_duration * 1000);
              let timeOutObj = {
                id: timer,
                message_id : message._id,
              }
              this.timeOutObject.push(timeOutObj);
              //this.timeOut.push(timer);
            }
          }
        }
      });
    }
    setTimeout(() => {
      this.messagesLoaded = true;
      this.scrollbarRef.scrollTo({bottom: 0,duration: 0});
    },1000); 
  }

  //check if messsage id is in timeout
  messageTimeoutExists(id) {
    return this.timeOutObject.some((el) => {
      return el.message_id === id;
    }); 
  }

  // This is just to delete the message from local array.
  deleteMessage(id){ 
    this.messages.map(message =>{
      message[1].map((msg,index) => {
        if(msg._id === id){
          message[1].splice(index,1);
          return;
        }
      })
    });
  }
  /**
   * @description This function will delete the messages from qb history.
   * @param messageId Id of the qb message
   */
  deleteMessageFromQB(messageId){
    // to send read status before delete 
    // sometime unread counter stays.
    let params = {
      messageId: messageId,
      // tslint:disable-next-line:radix
      userId: parseInt(this.userService.user.id),
      dialogId: this.dialogService.currentDialog._id
    }
    QB.chat.sendReadStatus(params);
    this.messageService.deleteMessage(messageId).then(success => {
      if(success){
        this.deleteMessage(messageId);
      }
    }).catch(err => {});
  }

  /**
   * This is just for development purpose to delete all the messages
   */
  clearAllMessages(){
    this.messages.forEach(message => {  
      console.log("message", message);
      message[1].forEach(msg => {
        console.log("msg", msg);
        if(msg._id){
          this.deleteMessageFromQB(msg._id);
        }   
      });   
    });
  }

  loadMoreMessages(e) {
    const
      self = this,
      elem = e.currentTarget;
    if (this.dialogService.currentDialog.full !== undefined && this.dialogService.currentDialog.full) {
      delete elem.dataset.loading;
      return false;
    }
    if (elem.scrollTop < 150 && !elem.dataset.loading) {
      elem.dataset.loading = true;
      const params = {
        chat_dialog_id: this.dialog._id,
        sort_desc: 'date_sent',
        limit: 100,
        skip: this.messageService.messages.length,
        markAsRead: false
      };
      this.messageService.getMessages(params)
        .then((res) => {
          if (res.items.length < 100) {
            self.dialogService.currentDialog.full = true;
          }
          self.messageService.setMessages(
            res.items.reverse().concat(self.messageService.messages), 'top');
            delete elem.dataset.loading;
          })
        .catch((err) => {
          console.log('Messages Error: ', err);
        });
    }
  }

  public showUpdateDialog() {
    this.dashboardService.showComponent({
      'createGroupClicked': false,
      'updateDialog': true,
      'welcomeChat': false,
      'onChatClick': true
    });
  }

  toggleDeleteConfirmation(dialog){
    if(dialog.deleteConfirm){
      dialog.deleteConfirm = false;
    }else{
      dialog.deleteConfirm = true;
    }
   
  }

  public quitFromTheDialog() {
    const self = this,
      dialog = this.dialog;

    switch (dialog.type) {
      case CONSTANTS.DIALOG_TYPES.PUBLICCHAT:
        alert('you can\'t remove this dialog');
        break;
      case CONSTANTS.DIALOG_TYPES.CHAT:
      case CONSTANTS.DIALOG_TYPES.GROUPCHAT:
        if (CONSTANTS.DIALOG_TYPES.GROUPCHAT === dialog.type) {
          // remove user from current  group dialog;
          const msg = {
            type: 'groupchat',
            body: self.userService.user.full_name + ' left the chat.',
            extension: {
              save_to_history: 0,
              dialog_id: dialog._id,
              notification_type: 3,
              dialog_updated_at: Date.now() / 1000
            },
          };
          this.messageService.sendMessage(this.dialog, msg);
          const systemMessage = {
            body : dialog._id,
            extension: {
              SysMsgKey : "SysMsgUpdateGroupDialog",
              notification_type: 3,
              dialog_id: dialog._id
            }
          };
          const userIds = dialog.occupants_ids.filter((userId) => {
            return userId !== self.userService.user.id;
          });
          if(userIds.length){
            let sysMsg = systemMessage;
            sysMsg.extension['SysMsgGroupAddRemoveDialog'] = "Update";
            this.messageService.sendSystemMessage(userIds, sysMsg);
          }  
        }
        this.dialogService.deleteDialogByIds([this.dialog._id]);
        this.dashboardService.showComponent({
          'createGroupClicked': false,
          'updateDialog': false,
          'welcomeChat': true,
          'onChatClick': false
        });
        break;
    }
  }

  prepareToUpload(e) {
    const self = this,
      files = e.currentTarget.files,
      mimeType = files[0].type;
      console.log(files[0],"file");
      console.log(mimeType,"mime type");
      if(mimeType == "image/jpeg" || mimeType == "image/jpg" || mimeType == "image/png"
        || mimeType == 'video/mp4'
        || mimeType == 'application/pdf' || mimeType == "application/wps-office.pdf" 
        || mimeType == 'application/wps-office.docx' || mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        || mimeType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType == "application/wps-office.xlsx"){
        let dialogId = this.dialogService.currentDialog._id;
        for (let i = 0; i < files.length; i++) {
          self.uploadFilesAndGetIds(files[i], dialogId);
        }
        e.currentTarget.value = null;
      }
      else{
        this.showToastr("info","File selected is not supported, only supported files type are jpg, jpeg, png, mp4, pdf, docx, xlsx" , "");
        e.currentTarget.value = null;
      }
  }

  uploadFilesAndGetIds(file, dialogId) {
    if(file.type === 'video/mp4'){
      if (file.size >= CONSTANTS.ATTACHMENT_VIDEO.MAXSIZE) {
        return alert(CONSTANTS.ATTACHMENT_VIDEO.MAXSIZEMESSAGE);
      }
    }else{
      if (file.size >= CONSTANTS.ATTACHMENT.MAXSIZE) {
        return alert(CONSTANTS.ATTACHMENT.MAXSIZEMESSAGE);
      }
    }
    this.attachment_uploading = true;
    this.attachments = [{
      id: 'isLoading',
      src: URL.createObjectURL(file)
    }];
    const self = this;
    this.qbHelper.abCreateAndUpload(file).
      then(response => {
        let type ;
        if(file.type === 'video/mp4'){
          type = CONSTANTS.ATTACHMENT_VIDEO.TYPE
        }else if(file.type == 'application/pdf' || file.type == "application/wps-office.pdf"){
          type = CONSTANTS.ATTACHMENT_PDF.TYPE
        }else if (file.type == 'application/wps-office.docx' || file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
          type = CONSTANTS.ATTACHMENT_DOCX.TYPE
        }else if(file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type == "application/wps-office.xlsx"){
          type = CONSTANTS.ATTACHMENT_XLSX.TYPE
        } else {
          type = CONSTANTS.ATTACHMENT.TYPE
        }
        let url=  QB.content.publicUrl(response.uid) + '.json?token=' + QB.service.getSession().token;
        const attachments = [{id: response.blob_object_access.blob_id,
          uid : response.uid,
          type: type,
          url : url, name : file.name, size: file.size
        }];
        self.attachments = []
       // const attachments = [{id: response.uid, type: CONSTANTS.ATTACHMENT.TYPE}];
        let messageBody = file?.name ? file.name : CONSTANTS.ATTACHMENT.BODY
        self.sendMessage(messageBody, attachments);
        self.attachment_uploading = false;
      }).catch(err => {
        self.attachments = [];
        self.attachment_uploading = false;
        alert('ERROR: ' + err.detail);
      });
  }

  onSubmit() {
    if (this.messageField) {
      this.sendMessage(this.messageField);
      this.messageField = null;
    }
  }

  sendMessage(body, attachments: any = false) {
    this.getMessageDeletionDuration();
    const
      self = this,
      msg = {
        type: self.dialog.type === 3 ? 'chat' : 'groupchat',
        body: body,
        extension: {
          message_deletion_duration: this.message_deletion_duration, // for ephemeral setting
          save_to_history: 1,
          dialog_id: self.dialog._id
        },
        markable: 1
      };
    if (attachments) {
      msg.extension['attachments'] = attachments;
      msg.extension['file_sharing_control'] = 'view'
    }
    const
      message = self.messageService.sendMessage(self.dialog, msg),
      newMessage = self.messageService.fillNewMessageParams(self.userService.user.id, message);
      //console.log("message", newMessage)
    self.dialogService.setDialogParams(newMessage);
    self.messageService.messages.push(newMessage);
    self.messageService.addMessageToDatesIds(newMessage);
    self.messageService.messagesEvent.emit(self.messageService.datesIds);

    /**
    *  Below code is for ephemeral messages to delete the message from QB and locally
    */
    if(newMessage['message_deletion_duration'] && newMessage.selfReaded){
      let timer = setTimeout(() => {
        self.deleteMessageFromQB(newMessage._id);
      }, newMessage['message_deletion_duration'] * 1000);
      self.timeOut.push(timer);
    }
    setTimeout(() => {
      //Helpers.scrollTo(document.querySelector('.scroll'), 'bottom');
      this.scrollbarRef.scrollTo({bottom: 0,duration: 0});
    }, 500);
  }

  onKeydown(e) {
    if (e.repeat && e.key === 'Shift') {
      this.shiftDown = true;
    }
    if (e.key === 'Enter' && !this.shiftDown) {
      this.onSubmit();
      return false;
    }
  }

  // to open the ephemeral and file sharing setting popup
  openMessageSettingPopup () {
    this.dashboardService.showComponent({
      'showNewChatPopup' : false,
      'showMyProfilePopup' : false,
      'showMessageSettingPopup' : true
    })
  }

  openFullScreen(imgSrc){
    this.imageObject = [];
    let obj = {
      image : imgSrc
    }
    this.imageObject.push(obj);
    this.showLightbox(0);
    console.log(this.imageObject);
  }

  showLightbox(index) {
    this.selectedImageIndex = index;
    this.showFlag = true;
  }

  openDocumentPopup(attachment){
    this.documentAttachment = attachment;
    // console.log(this.documentAttachment);
    this.showDocument = true;
  }

  closeDocumentPopup(){
    this.showDocument = false;
    this.documentAttachment = null;
  }

  openVideoPopup(attachment){
    this.videoAttachment  = attachment;
    this.showVideo = true;
  }

  closeVideoPopup(){
    this.videoAttachment  = null;
    this.showVideo = false;
  }

  closeEventHandler() {
      this.imageObject = [];
      this.showFlag = false;
      this.selectedImageIndex = -1;
  }

  showToastr(type, msg, title) {
    this.toastr[type](msg, title, {
        progressBar: true,
        progressAnimation: 'increasing',
        timeOut: 1500,
        positionClass: 'toast-bottom-right',
    });
  }

  clearTimeouts(){
    // if(this.timeOut.length > 0){
    //   this.timeOut.forEach(id => {
    //     clearTimeout(id);
    //   });
    //   this.timeOut = [];
    // }

    if(this.timeOutObject.length > 0){
      console.log("clearing all timeouts");
      this.timeOutObject.forEach(timeout =>{
        clearTimeout(timeout.id);
      })
      this.timeOutObject = [];
    }
  }

  makeCall(){
    this.videoService.createSessionAndMakeCall(this.dialog.occupants_ids, "audio");
  }

  makeVideoCall(){
    this.videoService.createSessionAndMakeCall(this.dialog.occupants_ids, "video");
  }

  openVideoconference(callType){
    this.videoConferenceService.callType = callType;
    //console.log("open video conference component here", this.videoConferenceService.callType);
    this.dashboardService.showComponent({
      'videoConferenceDialog' : true,
    });
  }

  inProgress(){
    this.userService.showfunctionalityInProcess();
  }

  ngOnDestroy(){
    //this.dailogEventSubscription.unsubscribe();
    this.messageEventSubscription.unsubscribe();
    this.clearTimeouts()
  }

}
