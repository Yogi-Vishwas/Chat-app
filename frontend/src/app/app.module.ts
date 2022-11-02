import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { PubNubAngular } from 'pubnub-angular2';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NbThemeModule, NbLayoutModule, NbChatModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from './auth/auth.service';
import { ChatComponent } from './chat/chat.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { UserService } from './chat.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxNotificationModule } from 'ngx-notification';
import { AuthComponent } from './auth/auth.component';
import { TokenStorageService } from './auth/token.service';

@NgModule({
  declarations: [AppComponent, ChatComponent, AuthComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule,
    NbThemeModule.forRoot({ name: 'default' }),
    NbLayoutModule,
    NbEvaIconsModule,
    NbChatModule,
    HttpClientModule,
    FormsModule,
    NgxNotificationModule,
    ReactiveFormsModule,
  ],
  providers: [UserService, AuthService, TokenStorageService, PubNubAngular],
  bootstrap: [AppComponent],
})
export class AppModule {}
