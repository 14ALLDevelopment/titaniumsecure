import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat.component'
import { DashboardComponent} from './dashboard/dashboard.component'
import { UserChatService } from './dashboard/user/user.service';
 
const routes: Routes = [
  {path: 'qchat', component: ChatComponent, pathMatch: 'full'},
  {path: '', component: DashboardComponent, pathMatch: 'full', canActivate: [UserChatService]},
  {path: '**', redirectTo: '', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatRoutingModule { }
