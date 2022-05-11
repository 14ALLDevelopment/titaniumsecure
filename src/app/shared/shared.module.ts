import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { HeaderComponent } from './components/header/header.component'
import { ReactiveFormsModule } from '@angular/forms';
import { UserModule } from '../chat/dashboard/user/user.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
//directive
import { NumberDirective } from './directives/numbers-only-directive'
//pipe
import { FormatTimePipe } from './pipes/timer.pipe';

@NgModule({
  declarations: [
    FooterComponent, ContactFormComponent, HeaderComponent,NumberDirective,FormatTimePipe
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UserModule,
    Ng2SearchPipeModule,
    NgScrollbarModule,
    NgImageFullscreenViewModule,
  ],
  providers: [],
  exports: [
    FooterComponent,
    ContactFormComponent,
    HeaderComponent, 
    NgScrollbarModule,
    Ng2SearchPipeModule,
    NgImageFullscreenViewModule,
    NumberDirective,
    FormatTimePipe
  ]
})

export class SharedModule { }
