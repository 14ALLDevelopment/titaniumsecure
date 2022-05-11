import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CONSTANTS} from 'src/app/QBconfig';

import {QBHelper} from 'src/app/shared/helper/qbHelper';
import {Helpers} from 'src/app/shared/helper/helpers';
import {UserChatService} from 'src/app/chat/dashboard/user/user.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {DashboardService} from 'src/app/chat/dashboard/dashboard.service';
import {MessageService} from 'src/app/chat/dashboard/messages/message.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';


declare var QB: any;
@Component({
  selector: 'app-update-group',
  templateUrl: './update-group.component.html',
  styleUrls: ['./update-group.component.css']
})
export class UpdateGroupComponent implements OnInit, OnDestroy {


  @Input() dialog: any;

  public loggedinUser: any;
  currentUser : any
  public userName: string;
  public users: any = [];
  public selectedUsers: number[] = [];
  public helpers: Helpers;
  public _usersCache: any;
  public searchText :string ;

  // for group picture
  groupImage: any;
  uploading :boolean =false;

  // for Group's name
  groupNameForm : FormGroup;

  //message setting 

  ephemeralSettingForm : FormGroup;
  fileSharingForm  : FormGroup;
  ephemeralDurationArr : Array<any> = [];
  fileSharingArr  : Array<any> = [];

  //Tohide show content 
  userAddShow : boolean = false;
  showProfile : boolean = false;
  showMessageSettings : boolean = false;
  showMembers : boolean = true;

  //to check if is user is fetched
  isfetched :boolean = false;

  //all subscription
  subscriptions:Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private qbHelper: QBHelper,
    private fb: FormBuilder,
    public dialogService: DialogService,
    private userService: UserChatService,
    private messageService: MessageService
  ) {
    this.helpers = Helpers;
    this._usersCache = this.userService._usersCache;
    this.currentUser = this.userService?.user;
    this.subscriptions.push(
      this.userService.usersCacheEvent.subscribe((usersCache: Object) => {
        this._usersCache = usersCache;
      }));
    this.subscriptions.push(
      this.dialogService.currentDialogEvent.subscribe((dilog: Object) => {
        this.dialog = dilog;
        this.selectedUsers = []
        this.ngOnInit();
      }));
  }

  ngOnInit() {
    this.initForm();
    //this.getUserList('');
    this.getRegisterUser();
    this.selectedUsers = this.selectedUsers.concat(this.dialog.occupants_ids);
    this.setephemeralValue();
    this.setFilesharingControl();
    //console.log("SU",this.dialog)
  }


  initForm(){
    this.groupNameForm = new FormGroup({
      groupName : new FormControl(this.dialog.name , [ Validators.required ])
    });

    this.ephemeralSettingForm = this.fb.group({
      defaultTime: true, // this is the checkbox
      customTime: [{ value: null, disabled: false }],
    });

    this.fileSharingForm = this.fb.group({
      view : true,
      all : false
    })

    this.checkboxChangeListener();
  }

  checkboxChangeListener(){
    this.ephemeralSettingForm.get('defaultTime').valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
    ).subscribe(v => {
      //console.log("changes", v)
      if (v) {
        this.ephemeralSettingForm.get('customTime').setValue('');
      }
    });

    this.ephemeralSettingForm.get('customTime').valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(v => {
      //console.log("changes", v)
      if (v) {
        this.ephemeralSettingForm.get('defaultTime').setValue(false);
      }
    });

    //file sharing control value change listener
    this.fileSharingForm.get('view').valueChanges.subscribe(v => {
      if (v) {
        this.fileSharingForm.get('all').setValue(false);
      }
    });

    this.fileSharingForm.get('all').valueChanges.subscribe(v => {
      if (v) {
        this.fileSharingForm.get('view').setValue(false);
      }
    });
  }

  toggleSelectItem(userId: number) {
    console.log(userId, this.dialog.occupants_ids)
    const index = this.selectedUsers.indexOf(userId);
    // if (this.dialog.occupants_ids.indexOf(userId) !== -1) {
    //   return false;
    // }
    if(userId == this.dialog.user_id){
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
      this.isfetched = true;
    }).catch((err) => {
      console.log('Get User List Error: ', err);
      if(err.code == 401){
        this.userService.showToastr("info", "Session timed out","");
        window.location.reload();
      }
    });
  }

  getRegisterUser(){
    let users = this.dashboardService.getRegisterContacts();
    if(users.length > 0){
      // this.users = users.map((contact) => {
      //   return contact.user;
      // });
      this.users =users;
      //console.log("fetch register user", this.users);
    }
    this.isfetched = true;
    // if(this.loggedinUser){
    //   this.users.push(this.loggedinUser);
    //   this.users.reverse();
    // }
  }

  showTitle(e) {

    const
      editTitleForm = document.forms['update_chat_name'],
      editTitleInput = editTitleForm.update_chat__title;

    editTitleForm.classList.toggle('active');

    if (editTitleForm.classList.contains('active')) {
      editTitleInput.removeAttribute('disabled');
      editTitleInput.focus();
    } else {
      editTitleInput.setAttribute('disabled', true);

      const params = {
        id: this.dialog._id,
        title: editTitleInput.value.trim()
      };

      if (this.dialog.name !== params.title) {

        if (this.dialog.type !== CONSTANTS.DIALOG_TYPES.GROUPCHAT) {
          return false;
        }
        const self = this,
          dialogId = this.dialog._id,
          toUpdateParams = {},
          updatedMsg = {
            type: 'groupchat',
            body: '',
            extension: {
              save_to_history: 1,
              dialog_id: dialogId,
              notification_type: 2,
              dialog_updated_at: Date.now() / 1000
            },
            markable: 1
          };

        toUpdateParams['name'] = params.title;
        updatedMsg.extension['dialog_name'] = params.title;
        updatedMsg.body = self.userService.user.full_name + ' changed the conversation name to "' + params.title + '".';

        const
          systemMessage = {
            extension: {
              notification_type: 2,
              dialog_id: dialogId
            }
          };

        self.updateDialog(toUpdateParams, updatedMsg, systemMessage, false );

        editTitleForm.classList.remove('active');
      }

    }

  }

  private updateDialog(toUpdateParams, updatedMsg, systemMessage, onChatClick = true) {
    if (this.dialog.type !== CONSTANTS.DIALOG_TYPES.GROUPCHAT) {
      return false;
    }

    const self = this,
      dialogId = this.dialog._id;

    this.dialogService.updateDialog(dialogId, toUpdateParams)
      .then(function (dialog) {
        self.dialogService.joinToDialog(dialog).then(() => {
          if (self.dialogService.dialogs[dialog._id] !== undefined) {
            self.dialogService.dialogs[dialog._id] = dialog;
            self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
          }
          
          // const
          //   message = self.messageService.sendMessage(dialog, updatedMsg),
          //   newMessage = self.messageService.fillNewMessageParams(self.userService.user.id, message);
          // self.dialogService.dialogs[dialog._id] = dialog;
          // self.dialogService.setDialogParams(newMessage);
          // self.messageService.messages.push(newMessage);
          // self.messageService.addMessageToDatesIds(newMessage);
          // self.messageService.messagesEvent.emit(self.messageService.datesIds);
        });

        self.sendSystemMessage(dialog,systemMessage,toUpdateParams);
        
        if (self.dialogService.dialogs[dialog._id] === undefined) {
          const tmpObj = {};
          tmpObj[dialog._id] = dialog;
          self.dialogService.dialogs = Object.assign(tmpObj, self.dialogService.dialogs);
          self.dialogService.dialogsEvent.emit(self.dialogService.dialogs);
        }
        self.dialogService.currentDialog = dialog;
        self.dialogService.currentDialogEvent.emit(dialog);
        if (onChatClick) {
          self.dashboardService.showComponent({
            'createGroupClicked': false,
            'updateDialog': false,
            'welcomeChat': false,
            'onChatClick': true
          });
        }
      }).catch(function (error) {
      console.error(error);
    });
  }

  sendSystemMessage(dialog,systemMessage,toUpdateParams){

    let totalarray=[];let addRemove=[];let updateArray=[];

    if(toUpdateParams?.push_all ){
      //totalarray = [...toUpdateParams.push_all.occupants_ids, ...dialog.occupants_ids]
      if(toUpdateParams?.pull_all){
        addRemove = [...toUpdateParams.push_all.occupants_ids, ...toUpdateParams.pull_all.occupants_ids]
      }else{
        addRemove = toUpdateParams.push_all.occupants_ids;
      }
    }else{
      //totalarray = dialog.occupants_ids;
      if(toUpdateParams?.pull_all){
        addRemove = toUpdateParams.pull_all.occupants_ids;
      } 
    }
    totalarray = dialog.occupants_ids;

    // console.log("Total", totalarray);
    if(addRemove.length){
      updateArray = totalarray.filter(function(n) {
        return addRemove.indexOf(n) == -1;
      });
    }else{
      updateArray = totalarray;
    }
    const userIds = updateArray.filter((userId) => {
      return userId !== this.userService.user.id;
    });
    if(updateArray.length){
      let sysMsg = systemMessage;
      sysMsg.extension['SysMsgGroupAddRemoveDialog'] = "Update";
      console.log("update tobe sent to", userIds, sysMsg);
      this.messageService.sendSystemMessage(userIds, sysMsg);
    }
    if(toUpdateParams?.pull_all){
      let sysMsg = systemMessage;
      sysMsg.extension['SysMsgGroupAddRemoveDialog'] = "Remove";
      console.log("remove tobe sent to",toUpdateParams?.pull_all.occupants_ids ,sysMsg);
      this.messageService.sendSystemMessage(toUpdateParams?.pull_all.occupants_ids, sysMsg);
    }
    if(toUpdateParams?.push_all ){
      
      let sysMsg = systemMessage;
      sysMsg.extension['SysMsgGroupAddRemoveDialog'] = "Add";
      console.log("add tobe sent to",toUpdateParams?.push_all.occupants_ids , sysMsg);
      this.messageService.sendSystemMessage(toUpdateParams?.push_all.occupants_ids, sysMsg);
    }
    
  }

  public onSubmit() {
    if (this.dialog.type !== CONSTANTS.DIALOG_TYPES.GROUPCHAT) {
      return false;
    }
    const self = this,
      dialogId = this.dialog._id,
      newUsers = this.selectedUsers.filter(function (occupantId) {
        return self.dialog.occupants_ids.indexOf(occupantId) === -1;
      }),
      removeUsers = this.dialog.occupants_ids.filter((occupantId) =>{
        return self.selectedUsers.indexOf(occupantId) === -1
      }),
      updatedMsg = this.setGroupMessage(newUsers,removeUsers),
      toUpdateParams = {}

    if ('updates.userList' === 'updates.userList' && newUsers.length) {
      toUpdateParams['push_all'] = {
        occupants_ids: newUsers
      };
    }
    if('updates.userList' === 'updates.userList' && removeUsers.length){
      toUpdateParams['pull_all']={
        occupants_ids : removeUsers
      }
    }
    //set the message setting here
    this.updateFileSharingData();
    this.updateEphemeraldata();
    let dailog_data = {
      EphemeralMessageDuration : this.ephemeralDurationArr,
      FileSharingControl: this.fileSharingArr,
      class_name: "dialog_data"
    }
    toUpdateParams['data'] = dailog_data

    if(this.groupImage != ''){
      toUpdateParams['photo'] = this.groupImage;
    }

    //check if user has change the form value.
    if(this.groupNameForm.dirty){
      toUpdateParams['name'] = this.groupNameForm.get('groupName').value;
    }
    
    const systemMessage = {
      body: dialogId,
      extension: {
        SysMsgKey : "SysMsgUpdateGroupDialog",
        notification_type: 2,
        dialog_id: dialogId,
        new_occupants_ids: newUsers.toString(),
        removed_occupants_ids: removeUsers.toString()
      }
    };
    console.log("update params", toUpdateParams);
    this.sendSystemMessage(this.dialog,systemMessage,toUpdateParams);
    self.updateDialog(toUpdateParams, updatedMsg, systemMessage, true);
    this.ephemeralDurationArr = [];
    this.fileSharingArr = [];
  }

  //this is to set the group msg when removed or added.
  setGroupMessage(newUsers,removeUsers){
    const self = this,
      dialogId = this.dialog._id,
      removedusernames = removeUsers.map(function (userId) {
        return self._usersCache[userId].name || userId;
      }),
      usernames = newUsers.map(function (userId) {
        return self._usersCache[userId].name || userId;
      }),
      
      updatedMsg = {
        type: 'groupchat',
        body: '',
        extension: {
          save_to_history: 0,
          dialog_id: dialogId,
          notification_type: 2,
          dialog_updated_at: Date.now() / 1000,
          new_occupants_ids: newUsers.join(',')
        },
        markable: 1
      };

    if ('updates.userList' === 'updates.userList' && newUsers.length) {
      if(removeUsers.length){
        updatedMsg.body = self.userService.user.full_name + ' added ' + usernames.join(', ');
      }else{
        updatedMsg.body = self.userService.user.full_name + ' added ' + usernames.join(', ') + '.';
      }
      
      updatedMsg.extension['new_occupants_ids'] = newUsers.join(',');
    }
    if(removeUsers.length){
      if(newUsers.length){
        updatedMsg.body = updatedMsg.body + ' &' + ' removed ' + removedusernames.join(', ') + '.';
      }else{
        updatedMsg.body = self.userService.user.full_name + ' removed ' + removedusernames.join(', ') + '.';
      }
     
      updatedMsg.extension['removed_occupants_ids'] = removeUsers.join(',');
    }
    return updatedMsg;
  }

  setephemeralValue(){
    if(this.dialog?.data && this.dialog?.data?.EphemeralMessageDuration){   
      this.setEphemeralArray();
      console.log("parsed array", this.ephemeralDurationArr);
      this.ephemeralDurationArr.forEach(element => {   
        Object.keys(element).forEach(key => {
          if(key == this.currentUser.id){
            this.ephemeralSettingForm.get('customTime').setValue(element[key]);
            this.ephemeralSettingForm.get('defaultTime').setValue(false);
          }
          //console.log(key + ' - ' + element[key]) // key - value
        })
      });
    }
  }

  setEphemeralArray(){
    if(this.dialog?.data && this.dialog?.data?.EphemeralMessageDuration){ 
      this.ephemeralDurationArr = this.dialog.data.EphemeralMessageDuration.map((value) => {
        try {
          return JSON.parse(value);
        } catch (e) {
          return "";
        }
      });
    }
  }

  stringifyEphemeralArray(){
    this.ephemeralDurationArr = this.ephemeralDurationArr.map((value) => {
      if(value != ""){
        return JSON.stringify(value);
      }else{
        return value
      }
    });
  }

  removeEphemeralData(){
    this.ephemeralDurationArr.forEach((element,index , array) => {
      if(element == ""){
        array.splice(index, 1);
      }
      Object.keys(element).forEach(key => {
        //console.log(key + ' - ' + element[key] , this.currentUser.id) // key - value
        if(key == this.currentUser.id){
          array.splice(index,1)
        }
      })
    });
  }

  // all functions for setting up and managing the file sharing control
  setFilesharingControl(){
    if(this.dialog?.data && this.dialog?.data?.FileSharingControl){   
      this.setFileSharingArray();
      console.log("parsed array", this.fileSharingArr);
      this.fileSharingArr.forEach(element => {   
        Object.keys(element).forEach(key => {
          //console.log(key + ' - ' + element[key]) // key - value
          if(key == this.currentUser.id){
            if(element[key] == 'all'){
              this.fileSharingForm.get('all').setValue(true);
              this.fileSharingForm.get('view').setValue(false);
            }else if (element[key] == 'view'){
              this.fileSharingForm.get('view').setValue(true);
              this.fileSharingForm.get('all').setValue(false);
            }else{
              this.fileSharingForm.get('view').setValue(false);
              this.fileSharingForm.get('all').setValue(false);
            }
          }    
        })
      });
    }
  }

  setFileSharingArray(){
    if(this.dialog?.data && this.dialog?.data?.FileSharingControl){
      this.fileSharingArr = this.dialog.data.FileSharingControl.map((value) => {
        try {
          return JSON.parse(value);
        } catch (e) {
          return "";
        }
      });
    } 
  }

  removeFileSharingData(){
    this.fileSharingArr.forEach((element,index , array) => {
      if(element == ""){
        array.splice(index, 1);
      }
      Object.keys(element).forEach(key => {
        //console.log(key + ' - ' + element[key] , this.currentUser.id) // key - value
        if(key == this.currentUser.id){
          array.splice(index,1)
        }
      })
    });
  }

  stringifyFileSharingArray(){
    this.fileSharingArr = this.fileSharingArr.map((value) => {
      if(value != ""){
        return JSON.stringify(value);
      }else{
        return value;
      }
      
    });
  }

  updateEphemeraldata(){
    this.setEphemeralArray();
    if(!this.ephemeralSettingForm.get('defaultTime').value){
      let obj = {}
      obj[""+this.currentUser.id+""] = parseInt(this.ephemeralSettingForm.get('customTime').value);
      console.log("Custom ephemeral Value to set :", obj);
      if(this.ephemeralDurationArr.length > 0){
        this.removeEphemeralData();
        this.stringifyEphemeralArray();
      }
      this.ephemeralDurationArr.push(JSON.stringify(obj));
      console.log(this.ephemeralDurationArr,"array")
    }else{
      if(this.ephemeralDurationArr.length > 0){
        this.removeEphemeralData();
        this.stringifyEphemeralArray();
      }
      console.log(this.ephemeralDurationArr,"array remove")
    }

    if(this.ephemeralDurationArr.length == 0){
      this.ephemeralDurationArr.push("");
    }
  }

  updateFileSharingData(){
    this.setFileSharingArray();

    let obj = {}
    if(this.fileSharingForm.get('all').value){
      obj[""+this.currentUser.id+""] = "all"
      console.log("file sharing option set to all:", obj);
    }else if(this.fileSharingForm.get('view').value){
      obj[""+this.currentUser.id+""] = "view"
      console.log("file sharing option set to view:", obj);
    }else{
      obj[""+this.currentUser.id+""] = ""
      console.log("file sharing option set to none:", obj);
    }
    
    if(this.fileSharingArr.length > 0 ){
      this.removeFileSharingData();
      this.stringifyFileSharingArray();
    }
    if(obj){
      this.fileSharingArr.push(JSON.stringify(obj));
    }
  
    if(this.fileSharingArr.length == 0){
      this.fileSharingArr.push("");
    }
  }

  toggleAddShowUserList(){
    this.userAddShow = !this.userAddShow
  }

  toggleProfileView(){
    this.showProfile = !this.showProfile;
    this.showMessageSettings = false;
    this.showMembers = false;
  }

  toggleMessageSettingView(){
    this.showMessageSettings = !this.showMessageSettings;
    this.showMembers = false;
    this.showProfile = false;
  }

  toggleMembersView(){
    this.showMembers = !this.showMembers;
    this.showProfile = false;
    this.showMessageSettings = false;
  }

  createAndUpload(file){
    if (file.size >= CONSTANTS.ATTACHMENT.MAXSIZE) {
      return alert(CONSTANTS.ATTACHMENT.MAXSIZEMESSAGE);
    }
    this.qbHelper.abCreateAndUpload(file ,true).
      then(response => {
        console.log("file upload sucess",response)
        this.groupImage = QB.content.publicUrl(response.uid);
        this.uploading = false;
        console.log("Image url : ", this.groupImage)
      }).catch(err => {
        console.log('ERROR: ' + err.detail);
      });
  }

  handleFileInput(e) {
    let files = e.currentTarget.files;
    let mimeType = files[0].type;
    if(mimeType == "image/jpeg" || mimeType == "image/jpg" || mimeType == "image/png" ){
      this.uploading = true;
      this.groupImage = null;
      this.createAndUpload(files[0]);
      e.currentTarget.value = null;
    }else{
      this.userService.showToastr("info","Only Images is supported i.e jpg,jpeg,png", "");
      e.currentTarget.value = null;
    }
    
  }

  ngOnDestroy(){
    // prevent memory leak when component destroyed
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
