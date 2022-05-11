import {AfterViewInit, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {DashboardService} from './dashboard.service';
import {DialogService} from 'src/app/chat/dashboard/dialogs/dialog.service';
import {UserChatService} from './user/user.service';
import {QBHelper} from '../../shared/helper/qbHelper';
import {Helpers} from 'src/app/shared/helper/helpers';
import {MessageService} from './messages/message.service';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { GoogleContactService } from 'src/app/shared/services/google.contact.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { VideoService } from './video-call/video-service';
import { VideoConferenceService } from './video-group-call/video-conference-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css','../chat.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit{

  public config: PerfectScrollbarConfigInterface = {}
  loggedinUser: any;

  public chats: any = [];
  public allContacts : any= [];
  public contactFetched : any = [];
  public registeredContacts : any = [];
  public isfetched : boolean  = false;
  public isAddressBookFetched : boolean = false;

  chatsClicked = false; // For displaying OneToOne and Group Chats
  publicChatClicked = false; // For displaying Public Chats
  createGroupClicked = false; // For creating OneToOne and Group Chats
  onChatClick = false; // For displaying messages ( Dialog Component )
  welcomeChat = true; // Display default Welcome Chat screen
  updateDialog = false; // For displaying update dialog

  showNewChatPopup :boolean = false // To display the new chat popup
  showMyProfilePopup :boolean = false // To display the Profile popup
  showMessageSettingPopup : boolean = false // to display message setting popup
  videoDialog = false;
  videoConferenceDialog = false // for conference call
  searchText : string ; // Search text use to search chat

  dialog: any;
  selectedChat: string;
  private successUnSubscribe$;

  constructor(
    public dashboardService: DashboardService,
    public dialogService: DialogService,
    private userService: UserChatService,
    private qbHelper: QBHelper,
    private googleContactService : GoogleContactService,
    private messageService: MessageService,
    private firebaseService :FirebaseService,
    private videoService : VideoService,   //init the service
    private videoConferenceService : VideoConferenceService, // init the service
    private router: Router) {

    this.successUnSubscribe$ = this.userService.successSubject.subscribe(event =>{
      console.log("login success", event)
        if(event){
          this.initAppData();
        }
    });

    this.dialogService.dialogsEvent.subscribe((chatData: any[]) => {
      this.chats = Object.values(chatData);
    });
    this.dialogService.currentDialogEvent.subscribe((dialog) => {
      this.selectedChat = dialog._id;
      this.dialog = dialog;
    });
    this.dashboardService.componentsEvent.subscribe((components: Object) => {
      Object.entries(components).forEach(([key, value]) => {
        this[key] = value;
      });
    });

    this.videoConferenceService.conferenceCallEvent.subscribe((conferenceEvent)=>{
      //console.log("conference event",conferenceEvent);
      if(conferenceEvent.extension && conferenceEvent.extension.SysMsgKey == "SysMsgGroupCall"){
        if(!this.videoConferenceService.showCalling && !this.videoConferenceService.isInCall){
          if(conferenceEvent.dialog){
            this.videoConferenceService.currentdailog = conferenceEvent.dialog;
            //this.dialog = conferenceEvent.dialog;
            this.videoConferenceService.showCalling = true;
            this.videoConferenceService.toggleRingToneAudio('start');
            if(conferenceEvent.extension.SysMsgKeyGroupCallType){
              // 1- video call , 2 - audio call
              this.videoConferenceService.callType = conferenceEvent.extension.SysMsgKeyGroupCallType;
            }
            //if no user input then 60 sec time out.
            setTimeout(() => {
              if(this.videoConferenceService.showCalling){
                this.videoConferenceService.showCalling = false;
                this.videoConferenceService.currentdailog = null;
                this.videoConferenceService.toggleRingToneAudio('end');
              }
            }, 60000);
          }  
        }
      }else if (conferenceEvent.extension && conferenceEvent.extension.SysMsgKey == "SysMsgGroupCallEnd"){
        if(this.videoConferenceService.showCalling){
          this.videoConferenceService.showCalling = false;
          this.videoConferenceService.currentdailog = null;
        }else if (this.videoConferenceService.callIsInProgress && !this.dashboardService.components.videoConferenceDialog){
          if(this.dialogService.currentDialog._id == conferenceEvent.body){
            this.videoConferenceService.callIsInProgress = false;
            this.videoConferenceService.callType = 0
          }
        }
      }else if(conferenceEvent.extension && conferenceEvent.extension.SysMsgKey == "SysMsgGroupCallReceived" ){
        this.videoConferenceService.stopSysMessage(conferenceEvent.userId);
      }else if(conferenceEvent.extension && conferenceEvent.extension.SysMsgKey == "SysMsgConferenceType" ){
        if(!this.videoConferenceService.showCalling && !this.videoConferenceService.callIsInProgress){
          if(this.dialogService.currentDialog._id == conferenceEvent.body){
            this.videoConferenceService.callIsInProgress = true;
            this.videoConferenceService.callType = conferenceEvent.extension.SysMsgKeyGroupCallType;
          }
        } 
      }else if( conferenceEvent.extension && conferenceEvent.extension.SysMsgKey == "SysMsgGroupCallStarted" ){
        if(this.dialogService.currentDialog._id === conferenceEvent.body){
          if(!this.videoConferenceService.showCalling && !this.videoConferenceService.callIsInProgress){
            this.videoConferenceService.callIsInProgress = true;
            this.videoConferenceService.callType = conferenceEvent.extension.SysMsgKeyGroupCallType;
          }
        }
      }
  })

    this.googleContactService.contactFetched.subscribe((contacts: any[]) => {
      //this.contactFetched = contacts;
      this.prepareToUploadContacts(contacts);
      
    });

    this.userService.proFileUpdateEvent.subscribe((updatedUser: Object) => {
      this.getLoggedInUser();
    });

    this.initAppData();
  }

  async fetchAddressbook(){
    this.isAddressBookFetched = false;
    await this.getAddressBook('android');
    await this.getAddressBook('ios');
    await this.getAddressBook();
    this.fetchRegisterUsers();
    setTimeout(() => {
      this.isAddressBookFetched = true;  
    },1000);
  }

  async fetchRegisterUsers(){
    this.dashboardService.resetRegisterContacts();
    await this.getRegisterUser('android');
    await this.getRegisterUser('ios');
    await this.getRegisterUser();
  }

  // @HostListener('window:focus', ['$event'])
  // onFocus(event: any): void {
  //     // check qb session is active or not    
  //     console.log("checking qb session", this.qbHelper.getSession());
  // }

  ngOnInit() {}

  initAppData(){
    this.welcomeChat = true;
    this.getLoggedInUser();
    this.getChatList('chat');
    this.fetchAddressbook();
  }

  ngAfterViewInit(){
    this.initGoogleclient();
  }

  getLoggedInUser(){
    this.loggedinUser = this.userService.user;
    //console.log('Logged In === ', this.loggedinUser);
    if(this.loggedinUser &&  this.loggedinUser.custom_data){
      try {
        this.loggedinUser.custom_data = JSON.parse(this.loggedinUser.custom_data);
      } catch (e) {}
      // if(this.loggedinUser.custom_data.ProfilePublicUrl){
      //   const url = this.loggedinUser.custom_data.ProfilePublicUrl.split('.').slice(0, -1).join('.');
      //   this.loggedinUser.custom_data.ProfilePublicUrl = url
      // }
    }
    
  }

  getRegisterUser(type='web'){
    this.qbHelper.qbRetriveRegisterAddressBook(type).then((res : any)=>{
      //console.log("Register contacts retrieved",type ,res);
      if(res && res['items']){
        let filterarr :any = []
         //filter the logged in user number
         res['items'] = res['items'].filter((contact) => {
          // if(contact.user && contact.user.custom_data){
          //   contact.user.custom_data = JSON.parse(contact.user.custom_data);
          // }
          return contact.user.phone !== this.userService.user.phone;
        });
        this.registeredContacts = [...this.registeredContacts, ...res['items']] ;
        this.registeredContacts = Helpers.getUniqueArray(this.registeredContacts);
        this.setRegisterUsers();
        //console.log("UNIQUE", this.dashboardService.registeredContacts, Helpers.getUniqueArray(this.registeredContacts));
        filterarr = Helpers.filterCommonContacts(this.allContacts,this.registeredContacts);      
        //console.log("Not registered Contacts", filterarr);
        if(filterarr.length > 0){
          filterarr = Helpers.getUniqueContactsArr(filterarr);
          //console.log("UNIQUE CONTACTS" , filterarr);
          this.contactFetched = Helpers.groupedAlphabeticallyContacts(filterarr);          
        }
      }
    }).catch((err) =>{
      console.log("Error Retriveing the requested addressBook",err);
    });
  }

  getAddressBook(type='web'){
    this.qbHelper.qbRetriveAddressBook(type).then((res : any)=>{
      //console.log("address Book retrived",type ,res);
      if(res){
        res = res.filter((contact) => {
          return contact.phone !== this.userService.user.phone;
        })
        let uniqueRes = Helpers.getUniqueContactsArr(res);
        this.allContacts = [...this.allContacts, ...uniqueRes];
        this.contactFetched = Helpers.groupedAlphabeticallyContacts(uniqueRes);
      }
    }).catch((err) =>{
      console.log("Error Retriveing the requested addressBook");
    });
  }

  setRegisterUsers(){
    const users = this.registeredContacts.map((contact) => {
      this.userService.addToCache(contact.user);
      return contact.user;
    });

    users.map((user) =>{
      if(user && user.custom_data){
        try {
          user.custom_data = JSON.parse(user.custom_data);
        }catch (e) {}       
      }
    });
    this.dashboardService.setRegisterContacts(users) ;
    
  }

  startChat(userId){
    if(userId){
      this.dashboardService.startChatWithRegisteredContacts(userId);
    }
  }

  initGoogleclient(){
    this.googleContactService.handleClientLoad();
  }

  // Logout
  logout(userId) {
    console.log('Logout: ', userId);
    this.qbHelper.qbLogout();
    window.location.href = '/login';
  }

  // Chats List
  getChatList(type) {
    this.isfetched = false;
    this.chats = [];
    this.dashboardService.chatTabSelected = type;

    const self = this;
    let uuid = [];
    const filter = {
      limit: 100,
      sort_desc: 'updated_at'
    };

    this.dashboardService.showComponent({
      'onChatClick': false,
      'welcomeChat': true
    });

    //1 - public chat , 2- group chat , 3 - private chat
    // filter['type[in]'] = [3, 2].join(',');

    if (type === 'chat') {
      filter['type'] = 3;
    } else {
      filter['type'] = 2;
    }

    this.dialogService.getDialogs(filter)
      .then((res) => {
        if (res) {
          res['items'].forEach((chat, index, self ) => {
            if ( chat.xmpp_room_jid ) {
              this.dialogService.joinToDialog(chat);
            }
            self[index].last_message_date_sent = +chat.last_message_date_sent * 1000;
            if(chat.type == 3){
              let id 
              if(chat.occupants_ids[1] == this.loggedinUser.id){
                id = chat.occupants_ids[0]
              }else{
                id = chat.occupants_ids[1]
              }
            uuid.push(id)
            }else{
              chat.occupants_ids.forEach(id => {
                uuid.push(id);
              })
            }
            //console.log("usercache before", this.userService._usersCache)
          });
          //console.log("sender id ",uuid, res['items']);
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
            res['items'].forEach(chat => {
              if (chat.type == 3){
                let id 
                if(chat.occupants_ids[1] == this.loggedinUser.id){
                  id = chat.occupants_ids[0]
                }else{
                  id = chat.occupants_ids[1]
                }
                if (self.userService._usersCache[id] && self.userService._usersCache[id].custom_data) {
                  chat['custom_data'] = self.userService._usersCache[id].custom_data;
                }
              }         
            });
            //console.log("usercache", self.userService._usersCache)
            this.dialogService.setDialogs(res['items']);
            setTimeout(() => {
              this.isfetched = true;  
            });
          });
        }
      })
      .catch((err) => {
        console.log('Get chats error: ', err);
        if(err.code == 401){
          this.userService.showToastr('info',"Session timed out",'')
          window.location.reload();
        }
      });
  }

  createNewChat(){
    if(this.dashboardService.chatTabSelected !== 'chat'){
      this.getChatList('chat');
    }
    this.showNewChatPopup  = !this.showNewChatPopup; 
  }

  // Create New Group
  createNewGroup() {
    if(this.dashboardService.chatTabSelected !== 'group'){
      this.getChatList('group');
    }
     
    this.dashboardService.showComponent({
      'createGroupClicked': true,
      'updateDialog': false,
      'welcomeChat': true,
      'onChatClick': false
    });
  }

  // Open Chat
  openChat(chat) {
    this.videoConferenceService.callIsInProgress = false;
    this.videoConferenceService.callType = 1;
    this.selectedChat = chat._id;
    this.dialogService.currentDialog = chat;
    this.dialogService.currentDialogEvent.emit(chat);
    this.dashboardService.showComponent({
      'createGroupClicked': false,
      'updateDialog': false,
      'welcomeChat': false,
      'onChatClick': true
    });
  }

  showContactsTab(){
    if(this.contactFetched.length == 0){
      this.fetchAddressbook();
    }
    this.dashboardService.chatTabSelected = "contacts";
  }

  openProfile(){
    this.showMyProfilePopup = !this.showMyProfilePopup;
  }


  authenticateAndSyncGoogle(e){
    this.googleContactService.handleAuthClick(e);
  }

  prepareToUploadContacts(googleContacts : Array<any>){
    let options = {
      udid : 'web',
      force: 1,
    };
    this.qbHelper.qbUploadAddressBook(googleContacts,options).then(res => {
      console.log("Successfully uploaded the address boook", res)
      this.userService.showToastr('success', 'Contacts sync Successfull', '');
      this.getAddressBook();
    }).catch(err => {
      this.userService.showToastr('error', 'Contacts sync error', '');
      console.log("Error uploading address book", err)
    })
  }

  inProgress(){
    this.userService.showfunctionalityInProcess();
  }

  ngOnDestroy() {
    this.dashboardService.showComponent({
      'createGroupClicked': false,
      'updateDialog': false,
      'welcomeChat': true,
      'onChatClick': false
    });
    
  }

}
