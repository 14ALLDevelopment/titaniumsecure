import { Component, OnInit } from '@angular/core';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-service-aggrement',
  templateUrl: './service-aggrement.component.html',
  styleUrls: ['./service-aggrement.component.css']
})
export class ServiceAggrementComponent implements OnInit {

  constructor(private userService : UserService ) {

  }

 ngOnInit(): void {
   this.userService.isRedirected$.next(true);
 }

}
