import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-video-viewer',
  templateUrl: './video-viewer.component.html',
  styleUrls: ['./video-viewer.component.css']
})
export class VideoViewerComponent implements OnInit, OnDestroy {

  @Input() videoAttachment: any;
  @Output() closeVideoViewerEvent = new EventEmitter<any>()
  loaded :boolean = false;

  constructor() {}

  ngOnInit(): void {}

  close(){
    this.closeVideoViewerEvent.emit();
  }

  ngOnDestroy(){
    this.videoAttachment = null;
  }
}
