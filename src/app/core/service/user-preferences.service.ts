import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { UserPreferences } from '../models/user-preferences.model';
import { UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  constructor(private _api: ApiService, private _userService: UserService) {}

  private currentUserId(): number | null {
    const u = this._userService.usuarioLogueadoValues as any;
    // Prefer userId; sometimes backends use sub
    return u?.userId ?? u?.sub ?? null;
  }

  get(): Promise<UserPreferences | null> {
    const uid = this.currentUserId();
    const url = uid ? `/users/${uid}/settings` : `/users/settings`;
    return new Promise((resolve, reject) => {
      this._api.GetMethod(url, {}, 'Error al obtener preferencias de usuario.')
        .subscribe(
          (resp: any) => {
            if (!resp) return resolve(null);
            const mapped: UserPreferences = {
              theme: resp.theme,
              scheme: resp.scheme,
              layout: resp.layout,
            };
            resolve(mapped);
          },
          () => resolve(null) // En ausencia, devolver null sin romper
        );
    });
  }

  save(prefs: UserPreferences): Promise<void> {
    const uid = this.currentUserId();
    const url = uid ? `/users/${uid}/settings` : `/users/settings`;
    return new Promise((resolve, reject) => {
      this._api.PutMethod(url, prefs, {}, 'Error al guardar preferencias de usuario.')
        .subscribe(
          () => resolve(),
          () => reject()
        );
    });
  }
}
