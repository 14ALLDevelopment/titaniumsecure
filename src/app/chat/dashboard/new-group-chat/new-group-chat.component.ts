import {Component, Input, OnInit} from '@angular/core';
import {Helpers} from 'src/app/shared/helper/helpers';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {MessageService} from 'src/app/chat/dashboard/messages/message.service';
import {CONSTANTS} from 'src/app/QBconfig';
import { QBHelper } from 'src/app/shared/helper/qbHelper';

declare var QB: any;
@Component({
  selector: 'app-new-group-chat',
  templateUrl: './new-group-chat.component.html',
  styleUrls: ['./new-group-chat.component.css']
})
export class NewGroupChatComponent implements OnInit {


  @Input() dialog: any;

  public loggedinUser: any;
  public userName: string;
  public users: any = [];
  public selectedUsers: number[] = [];
  public helpers: Helpers;
  public _usersCache: any;
  public messageField = '';
  public searchText :string ;
  showProfile : boolean = true;
  groupImage = '';
  uploading :boolean = false;

  constructor(
    private dashboardService: DashboardService,
    public dialogService: DialogService,
    private messageService: MessageService,
    private qbHelper: QBHelper,
    private userService: UserChatService) {
    this.helpers = Helpers;
    this._usersCache = this.userService._usersCache;
    this.userService.usersCacheEvent.subscribe((usersCache: Object) => {
      this._usersCache = usersCache;
    });
    this.loggedinUser = this.userService.user;
  }

  ngOnInit() {
    //console.log('ngOnInit');
    //this.getUserList('');
    this.getRegisterUser();
    this.selectedUsers.push(this.loggedinUser.id);
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

  goBack() {
    this.dashboardService.showComponent({
      'createGroupClicked': false,
      'updateDialog': false,
      'onChatClick': !this.dashboardService.components.welcomeChat
    });
  }

  getUserList(args) {
    this.userService.getUserList(args).then((users) => {
      this.users = users;
    }).catch((err) => {
      console.log('Get User List Error: ', err);
    });
  }

  getRegisterUser(){
    const users = this.dashboardService.getRegisterContacts();
    if(users.length > 0){
      // this.users = users.map((contact) => {
      //   return contact.user;
      // });
      this.users = users;
      //console.log("fetch register user", this.users);
    }
    if(this.loggedinUser){
      this.users.push(this.loggedinUser);
      this.users.reverse();
    }
  }

  handleFileInput(e) {
    let files = e.currentTarget.files;
    let mimeType = files[0].type;
    if(mimeType == "image/jpeg" || mimeType == "image/jpg" || mimeType == "image/png" ){
      this.uploading = true;
      //Show image preview
      // let reader = new FileReader();
      // reader.onload = (event: any) => {
      //   //this.imageUrl = event.target.result;
      // }

      // reader.readAsDataURL(files.item(0));
      this.groupImage = null;
      this.createAndUpload(files[0]);
      e.currentTarget.value = null;
    }else{
      this.userService.showToastr("info","Only Images is supported i.e jpg,jpeg,png", "");
      e.currentTarget.value = null;
    }
    
  }

  createAndUpload(file){
    if (file.size >= CONSTANTS.ATTACHMENT.MAXSIZE) {
      return alert(CONSTANTS.ATTACHMENT.MAXSIZEMESSAGE);
    }
    this.qbHelper.abCreateAndUpload(file ,true).
      then(response => {
        //console.log("file upload sucess",response)
        let url=  QB.content.publicUrl(response.uid);
        this.groupImage = url;
        //console.log("Image url : ", this.groupImage)
        this.uploading = false;
      }).catch(err => {
        this.userService.showToastr("error","Image not able to upload", "");
        console.log('ERROR: ' + err.detail);
      });
  }

  public onSubmit() {
    // Dialog type. There tree dialog types:
    // - type: 1 - public dialog.
    // - type: 2 - group dialog.
    // - type: 3 - private dialog.
    const self = this;
    const type = this.selectedUsers.length > 2 ? 2 : 2;
    const params = {
      type: type,
      occupants_ids: this.selectedUsers.join(',')
    };

    let name = '';

    if (type === 2) {
      const userNames = this.users.filter((array) => {
        return self.selectedUsers.indexOf(array.id) !== -1 && array.id !== this.loggedinUser.id;
      }).map((array) => {
        return array.full_name;
      });
      name = userNames.join(', ');
    }

    if (this.messageField) {
      name = this.messageField;
    }

    if (type === 2 && name) {
      params['name'] = name;
    }

    if(type === 2 && this.groupImage != ''){
      params['photo'] = this.groupImage;
    }

    this.dialogService.createDialog(params).then(dialog => {
      const
        occupantsNames = [];
      let messageBody = this.userService.user.full_name + ' created new dialog with: ';
      dialog['occupants_ids'].forEach(userId => {
        occupantsNames.push(this._usersCache[userId].name);
      });

      messageBody += occupantsNames.join(', ');

      const
        systemMessage = {
          body : dialog._id,
          extension: {
            SysMsgKey : 'SysMsgNewGroupDialog'
          }
        },
        notificationMessage = {
          type: 'groupchat',
          body: messageBody,
          extension: {
            save_to_history: 0,
            dialog_id: dialog._id,
            notification_type: 1,
            date_sent: Date.now()
          }
        };

      (new Promise(function (resolve) {
        if (dialog.xmpp_room_jid) {
          self.dialogService.joinToDialog(dialog).then(() => {
            if (dialog.type === CONSTANTS.DIALOG_TYPES.GROUPCHAT) {
              const
                message = self.messageService.sendMessage(dialog, notificationMessage),
                newMessage = self.messageService.fillNewMessageParams(self.userService.user.id, message);
              self.dialogService.dialogs[dialog._id] = dialog;
              self.dialogService.setDialogParams(newMessage);
              self.messageService.messages.push(newMessage);
              self.messageService.addMessageToDatesIds(newMessage);
              self.messageService.messagesEvent.emit(self.messageService.datesIds);
            }
            resolve('');
          });
        }
        resolve('');
      })).then(() => {

        const userIds = dialog.occupants_ids.filter((userId) => {
          return userId !== self.userService.user.id;
        });
        self.messageService.sendSystemMessage(userIds, systemMessage);
        if (self.dialogService.dialogs[dialog._id] === undefined) {
          const tmpObj = {};
          tmpObj[dialog._id] = dialog;
          self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
          self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
        }

        this.dialogService.currentDialog = dialog;
        this.dialogService.currentDialogEvent.emit(dialog);
        this.dashboardService.showComponent({
          'createGroupClicked': false,
          'updateDialog': false,
          'welcomeChat': true,
          'onChatClick': false
        });
      });
    });
  }


}
