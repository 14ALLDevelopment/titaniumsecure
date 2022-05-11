import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-subscription-cancel',
  templateUrl: './subscription-cancel.component.html',
  styleUrls: ['./subscription-cancel.component.css']
})
export class SubscriptionCancelComponent implements OnInit {

  @ViewChildren("checkboxes") checkboxes: QueryList<ElementRef>;

  form: FormGroup; 
  error :string = null;
  showTextarea:boolean =false
  reasons: Array<any> = [
    { name: 'I do not use service right now', value: 'I do not use service right now' },
    { name: 'I do not need the service for next few months', value: 'I do not need the service for next few months' },
    { name: 'The service is too expensive', value: 'The service is too expensive' },
    { name: 'I am having call quality issues', value: 'I am having call quality issues' },
    { name: 'Other', value: 'other' }
  ];
  constructor(private fb: FormBuilder,private userService : UserService,private ngxloader : NgxUiLoaderService) {
    this.form = this.fb.group({
      checkArray: this.fb.array([]),
      textarea : new FormControl('', [])
    })
  }
 
  ngOnInit(){}


  uncheckAll() {
    this.checkboxes.forEach((element) => {
      element.nativeElement.checked = false;
    });
  }

  onCheckboxChange(e) {
    this.error = null
    const checkArray: FormArray = this.form.get('checkArray') as FormArray;
    console.log("Value ", e.target.value, e.target.checked)
    if (e.target.checked) {
      checkArray.clear();
      this.uncheckAll();
      this.showTextarea = false;
      this.form.get('textarea').reset();
      e.target.checked = true;
      checkArray.push(new FormControl(e.target.value));
      if(e.target.value == 'other'){
        this.showTextarea = true
      }
    } else {

      if(e.target.value == 'other'){
        this.showTextarea = false;
        this.form.get('textarea').reset();
      }
      let i: number = 0;
      checkArray.controls.forEach((item: FormControl) => {
        if (item.value == e.target.value) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  submitForm() {
    this.error = null;
    const checkArray: FormArray = this.form.get('checkArray') as FormArray;
    console.log(checkArray.length,"test");
    if(checkArray.length < 1){
      this.error = "Please select atleast one"
    }else{
      if (checkArray.value.includes('other')){
        console.log("chec",checkArray.value);
        if(this.form.get('textarea').value == null || this.form.get('textarea').value == ""){
          this.error = "Please let us know your reason."
        }else{
          // call the api here 
          let reason = this.form.get('textarea').value;
          reason?.toString().trim();
          this.cancelSubscription(reason);
        }
      }else{
        // call th api here if other not selected
        let reason = this.form.value.checkArray[0];
        reason?.toString().trim();
        this.cancelSubscription(reason);
      }
    }
    console.log(this.form.value)
  }


  cancelSubscription(reasonData:string){
    this.ngxloader.start();
    console.log("Calling API :", reasonData)
    let data = {
      reason : reasonData
    }
    this.userService.cancelSubscription(data).subscribe(resp => {
      console.log(resp);
      if(resp.status == 'success'){
       
      }else{
        
      }
      this.ngxloader.stop();
    },error => {
     
      this.ngxloader.stop();
    })
  }

}
