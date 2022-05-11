import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent implements OnInit {
  error:string ; success :string
  contactForm: FormGroup;
  signSubmit :boolean = false;
  constructor(private userService : UserService,private ngxloader : NgxUiLoaderService) {
    this.initForm();
  }

  ngOnInit(): void {
  }

  get f(){
    return this.contactForm.controls;
  }

  initForm(){
    this.contactForm = new FormGroup({
      name : new FormControl('' , [ Validators.required ]),
      email_id : new FormControl('' , [ Validators.required, Validators.email ]),
      phone_number : new FormControl('', [Validators.required]),
      message : new FormControl('' , [ Validators.required ]),
    });
  }

  onSubmit(){
    this.signSubmit = true;
    this.clearMessages();
    if(this.contactForm.valid){
      this.ngxloader.start();
      console.log(this.contactForm.value,"form");
      this.userService.contactUs(this.contactForm.value).subscribe(resp=>{
        if(resp.status == 'success'){
          this.success = resp.message
        }else{
          this.error = resp.message;
        }
        this.ngxloader.stop();
      })
      //this.formReset();
    }else{
      this.error = "Please fill up all the required fields with valid details"
    }
  }

  formReset(){
    this.signSubmit = false;
    this.contactForm.reset();
  }

  clearMessages(){
    this.error = null;
    this.success = null;
  }

}
