import { messages } from './../../mock-api/apps/chat/data';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseLoadingService } from '@fuse/services/loading';
import { catchError, tap, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'eviroments/enviroment';

@Injectable({providedIn: 'root'})
export class ApiService {
    constructor(
        private _loadingBar : FuseLoadingService,
        private http: HttpClient,
        private fuseConfirm: FuseConfirmationService,
        private sckaBar: MatSnackBar
    ) { }

    get serverUrl(){
        return `${environment.URL_BACKEND}`
    }

    /**
     *
     * @param endpoint API endpoint to fetch data
     * @param params   json params objetc
     * @param errorMessage  string text displaying when status code !=200
     * @returns
     */

    GetMethod(_url: string, params?, errorMessage?:string){
        this._loadingBar.show()
        const url = `${this.serverUrl}${_url}`
        return this.http.get(url, { params})
                        .pipe(
                            tap(response => {
                                this._loadingBar.hide()
                            }),
                            catchError((error: HttpErrorResponse) => {
                                this._loadingBar.hide();
                                //
                                let _message = this.build_error_message(error,  errorMessage)
                                this.showErrorMessage(_message)
                                return throwError(this.showErrorMessage(_message))
                            })
                        );
    }

    PostMethod(_url: string, body:any, params?, errorMessage?:string){
        this._loadingBar.show()
        const url = `${this.serverUrl}${_url}`
        return this.http.post(url, body, {params})
                        .pipe(
                            tap(response => {
                                this._loadingBar.hide()
                            }),
                            catchError((error: HttpErrorResponse) => {
                                this._loadingBar.hide();
                                //
                                let _message = this.build_error_message(error,  errorMessage)
                                this.showErrorMessage(_message)
                                return throwError(error)
                            })
                        );
    }

    PutMethod(_url: string, body:any, params?, errorMessage?:string) {
        this._loadingBar.show()
        const url =`${this.serverUrl}${_url}`
        return this.http.put(url, body, {params})
                        .pipe(
                            tap(response => {
                                this._loadingBar.hide()
                            }),
                            catchError((error: HttpErrorResponse) => {
                                this._loadingBar.hide();
                                //
                                let _message = this.build_error_message(error,  errorMessage)
                                this.showErrorMessage(_message)
                                return throwError(error)
                            })
                        );
    }

    DeleteMethod(_url: string,  params?, errorMessage?:string) {
        this._loadingBar.show()
        const url =  `${this.serverUrl}${_url}`
        return this.http.delete(url, {params})
                        .pipe(
                            tap(response => {
                                this._loadingBar.hide()
                            }),
                            catchError((error: HttpErrorResponse) => {
                                this._loadingBar.hide();
                                //
                                let _message = this.build_error_message(error,  errorMessage)
                                this.showErrorMessage(_message)
                                return throwError(error)
                            })
                        );
    }



    build_error_message(error: HttpErrorResponse, message?:string){
        let server_error_response = error?.error?.message ?? '';
        return `Error ${error.status} - ${message} - el servidor respondió ${JSON.stringify(server_error_response)}`;
    }

    showErrorMessage(message?:string){

        return  this.fuseConfirm.open( {
            title: 'Ups!',
            message: message,
            icon: {
                show: true,
                name: 'error',
                color:'warning'
            },
            actions: {
                confirm: { show: false},
                cancel: {show:  true}
            },
            dismissible:true

        })

    }

    showSuccessMessage(message?: string){
        return this.sckaBar.open(
            message,
            '',
            {
                duration: 4000,
                verticalPosition: 'top',
                panelClass: ['bg-sky-400/70', 'text-white']
            },

        )

    }


}
