import {EventEmitter, Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {CanActivate, Router} from '@angular/router';
import {QBHelper} from '../../../shared/helper/qbHelper';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import {environment} from '../../../../environments/environment'
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserAuthService } from 'src/app/shared/services/auth/user-auth.service';
import { ToastrService } from 'ngx-toastr';

declare var QB: any;

@Injectable({
  providedIn: 'root'
})
export class UserChatService implements CanActivate {
  public successSubject = new Subject<boolean>(); // to fire when successfult login
  public user: any;
  public _usersCache = [];
  config = environment.QBConfig;
  usersCacheEvent: EventEmitter<any> = new EventEmitter();
  proFileUpdateEvent: EventEmitter<any> = new EventEmitter();

  constructor(private qbHelper: QBHelper, private router: Router,private ngxloader : NgxUiLoaderService,
    private firebaseService :FirebaseService,private auth :UserAuthService,private toastr: ToastrService,) {
    if(!this.user){
      if(window.localStorage.getItem('loggedinUser') ){
        try{
          this.user = JSON.parse(window.localStorage.getItem('loggedinUser'));
        }catch (err){
          window.localStorage.clear();
          this.router.navigate(['/']);
          console.log("parse err",err);
        }
      }  
    }
  }

  canActivate(): boolean {
    const self = this;
    this.user = JSON.parse(localStorage.getItem('loggedinUser'));
    const sessionResponse = JSON.parse(localStorage.getItem('sessionResponse'));
    if (this.qbHelper.getSession() && this.user && sessionResponse) {
      return true;
    } else if (sessionResponse && this.user) {
      if(window.localStorage.getItem('ftoken')){
        self.loginQb(window.localStorage.getItem('ftoken'))
      }
    } else {
      self.qbHelper.qbLogout();
      this.router.navigate(['/login'])
    }
  }

  public addToCache(user: any) {
    const id = user.id;
    if (!this._usersCache[id]) {
      this._usersCache[id] = {
        id: id,
        color: Math.floor(Math.random() * (10 - 1 + 1)) + 1
      };
    }
    this._usersCache[id].last_request_at = user.last_request_at;
    this._usersCache[id].name = user.full_name || user.login || 'Unknown user (' + id + ')';
    if(user.custom_data){
      try {
        this._usersCache[id].custom_data = JSON.parse(user.custom_data);
      }catch (e) {}   
      //console.log("customedata", JSON.parse(user.custom_data));
    }
    this.usersCacheEvent.emit(this._usersCache);
    return this._usersCache[id];
  }

  // update User
  public updateUser(userId, params): Promise<any> {
    const self = this;
    return new Promise((resolve, reject) => {
      QB.users.update(userId, params, function (updateError, updateUser) {
        if (updateError) {
          console.log('User update Error : ', updateError);
          reject(updateError);
        } else {
          self.addToCache(updateUser);
          self.setUser(updateUser);
          console.log('User update successfull ', updateUser);
          self.proFileUpdateEvent.emit(updateUser);
          resolve(updateUser);
        }
      });
    });
  }

  // get Users List
  public getUserList(args): Promise<any> {
    if (typeof args !== 'object') {
      args = {};
    }
    const
      self = this,
      params = {
        filter: {
          field: args.field || 'full_name',
          param: 'in',
          value: args.value || [args.full_name || '']
        },
        order: args.order || {
          field: 'updated_at',
          sort: 'desc'
        },
        page: args.page || 1,
        per_page: args.per_page || 100
      };
    return new Promise(function (resolve, reject) {
      QB.users.listUsers(params, function (userErr: any, usersRes: any) {
        if (userErr) {
          reject(userErr);
        } else {
          //console.log('User List === ', usersRes);
          if(usersRes){
            const users = usersRes.items.map((userObj: any) => {
              self.addToCache(userObj.user);
              return userObj.user;
            });
            resolve(users);
          }else{
            resolve('');
          }
        }
      });
    });
  }

  public setUser(User) {
    this.user = User;
    localStorage.setItem('loggedinUser', JSON.stringify(User));
    this.addToCache(User);
  }

  public removeUser(){
    this.user = null;
    window.localStorage.clear();
  }

  public getRecipientUserId(users) {
    const self = this;
    if (users.length === 2) {
      return users.filter(function (user) {
        if (user !== self.user.id) {
          return user;
        }
      })[0];
    }
  }

  //anuj's code
  public loginQb(firebaseToken) {
    this.ngxloader.start();
    this.config['on'] = {
      sessionExpired: (handleResponse, retry) => {
        // call handleResponse() if you do not want to process a session expiration,
        // so an error will be returned to origin request
        // handleResponse();
  
        // QB.createSession(function(error, session) {
        //   retry(session);
        // });
        //console.log("session expired", this, retry, handleResponse);
        this.showToastr('info', "Refreshing session", "Session Timed Out");
        this.refreshFirebaseAndQBlogin();
      }
    }
    let self = this
    QB.init(environment.QBCredentials.appId, environment.QBCredentials.authKey, environment.QBCredentials.authSecret, environment.QBCredentials.accountKey,this.config);
    this.qbHelper.appSession().then((sessionResponse)=>{
      localStorage.setItem('sessionResponse', JSON.stringify(sessionResponse));
      self.qbLogin(firebaseToken);
    }).catch(error => {
      self.ngxloader.stop();
      console.log(error);
      error.status = 401;
    });  
  }

  qbLogin(firebaseToken) {
    let authParams = {
      provider: "firebase_phone",
      firebase_phone: {
        access_token: firebaseToken,
        project_id: "titanium-6a871",
      },
    };
    let obj = this;
    QB.login(authParams, function (error, user) {
      if (error) {
        // check the error
        console.log("QBerror", error);
        if(error.code == 422){
          //token is expired so refesh token and login again 
          obj.refreshFirebaseAndQBlogin();
        }else{
          obj.ngxloader.stop();
          obj.qbHelper.qbLogout();
          obj.auth.removeUser();
          obj.showToastr('info', "Please login to continue", "Session Timed Out");
          obj.router.navigate(['/login']);
        }
      } else {
          //console.log('QB user', user);
          //console.log("Token" , QB.service.getSession().token);

          obj.auth.storeOBUser(user);
          window.localStorage.setItem('ftoken',firebaseToken);
          obj.setUser(user);
          obj.qbHelper.qbChatConnection(user.id, QB.service.getSession().token).then(chatRes => {
          obj.successSubject.next(true);
          obj.setChatDisconnectListener();
          //console.log("chatconnectionREs", QB.chat);
          obj.ngxloader.stop();
          obj.router.navigate(['/chat'])
          
        },
        chatErr => {
          obj.ngxloader.stop();
          console.log('chat connection Error :', chatErr);
        });

      }
    });

  }

  refreshFirebaseAndQBlogin(){
    let self = this;
    if(this.qbHelper.getSession()){   
      this.firebaseService.getRefreshToken().then(function(idtoken : string){
        console.log("Refeshing token ...")
        window.localStorage.setItem('ftoken',idtoken);
        self.loginQb(idtoken);  
      }).catch(function(error) {
        console.log("Refesh token error",error )
        self.qbHelper.qbLogout();
        self.auth.removeUser();
        self.showToastr('info', "Please login to continue", "Session Timed Out");
        self.router.navigate(['/login']);     
      });
    }else{
      this.qbHelper.qbLogout();
      this.auth.removeUser();
      this.showToastr('info', "Please login to continue", "Session Timed Out");
      this.router.navigate(['/login']);
    }
  }

  setChatDisconnectListener(){
    QB.chat.onDisconnectedListener = this.onChatDisconnected.bind(this);
  }

  onChatDisconnected(){
    console.log('Chat is disconnected');
    if(this.user){
      //reconnect here.
    }
  }

  
  showfunctionalityInProcess(){
    this.showToastr('info', "This feature will be available soon",'');
  }

  retriveOnlineGroupUser(dialogId){
    const self = this;
    return new Promise(function (resolve, reject) {
      let dialogJid = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
      try {
        QB.chat.muc.listOnlineUsers(dialogJid, function(users) {
          if(users){            
            const filteredUsers = users.filter((userId) => {
              return userId !== self.user.id;
            });
            resolve(filteredUsers);
          }else{
            resolve('')
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  showToastr(type, msg, title) {
    this.toastr[type](msg, title, {
        progressBar: true,
        progressAnimation: 'increasing',
        timeOut: 3000,
        positionClass: 'toast-bottom-right',
    });
  }
}
