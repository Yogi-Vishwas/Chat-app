import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable()
export class AuthService {
  private authBaseUrl = 'http://localhost:3001/auth';
  constructor(private http: HttpClient) {}

  login(authForm: FormGroup) {
    let username = authForm.value.username;
    let password = authForm.value.password;

    const body = {
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
      username: username,
      password: password,
    };

    return this.http.post<{ code: string }>(`${this.authBaseUrl}/login`, body);
  }

  loginviaGoogle(url: string, body: any) {
    const myform = document.createElement('form');
    myform.method = 'POST';
    myform.action = url;
    myform.style.display = 'none';
    myform.append('Content-Type', 'application/x-www-form-urlencoded');
    Object.keys(body).forEach((key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = body[key];
      myform.appendChild(input);
    });
    document.body.appendChild(myform);
    myform.submit();
  }

  getAccessToken(code: string) {
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      expires: number;
    }>(`${this.authBaseUrl}/token`, {
      code,
      clientId: 'test_client_id',
    });
  }

  refreshToken(refreshToken: string) {
    return this.http.post(`${this.authBaseUrl}/token-refresh`, {
      refreshToken,
    });
  }
}
