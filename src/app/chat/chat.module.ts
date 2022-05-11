import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DialogsComponent} from './dashboard/dialogs/dialogs.component';

import { MessageComponent} from './dashboard/messages/message.component';
import { NewChatComponent } from './dashboard/new-chat/new-chat.component'
import { MyProfileComponent } from './dashboard/my-profile/my-profile.component'
import { ChatActionDropdownComponent } from './dashboard/chat-action-dropdown/chat-action-dropdown.component'
import { TabsComponent } from './dashboard/tabs/tabs.component'
import { NewGroupChatComponent} from './dashboard/new-group-chat/new-group-chat.component'
import { DocViewerComponent } from './dashboard/doc-viewer/doc-viewer.component'
import { VideoViewerComponent } from './dashboard/video-viewer/video-viewer.component'
import { VideoCallComponent } from './dashboard/video-call/video-call.component'
import { IncomingVideoCallComponent } from './dashboard/incoming-video-call/incoming-video-call.component'

import {QBHelper} from '../shared/helper/qbHelper';
import {Helpers} from '../shared/helper/helpers';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleContactService } from './../shared/services/google.contact.service'
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { UpdateGroupComponent } from './dashboard/update-group/update-group.component';
import { VideoGroupCallComponent } from './dashboard/video-group-call/video-group-call.component'


@NgModule({
  declarations: [
    ChatComponent,
    TabsComponent,
    DashboardComponent,
    DialogsComponent,
    MessageComponent,
    NewChatComponent,
    MyProfileComponent,
    ChatActionDropdownComponent,
    NewGroupChatComponent,
    UpdateGroupComponent,
    DocViewerComponent,
    VideoViewerComponent,
    VideoCallComponent,
    IncomingVideoCallComponent,
    VideoGroupCallComponent
  ],
  providers: [
    QBHelper,
    Helpers,
    GoogleContactService,
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgxDocViewerModule,
  ],
})
export class ChatModule { }
