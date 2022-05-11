import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-doc-viewer',
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.css']
})
export class DocViewerComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() documentAttachment: any;
  @Output() closeViewerEvent = new EventEmitter<any>()
  loaded :boolean = false;
  viewer = 'google';
  infoMessage = "Loading document please wait"
  doc :string;

  //To store the timeout ids
  timeOut = [];

  constructor() {}

  ngOnInit(): void {
    setTimeout(() => {
      //console.log('document :',this.documentAttachment);  // You will get the @Input value
      this.doc = this.documentAttachment.uid ? this.documentAttachment.src : (this.documentAttachment.data ? this.documentAttachment.src : this.documentAttachment.url) ;
    });
  }

  ngAfterViewInit() : void {
    if(!this.loaded){
      let timeout1 = setTimeout(() => {
        this.infoMessage = this.infoMessage + ", This is taking longer than usual"
      }, 10000);
      this.timeOut.push(timeout1);
      let timeout2 = setTimeout(() => {
        this.viewer = "office"
      }, 15000);
      this.timeOut.push(timeout2);
    }
  }

  isLoaded(){
    this.loaded = true;
    console.log("viewer loaded");
    this.clearTimeouts();
  }

  clearTimeouts(){
    if(this.timeOut.length > 0){
      console.log("clearing all timeouts" ,this.timeOut);
      this.timeOut.forEach(id => {
        clearTimeout(id);
      });
      this.timeOut = [];
    }
  }

  close(){
    this.closeViewerEvent.emit();
    this.loaded = false
  }

  ngOnDestroy(){
    this.documentAttachment = null;
    this.clearTimeouts()
  }
}
