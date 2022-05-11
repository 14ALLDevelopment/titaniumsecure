import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import {environment} from '../../../environments/environment'

@Injectable()
export class FirebaseService {

  constructor(){
    firebase.initializeApp(environment.firebaseConfig);
  }

  get windowRef() {
    return window
  }

  getRefreshToken(){
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          user.getIdToken(true).then(function(data) {
            resolve(data)
          });
        }else{
          reject()
        }
      });
    });
    

   
  }

}