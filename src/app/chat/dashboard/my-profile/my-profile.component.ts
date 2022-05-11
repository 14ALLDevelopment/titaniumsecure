import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import {CONSTANTS} from 'src/app/QBconfig';
import { QBHelper } from 'src/app/shared/helper/qbHelper';
import { DashboardService } from '../dashboard.service';
import { UserChatService } from '../user/user.service';

declare var QB: any;

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {

  profileForm: FormGroup;
  loggedinUser :any;
  imageUrl: any;
  uploading :boolean =false;
  previousCustomProfilePicUrl : string ;

  custom_data = {
    "MainName": "Apple User1",
    "Alternate1Name": "",
    "Alternate2Name": "",
    "Selected": "MainName",
    "IsAnonymous": false
  }
  blob_id ;
  constructor(private dashboardService: DashboardService,
    private userService: UserChatService,private qbHelper: QBHelper,private ngxloader : NgxUiLoaderService) { 
      this.getAndSetUser();
    }

  // full_name	string	User's full name.
  // email	string	User's email.

  ngOnInit(): void {

    this.initprofileform();
  }

  getAndSetUser(){
    this.loggedinUser = this.userService.user;
    if(this.loggedinUser &&  this.loggedinUser.custom_data){
      try {
        this.loggedinUser.custom_data = JSON.parse(this.loggedinUser.custom_data);
      } catch (e) {}
      
      if(this.loggedinUser.custom_data.ProfilePublicUrl){
        this.previousCustomProfilePicUrl = this.loggedinUser.custom_data.ProfilePublicUrl;
        //console.log("previous url" , this.previousCustomProfilePicUrl)
        //const url = this.loggedinUser.custom_data.ProfilePublicUrl.split('.').slice(0, -1).join('.');
        //this.loggedinUser.custom_data.ProfilePublicUrl = url
      }
    }
  }

  initprofileform(){
    this.profileForm = new FormGroup({
      full_name : new FormControl('' , [ Validators.required ]),
      email : new FormControl('' , [ Validators.required, Validators.email ])
    });
    this.setprofileForm();
  }

  setprofileForm(){
    if(this.loggedinUser.full_name){
      this.profileForm.get('full_name').setValue(this.loggedinUser.full_name)
    }
    if(this.loggedinUser.email){
      this.profileForm.get('email').setValue(this.loggedinUser.email);
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
      this.imageUrl = null;
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
        console.log("file upload sucess",response)
        let url=  QB.content.publicUrl(response.uid);
        this.imageUrl = url;
        this.uploading = false;
        this.custom_data['ProfilePublicUrl'] = url;
        this.blob_id = response.blob_object_access.blob_id;
        console.log("Image url : ", this.imageUrl)
      }).catch(err => {
        console.log('ERROR: ' + err.detail);
      });
  }


  saveProfile(){
    
    this.custom_data.MainName = this.profileForm.get("full_name").value;
    if(!this.custom_data['ProfilePublicUrl'] && this.previousCustomProfilePicUrl){
      console.log("previous url" , this.previousCustomProfilePicUrl)
      this.custom_data['ProfilePublicUrl'] = this.previousCustomProfilePicUrl;
    }
    this.updateProfile();
  }

  updateProfile(){
    this.ngxloader.start();
    let user = this.profileForm.value;
    user['custom_data'] = JSON.stringify(this.custom_data);
    if(this.blob_id){
      user['blob_id']=this.blob_id;
    }
    
    this.userService.updateUser(this.loggedinUser.id, user).then((success) => {
      console.log("User profile updated");
      this.close();
      this.ngxloader.stop();
    }).catch((err) => {
      console.log("unable to update the user profile");
      this.ngxloader.stop();
    });
  }


  close() {
    this.dashboardService.showComponent({
      'showMyProfilePopup' : false,
      'onChatClick': !this.dashboardService.components.welcomeChat
    });
  }

}
