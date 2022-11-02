import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TokenStorageService } from './token.service';
import { AuthService } from './auth.service';
import { EventBusService } from '../shared/event-bus.service';
import { EventData } from '../shared/event.class';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  public authForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private tokenService: TokenStorageService,
    private eventBusService: EventBusService
  ) {
    this.authForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
      ]),
    });
  }

  async login() {
    let res = await this.authService.login(this.authForm).toPromise();
    console.log('code', res.code);

    this.authService.getAccessToken(res.code).subscribe(
      (res) => {
        console.log('Access Token: ', res.accessToken);
        console.log('Refresh Token: ', res.refreshToken);

        this.tokenService.saveToken(res.accessToken);
        this.tokenService.saveRefreshToken(res.refreshToken);
      },
      (err) => {
        if (err.status === 403) {
          this.eventBusService.emit(new EventData('logout', null));
        }
      }
    );
    this.router.navigateByUrl('');
  }

  ngOnInit(): void {}
}
