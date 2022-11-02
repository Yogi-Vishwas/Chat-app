import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { Chat, ChatMessage } from '../chat.model';
import { UserService } from '../chat.service';
import { Router } from '@angular/router';
import { TokenStorageService } from '../auth/token.service';
import { io, SocketOptions, ManagerOptions } from 'socket.io-client';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { NgxNotificationService } from 'ngx-notification';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  // styleUrls: ['./chat.component.css']
  styles: [
    `
      ::ng-deep nb-layout-column {
        display: flex;
        justify-content: center;
      }
      :host {
        display: flex;
      }
      nb-chat {
        width: 300px;
        margin: 1rem;
      }
    `,
  ],
})
export class ChatComponent implements OnInit {
  data = [];
  tokenChangedSubscription: Subscription;
  public token = this.tokenService.getToken() as string;

  constructor(
    private readonly userHttpService: UserService,
    private tokenService: TokenStorageService,
    private authService: AuthService,
    private route: Router,
    private Http: HttpClient,
    private readonly ngxNotificationService: NgxNotificationService
  ) {
    this.tokenChangedSubscription = Subscription.EMPTY;
  }

  ngOnInit(): void {
    this.channelUUID = environment.CHAT_ROOM;
    this.tokenChangedSubscription = this.tokenService.tokenChanged.subscribe(
      (updateToken) => {
        if (updateToken === true) {
          this.token = this.tokenService.getToken() as string;
        }
      }
    );
  }
  public messages: ChatMessage[] = [];
  public senderUUID = '';
  public channelUUID = environment.CHAT_ROOM;
  public inRoom = true;

  socketIOOpts: Partial<ManagerOptions & SocketOptions> = {
    path: '/socket.io',
    transports: ['polling'],
    upgrade: false,
  };

  socket = io(environment.SOCKET_ENDPOINT, this.socketIOOpts);

  setlogin() {
    this.route.navigateByUrl('/auth');
  }

  async GoogleAuthentication() {
    this.authService.loginviaGoogle('http://localhost:3001/auth/google', {
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
    });
    const access_token = new URLSearchParams(window.location.search).get(
      'code'
    );
    console.log('Access Token is: ', access_token);

    return this.Http.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>('http://localhost:3001/auth/token', {
      code: access_token,
      clientId: 'test_client_id',
    }).subscribe((res) => {
      this.tokenService.saveToken(res.accessToken);
      this.tokenService.saveRefreshToken(res.refreshToken);
    });
  }

  enterToken() {
    this.userHttpService.getUserTenantId(this.token).subscribe((data) => {
      this.senderUUID = data;
      console.log(this.senderUUID);
    });
  }

  leaveRoom() {
    this.messages = [];
    this.inRoom = false;
  }

  getSenderId(token: string) {
    this.userHttpService.getSender(token).subscribe((res) => {
      let userName = Object.values(res);
      this.senderUUID = userName[5];
    });
  }

  getMessages() {
    this.inRoom = true;
    this.getSenderId(this.token);
    this.userHttpService.get(this.token, this.channelUUID).subscribe((data) => {
      this.messages = [];
      for (const d of data) {
        const temp: ChatMessage = {
          body: d.body,
          subject: d.subject,
          channelType: '0',
          reply: false,
          sender: 'sender',
        };
        if (d.createdBy === this.senderUUID) {
          temp.sender = 'User';
          temp.reply = true;
        }
        this.messages.push(temp);
      }
    });

    this.subcribeToNotifications();
  }

  subcribeToNotifications() {
    this.socket.on('connect', () => {
      const channelsToAdd: string[] = [this.channelUUID];
      this.socket.emit('subscribe-to-channel', channelsToAdd);
    });

    this.socket.on('userNotif', (message) => {
      console.log(message);

      const temp: ChatMessage = {
        body: message.body,
        subject: message.subject,
        channelType: '0',
        reply: false,
        sender: 'sender',
      };
      if (message.subject != this.senderUUID) {
        this.messages.push(temp);
        this.ngxNotificationService.sendMessage(
          `New message from sender: ${message.body}`,
          'info',
          'top-left'
        );
      }
    });
  }

  sendMessage(event: { message: string }, userName: string, avatar: string) {
    if (!this.inRoom) {
      return;
    }
    const chatMessage: ChatMessage = {
      body: event.message,
      subject: 'new message',
      toUserId: this.channelUUID,
      channelId: this.channelUUID,
      channelType: '0',
      reply: true,
      sender: userName,
    };

    const dbMessage: Chat = {
      body: event.message,
      subject: this.senderUUID,
      toUserId: this.channelUUID,
      channelId: this.channelUUID,
      channelType: '0',
    };

    this.userHttpService.post(dbMessage, this.token).subscribe((response) => {
      this.messages.push(chatMessage);
    });
  }
}
