import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DashboardService } from '../dashboard.service';
import { UserChatService } from '../user/user.service';
import { DialogService } from '../dialogs/dialog.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements OnInit {

  @Input() dialog: any;
  ephemeralSettingForm : FormGroup;
  fileSharingForm  : FormGroup;
  currentUser;
  ephemeralDurationArr : Array<any> = [];
  fileSharingArr  : Array<any> = [];

  constructor(private dashboardService: DashboardService,private fb: FormBuilder,
    private userChatService: UserChatService,private dailogService : DialogService) {
    this.initForm();
    this.currentUser = this.userChatService?.user;
  }

  ngOnInit(): void {
    //console.log(this.dialog, "tabs");
    this.setephemeralValue();
    this.setFilesharingControl();
  }

  initForm(){
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

  update(){
    this.updateEphemeraldata();
    this.updateFileSharingData();
    if(this.dialog.data){
      let dialog_data = this.dialog.data;
      dialog_data['EphemeralMessageDuration'] = this.ephemeralDurationArr;
      dialog_data['FileSharingControl'] = this.fileSharingArr;
      let params = {
        "data" : dialog_data
      }
      console.log("update params", params);
      this.updateDialog(params);
    }else{
      let dailog_data = {
        EphemeralMessageDuration : this.ephemeralDurationArr,
        FileSharingControl: this.fileSharingArr,
        class_name: "dialog_data"
      }
      let params = {
        "data" : dailog_data
      }
      this.dialog['data'] = dailog_data;
      console.log("update params", params);
      this.updateDialog(params);
    }
    this.ephemeralDurationArr = [];
    this.fileSharingArr = [];
  }

  updateDialog(params){
    console.log("update " , params);
    this.dailogService.updateDialog( this.dialog._id, params).then(res => {
      console.log("dailog updated", res);
      this.userChatService.showToastr("success","Message setting updated.", "");
    }).catch(err => {
      console.log("dailog update fail", err)
    });
  }

  closePopup(){
    this.dashboardService.showComponent({
      'showNewChatPopup' : false,
      'showMyProfilePopup' : false,
      'showMessageSettingPopup' : false
    })
  }
}
