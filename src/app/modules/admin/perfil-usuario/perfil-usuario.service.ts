import { ApiService } from 'app/core/service/api-service';
import { Injectable } from '@angular/core';
import { PerfilUsuarioDTO } from '../models/perfil-usuario.model';

@Injectable({providedIn: 'root'})
export class PerfilUsuarioService {

    constructor(private _apiService:ApiService) { }

    putPerfilUsuario(userId:number, usuario: Partial<PerfilUsuarioDTO>){
        const url = `/users/${userId}/perfil`;
        return new Promise((resolve, reject) => {
            this._apiService.PutMethod(url, usuario, {}, 'Error al actualizar Infomación.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    getPerfilUsuario(userId:number){
        const url = `/users/${userId}/perfil`;
        return new Promise((resolve, reject) => {
            this._apiService.GetMethod(url, {}, 'Error al obtener Infomación del usuario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }
}
