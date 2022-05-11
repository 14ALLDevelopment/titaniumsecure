import {Component, Input, OnInit} from '@angular/core';
import {Helpers} from 'src/app/shared/helper/helpers';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {MessageService} from 'src/app/chat/dashboard/messages/message.service';
import {CONSTANTS} from 'src/app/QBconfig';

@Component({
  selector: 'app-new-chat',
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.css']
})
export class NewChatComponent implements OnInit {

  @Input() dialog: any;

  public loggedinUser: any;
  public userName: string;
  public users: any = [];
  public selectedUsers: number[] = [];
  public helpers: Helpers;
  public _usersCache: any;
  public messageField = '';

  isfetched :boolean = false;

  constructor(
    private dashboardService: DashboardService,
    public dialogService: DialogService,
    private messageService: MessageService,
    private userService: UserChatService) {
    this.helpers = Helpers;
    this._usersCache = this.userService._usersCache;
    this.userService.usersCacheEvent.subscribe((usersCache: Object) => {
      this._usersCache = usersCache;
    });
  }

  ngOnInit() {
    //this.getUserList('');
    this.getRegisterUser();
    this.loggedinUser = this.userService.user;
    this.selectedUsers.push(this.loggedinUser.id);
  }


  close() {
    this.dashboardService.showComponent({
      'showNewChatPopup' : false,
      'onChatClick': !this.dashboardService.components.welcomeChat
    });
  }

  //To fetch user by full_name
  getUserList(args) {
    this.userService.getUserList(args).then((users) => { 
      this.users = users.filter((array) => {
        return array.id !== this.loggedinUser.id;
      });
      this.isfetched = true;
      console.log("all users", this.users);
    }).catch((err) => {
      console.log('Get User List Error: ', err);
    });
  }

  getRegisterUser(){
    let users = this.dashboardService.getRegisterContacts();

    if(users.length > 0){
      // this.users = users.map((contact) => {
      //   return contact.user;
      // });
      this.users = users;
      //console.log("fetch register user", this.users)
      
    }
    this.isfetched = true;
  }

  onSelectedUser(userId: number){
    if(this.selectedUsers.length > 2){
      return false;
    }
    this.selectedUsers.push(userId);
    this.onSubmit();
  }

  public onSubmit() {
    const self = this;
    const type = 3;
    const params = {
      type: type,
      occupants_ids: this.selectedUsers.join(',')
    };

    this.dialogService.createDialog(params).then(dialog => {
      const
        occupantsNames = [];
      let messageBody = this.userService.user.full_name + ' created new dialog with: ';
      dialog['occupants_ids'].forEach(userId => {
        occupantsNames.push(this._usersCache[userId].name);
      });

      messageBody += occupantsNames.join(', ');

      if (dialog.type == 3){
        let id 
        if(dialog.occupants_ids[1] == this.loggedinUser.id){
          id = dialog.occupants_ids[0]
        }else{
          id = dialog.occupants_ids[1]
        }
        if (self.userService._usersCache[id] && self.userService._usersCache[id].custom_data) {
          dialog['custom_data'] = self.userService._usersCache[id].custom_data;
        }
      }

      const
        systemMessage = {
          extension: {
            notification_type: 1,
            dialog_id: dialog._id
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
          'showNewChatPopup': false,
          'updateDialog': false,
          'welcomeChat': false,
          'onChatClick': true
        });
      });
    });
  }


}
