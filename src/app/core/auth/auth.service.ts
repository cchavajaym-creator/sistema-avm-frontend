import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { ApiService } from '../service/api-service';
import { environment } from 'eviroments/enviroment';
import { UsuarioLogueado } from '../user/user.types';
import { UserPreferencesService } from 'app/core/service/user-preferences.service';
import { FuseConfigService } from '@fuse/services/config';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _apiService = inject(ApiService)
    private _prefs = inject(UserPreferencesService);
    private _fuseConfig = inject(FuseConfigService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        sessionStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return sessionStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { correoElectronico: string; contrasena: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }
        const url= `${environment.URL_BACKEND}/users/login`
        return this._httpClient.post(url, credentials).pipe(
            switchMap((response: any) => {
                // Store the access token in the local storage
                this.accessToken = response.accessToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                const decodedToken = AuthUtils.decodeToken(response.accessToken);

                this._userService.usurioLogueado = decodedToken as UsuarioLogueado
                // Cargar y aplicar preferencias del usuario (no bloqueante)
                this._loadAndApplyUserPreferences();
                // Return a new observable with the response
                return of(response);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token
        return this._httpClient
            .post('api/auth/sign-in-with-token', {
                accessToken: this.accessToken,
            })
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap((response: any) => {
                    // Replace the access token with the new one if it's available on
                    // the response object.
                    //
                    // This is an added optional step for better security. Once you sign
                    // in using the token, you should generate a new one on the server
                    // side and attach it to the response object. Then the following
                    // piece of code can replace the token with the refreshed one.
                    if (response.accessToken) {
                        this.accessToken = response.accessToken;
                    }

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = response.user;

                    // Return true
                    return of(true);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        sessionStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        name: string;
        email: string;
        password: string;
        company: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists and didn't expire, set auth state locally
        try {
            const decodedToken = AuthUtils.decodeToken(this.accessToken);
            this._userService.usurioLogueado = decodedToken as UsuarioLogueado;
        } catch (e) {
            return of(false);
        }
        this._authenticated = true;
        // Cargar y aplicar preferencias cuando la sesión ya existe
        this._loadAndApplyUserPreferences();
        return of(true);
    }

    /**
     * Carga preferencias del usuario y las aplica a la configuración global.
     * No bloquea el flujo de autenticación.
     */
    private _loadAndApplyUserPreferences(): void {
        this._prefs
            .get()
            .then((prefs) => {
                if (!prefs) return;
                // Solo aplicar valores válidos para no pisar defaults con null
                const cfg: any = {};
                if (prefs.theme) cfg.theme = prefs.theme as any;
                if (prefs.scheme) cfg.scheme = prefs.scheme as any;
                if (prefs.layout) cfg.layout = prefs.layout as any;
                if (Object.keys(cfg).length > 0) {
                    this._fuseConfig.config = cfg;
                }
            })
            .catch(() => void 0);
    }
}
