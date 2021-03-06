import {Injectable} from '@angular/core';

declare var QB: any;

@Injectable()
export class QBHelper {

  constructor(
  ) {
  }

  public getSession() {
    return QB && QB.service ? QB.service.getSession() : null;
  }

  public qbLogout() {
    localStorage.removeItem('loggedinUser');
    localStorage.removeItem('sessionResponse');
    if(QB && QB.chat){
      QB.chat.disconnect();
      QB.destroySession(() => null);
    }
  }

  // App Session
  public appSession(): Promise<any> {
    return new Promise((resolve, reject) => {
      QB.createSession(function (sessionErr, sessionRes) {
        if (sessionErr) {
          reject(sessionErr);
        } else {
          resolve(sessionRes);
        }
      });
    });
  }

  public abCreateAndUpload(file, access=false): Promise<any> {
    return new Promise((resolve, reject) => {
      QB.content.createAndUpload({
        public: access,
        file: file,
        name: file.name,
        type: file.type,
        size: file.size
      }, function (err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  // create connection or login
  public qbCreateConnection(user): Promise<any> {
    return new Promise((resolve, reject) => {
      this.appSession().then(sessionResponse => {
        localStorage.setItem('sessionResponse', JSON.stringify(sessionResponse));
        const params = {
          login: user.login,
          password: user.password
        };
        QB.login(params, function (loginErr, loginRes) {
          if (loginErr) {
            reject(loginErr);
          } else {
            resolve(loginRes);
          }
        });
      }).catch(error => {
        alert(error);
        console.log(error);
        error.status = 401;
        reject(error);
      });
    });
  }

  /**
   * chat connection
   * @password {String} password - The user's password or session token
   * */
  public qbChatConnection(userId: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = {
        userId: userId,
        password: password
      };
      QB.chat.connect(params, function (chatErr, chatRes) {
        if (chatErr) {
          reject(chatErr);
        } else {
          console.log('chat connection successfull');
          resolve(chatRes);
        }
      });
    });
  }


  /**
   * To upload the contacts as addressBook
   */
  public qbUploadAddressBook(contactsArray , options){
    return new Promise((resolve,reject) =>{
      QB.addressbook.uploadAddressBook(contactsArray, options, function(addressBookErr , addressBookRes){
        if(addressBookErr){
          reject(addressBookErr)
        }else{
          resolve(addressBookRes)
        }
      });
    });
  }

  /**
   * To Retrive the addressBook
   */
   public qbRetriveAddressBook(type="web"){
    return new Promise((resolve,reject) =>{
      QB.addressbook.get(type,function(addressBookErr , addressBookRes){
        if(addressBookErr){
          reject(addressBookErr)
        }else{
          resolve(addressBookRes)
        }
      });
    });    
  }

  /**
   * To retrive register user
   */
   public qbRetriveRegisterAddressBook(type="web"){
    return new Promise((resolve,reject) =>{
      QB.addressbook.getRegisteredUsers(type,function(addressBookErr , addressBookRes){
        if(addressBookErr){
          reject(addressBookErr)
        }else{
          resolve(addressBookRes)
        }
      });
    });
  }
}
