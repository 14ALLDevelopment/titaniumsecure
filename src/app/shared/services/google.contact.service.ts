import {AfterViewInit, EventEmitter, Injectable, NgZone, OnInit} from '@angular/core';

import {environment} from '../../../environments/environment'

declare var gapi: any;

@Injectable()
export class GoogleContactService  {
    test :string = 'test'
    googleContact :any = [];

    contactFetched: EventEmitter<any> = new EventEmitter();

    constructor(private ngZone: NgZone) {}

    /**
     *  On load, called to load the auth2 library and API client library.
     */
    handleClientLoad() {
        var obj = this;
        gapi.load('client:auth2', () => this.initClient());
    }




     /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
    initClient() {
        // Client ID and API key from the Developer Console
        let CLIENT_ID = '371373515609-fgkb404kmu556qmlchcjthvmc2dpis1g.apps.googleusercontent.com';
        let API_KEY = 'AIzaSyCwlNahspIs7tzkQIrCu_95unvnzl7WDfY';

        // Array of API discovery doc URLs for APIs used by the quickstart
        let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/people/v1/rest"];

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        let SCOPES = "https://www.googleapis.com/auth/contacts.readonly";
        //console.log("scope", this.test);
        var self = this;
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function () {
          // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(self.updateSigninStatus);

            // Handle the initial sign-in state.
            //self.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        
        }, function(error) {
            console.log("People API init error", error)
        });
      }

    
      /**
       *  Called when the signed in status changes, to update the UI
       *  appropriately. After a sign-in, the API is called.
       */
        updateSigninStatus = function (isSignedIn) {
           console.log("SignInStatus", isSignedIn)
        if (isSignedIn) {
        //   authorizeButton.style.display = 'none';
        //   signoutButton.style.display = 'block';
          this.listConnectionNames();
        } else {
        //   authorizeButton.style.display = 'block';
        //   signoutButton.style.display = 'none';
        }
      }


     /**
     *  Get Google contacts for 1000 people.
     */
    listConnectionNames() {
        let self = this
        gapi.client.people.people.connections.list({
           'resourceName': 'people/me',
           'pageSize': 1000,
           'personFields': 'names,emailAddresses,phoneNumbers',
         }).then(function(response) {

           var connections = response.result.connections;
            self.googleContact = [];
           console.log("response",connections);

           if (connections.length > 0) {
             for (let i = 0; i < connections.length; i++) {
               var person = connections[i];
               if (person.names && person.names.length > 0 && person.phoneNumbers && person.phoneNumbers.length > 0) {

                person.phoneNumbers.forEach(phoneNumber => {
                    let contact = {
                        name : person.names[0].displayName,
                        phone : phoneNumber.value
                    }
                    self.googleContact.push(contact);
                });
                   
                 //console.log(person.names[0].displayName + ' --- ' + person.phoneNumbers[0].value)
                 
               } else {
                 console.log("No display name found for connection.");
               }
             }
             self.contactFetched.emit(self.googleContact);
           } else {
             console.log('No connections found.');
           }
         });
      }

    /**
    *  Sign in the user upon button click.
    */
    handleAuthClick(event) {
        //gapi.auth2.getAuthInstance().signIn();
        //gapi.auth2.getAuthInstance().signIn().then((...args) => console.log(args), (...args) => console.log(args));

        Promise.resolve(gapi.auth2.getAuthInstance().signIn())
        .then(() => { 
            this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
         })

        }


    /**
     *  Sign out the user upon button click.
     */
    handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
    }
 
}
