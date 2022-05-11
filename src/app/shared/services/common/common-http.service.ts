import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserAuthService } from '../auth/user-auth.service';
import { ToastrService } from 'ngx-toastr';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserChatService } from 'src/app/chat/dashboard/user/user.service';

@Injectable()
export class CommonHttpClient {
    private httpOptions;
    private logsReqResData = true; // Make it True For Debugging purpose only
    private _baseApiUrl = environment.baseApiUrl;

    constructor(private http: HttpClient,
                private userAuthService: UserAuthService ,
                private toastr: ToastrService,
                private router: Router ,
                private ngxService: NgxUiLoaderService,
                private userChatService : UserChatService) {}

    private _configHeaders = () => {
        let headers = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');    
        if (this.userAuthService.getStoredUser() && this.userAuthService.user.token) {
            headers = headers.set('Authorization', this.userAuthService.user.token);
        }
        this.httpOptions = { headers };
    }

    get(url, showToastr = false ) {
        this._configHeaders();
        return this.http.get(this._baseApiUrl + url, this.httpOptions).pipe(
            tap((resp: any) => {
                if (resp.status === 'success' && showToastr) {
                    this.showToastr('success', resp.message, '');
                } else if (resp.status === 'failed'  && showToastr) {
                    this.showToastr('error', resp.message, '');
                }
            }),
            map((resp: any) => {
                if (resp.data) {                
                    // With Decryption
                    //resp.data = this.decrypt(resp.data);
                    // Without Decryption
                    resp.data = resp.data;
                }
                this.consoleLogData({ method: 'GET', url, resp });
                return resp;
            }),
            catchError(err => {
                this.handleError(err, showToastr);
                this.consoleLogData(err);
                return throwError(err);
            })
        );
    }

    post(url, data, showToastr = false) {
        this._configHeaders();
        // With Ecryption
        return this.http.post(this._baseApiUrl + url, data , this.httpOptions).pipe(
            // Without Ecryption
            // return this.http.post(this._baseApiUrl + url,  data , this.httpOptions).pipe(
            tap((resp: any) => {
                if (resp.status === 'success' && showToastr) {
                    this.showToastr('success', resp.message, '');
                } else if (resp.status === 'failed' && showToastr) {
                    this.showToastr('error', resp.message, '');
                }
                this.consoleLogData({ method: 'POST', url, data, resp });
            }),
            catchError(err => {
                this.handleError(err, showToastr);
                this.consoleLogData(err);
                return throwError(err);
            })
        );
    }

    delete(url, showToastr = false) {
        
        this._configHeaders();
        return this.http.delete(this._baseApiUrl + url, this.httpOptions).pipe(
            tap((resp: any) => {
                if (resp.status === 'success' && showToastr) {
                    this.showToastr('success', resp.message, '');
                } else if (resp.status === 'failed'  && showToastr) {
                    this.showToastr('error', resp.message, '');
                }
            }),
            map((resp: any) => {
                if (resp.data) {
                    
                    // With Decryption
                    //resp.data = this.decrypt(resp.data);
                    // Without Decryption
                    resp.data = resp.data;
                }
                this.consoleLogData({ method: 'Delete', url, resp });
                return resp;
            }),
            catchError(err => {
                this.handleError(err, showToastr);
                this.consoleLogData(err);
                return throwError(err);
            })
        );
    }

    handleError(error, showToastr) {
        this.ngxService.stop();
        if (showToastr) {
            this.showToastr('error', error.message, error.status);
        }
        this.userAuthService.removeUser();
        this.userChatService.removeUser();
        if (error.status === 401) {  
            this.router.navigate(['/login']); 
        } else if (error.status === 500) {
            this.router.navigate(['/server-error']);
        } else if (error.status === 0) {
            this.router.navigate(['/server-error']);
        }
    }

    consoleLogData(data) {
        if (this.logsReqResData) {
            // console.log('------ API LOGS -----', data);
        }
    }

    showToastr(type, msg, title) {
        this.toastr[type](msg, title, {
            progressBar: true,
            progressAnimation: 'increasing',
            timeOut: 1500,
            positionClass: 'toast-bottom-right',
        });
    }
}
