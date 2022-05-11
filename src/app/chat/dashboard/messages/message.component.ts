import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MessageService} from './message.service';
import {CONSTANTS} from 'src/app/QBconfig';
import {DialogService} from '../dialogs/dialog.service';
import { UserChatService } from '../user/user.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['../dialogs/dialogs.component.css', '../../chat.component.css']
})
export class MessageComponent implements AfterViewInit {

  @Input() dialog: any;
  @Input() message: any = [];
  @Output() picClickEvent = new EventEmitter<string>();
  @Output() openDocumentEvent = new EventEmitter<any>();
  @Output() openVideoEvent = new EventEmitter<any>();
  @ViewChild('element') el: ElementRef;
  public CONSTANTS = CONSTANTS;

  user:any;


  constructor(
    private messageService: MessageService,
    private dialogService: DialogService,
    private userChatService : UserChatService
  ) {
    this.user = this.userChatService.user;
  }

  ngAfterViewInit() {
    if (this.message.visibilityEvent) {
      this.el.nativeElement['dataset'].messageId = this.message._id;
      this.el.nativeElement['dataset'].userId = this.message.sender_id;
      this.el.nativeElement['dataset'].dialogId = this.message.chat_dialog_id;
      this.messageService.intersectionObserver.observe(this.el.nativeElement);
    }
  }

  visibility(e) {
    this.dialogService.dialogs[e.detail.dialogId].unread_messages_count--;
    this.dialogService.dialogsEvent.emit(this.dialogService.dialogs);
    this.messageService.intersectionObserver.unobserve(this.el.nativeElement);
    this.messageService.messages = this.messageService.messages.map(message => {
      if (message._id === e.detail.messageId) {
        message.visibilityEvent = false;
      }
      return message;
    });
  }

  loadImagesEvent(e) {
    let img: any, container: Element, imgPos: number, scrollHeight: number;
    img = e.target;
    container = document.querySelector('.scroll');
    // @ts-ignore
    imgPos = container.offsetHeight + container.scrollTop - img.offsetTop;
    scrollHeight = container.scrollTop + img.offsetHeight;

    img.classList.add('loaded');

    if (imgPos >= 0) {
      //container.scrollTop = scrollHeight + 5;

    }
  }


  returnFileSize(_size){
    var fSExt = new Array('Bytes', 'KB', 'MB', 'GB'),i=0;while(_size>900){_size/=1024;i++;}
    var exactSize = (Math.round(_size*100)/100)+' '+fSExt[i];
      //console.log('FILE SIZE = ',exactSize);
    return exactSize;
  }


  openImageFull(attachment) {
    let imageUrl
    if(attachment.uid || attachment.data){
      imageUrl = attachment.src;
    }else{
      imageUrl = attachment.url;
    }
    this.picClickEvent.emit(imageUrl);
  }

  openDocument(attachment){
    if(attachment){
      this.openDocumentEvent.emit(attachment);
    }
  }

  openVideo(attachment){
    if(attachment){
      this.openVideoEvent.emit(attachment);
    }
  }
}
