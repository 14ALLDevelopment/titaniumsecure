import { Component, OnInit } from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  public config: PerfectScrollbarConfigInterface = {}

  constructor() { }

  ngOnInit(): void {
  }


}

export class NgbdNavBasic {
  active = 1;
}
