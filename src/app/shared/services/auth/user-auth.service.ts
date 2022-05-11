import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as utf8 from 'crypto-js/enc-utf8';
import * as AES from 'crypto-js/aes';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserAuthService {
    public user; public QBuser;
    public user$ = new BehaviorSubject(undefined);
    private _apiKey = environment.apiSecretKey;

    constructor(private router: Router) {
        this.getStoredUser();
    }

    storeUser(data) {
        const encrypted = AES.encrypt(
            JSON.stringify(data),
            this._apiKey
        ).toString();
        localStorage.setItem('0', encrypted);
        this.user = data;
        this.user$.next(this.user);
    }

    storeOBUser(data) {
        const encrypted = AES.encrypt(
            JSON.stringify(data),
            this._apiKey
        ).toString();
        localStorage.setItem('QB', encrypted);
        this.QBuser = data;
    }

    getStoredUser() {
        if (localStorage.getItem('0')) {
            const userdata = localStorage.getItem('0');
            try {
                this.user = JSON.parse(
                    AES.decrypt(userdata, this._apiKey).toString(utf8)
                );
            } catch (err) {
                // Catching error means the data is tempered
                this.user = undefined;
                localStorage.removeItem('0');
            }
        } else {
            this.user = undefined;
            localStorage.removeItem('0');
        }
        this.user$.next(this.user);
        return this.user;
    }

    getStoredQBUser() {
        if (localStorage.getItem('QB')) {
            const userdata = localStorage.getItem('QB');
            try {
                this.QBuser= JSON.parse(
                    AES.decrypt(userdata, this._apiKey).toString(utf8)
                );
            } catch (err) {
                // Catching error means the data is tempered
                this.QBuser = undefined;
                localStorage.removeItem('QB');
            }
        } else {
            this.QBuser = undefined;
            localStorage.removeItem('QB');
        }
        
        return this.QBuser;
    }

    removeUser() {
        this.user = undefined;
        this.user$.next(this.user);
        localStorage.clear();
        // localStorage.removeItem('0');
        // localStorage.removeItem('QB');
    }

    reCallUserSubscriber() {
        this.user$.next(this.user);
    }

    setUserData(isCompleted) {
        const userdata = localStorage.getItem('0');
        try {
            this.user = JSON.parse(
                AES.decrypt(userdata, this._apiKey).toString(utf8)
            );
            this.user.is_completed = isCompleted;
            const encrypted = AES.encrypt(
                JSON.stringify(this.user),
                this._apiKey
            ).toString();
            localStorage.removeItem('0');
            localStorage.setItem('0', encrypted);
        } catch (err) {
            // Catching error means the data is tempered
            this.user = undefined;
            localStorage.removeItem('0');
        }
    }
}
