import {EventEmitter, Injectable} from '@angular/core';
import { DialogService } from './dialogs/dialog.service';
import { MessageService } from './messages/message.service';
import { UserChatService } from './user/user.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  public chatTabSelected : string = 'chat';

  private registeredContacts : any = [];

  public components = {
    chatsClicked: false, // For displaying OneToOne and Group Chats
    publicChatClicked: false, // For displaying Public Chats
    createGroupClicked: false, // For creating OneToOne and Group Chats
    onChatClick: false, // For displaying messages ( Dialog Component )
    welcomeChat: true, // Display default Welcome Chat screen
    updateDialog: false, // For displaying update dialog
    showNewChatPopup : false, //For displaying new chat popup
    showMyProfilePopup : false, // for displayeing my profile popup
    showMessageSettingPopup : false, // for displaying message setting pop up
    videoDialog :false, // To display the video call popup 
    videoConferenceDialog : false // for conference calling dailog
   };

  componentsEvent: EventEmitter<any> = new EventEmitter();

  constructor(public dialogService: DialogService,
    private userService: UserChatService) {
  }

  public showComponent(components: Object) {
    Object.entries(components).forEach(([key, value]) => {
      this.components[key] = value;
    });
    this.componentsEvent.emit(this.components);
  }

  setRegisterContacts(contacts){
    this.registeredContacts = contacts;
  }

  getRegisterContacts(){
    // to create a copy and send
    let registerUsers = this.registeredContacts.map(a => {return {...a}});
    return registerUsers;
  }

  resetRegisterContacts(){
    this.registeredContacts = [];
  }

  startChatWithRegisteredContacts(userId){
      const self = this;
      const type = 3;
      let selectedUsers :any = []
      selectedUsers.push(userId);
      selectedUsers.push(this.userService.user.id);
      const params = {
        type: type,
        occupants_ids:selectedUsers.join(',')
      };
  
      this.dialogService.createDialog(params).then(dialog => {
        if (dialog.type == 3){
          let id 
          if(dialog.occupants_ids[1] == self.userService.user.id){
            id = dialog.occupants_ids[0]
          }else{
            id = dialog.occupants_ids[1]
          }
          if (self.userService._usersCache[id] && self.userService._usersCache[id].custom_data) {
            dialog['custom_data'] = self.userService._usersCache[id].custom_data;
          }
        }
        (new Promise(function (resolve) {
          if (dialog.xmpp_room_jid) {
            self.dialogService.joinToDialog(dialog).then(() => {
              if (dialog.type === 3) {
                self.dialogService.dialogs[dialog._id] = dialog; 
              }
              resolve('');
            });
          }
          resolve('');
        })).then(() => {

          if (self.dialogService.dialogs[dialog._id] === undefined) {
            const tmpObj = {};
            tmpObj[dialog._id] = dialog;
            self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
            self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
          }
  
          this.dialogService.currentDialog = dialog;
          this.dialogService.currentDialogEvent.emit(dialog);
          this.chatTabSelected = 'chat'
          this.showComponent({
            'showNewChatPopup': false,
            'updateDialog': false,
            'welcomeChat': false,
            'onChatClick': true
          });
        });
      });
    

  }

}
