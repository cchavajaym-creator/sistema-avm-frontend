import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { UsuarioDTO } from './models/listado-usuarios.model';
import { BehaviorSubject } from 'rxjs';
import { AgregarUsuarioDTO } from './models/nuevo-usuario.model';

@Injectable({providedIn: 'root'})

export class AdminService {
    usuarios: BehaviorSubject<UsuarioDTO[]>= new BehaviorSubject<UsuarioDTO[]>([])

    get usuarios$() {
        return this.usuarios.asObservable();
    }

    constructor(
        private _apiService: ApiService
    ) { }


    getListadoUsuarios() {
        const url = '/users';
        return new Promise((resolve, reject) => {
            this._apiService.GetMethod(url, {}, 'Error al obtener listado de usuarios.')
                .subscribe((response: UsuarioDTO[]) => {
                    this.usuarios.next(response)
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    postUsuario(usuario: AgregarUsuarioDTO) {
        const url = '/users/register';
        return new Promise((resolve, reject) => {
            this._apiService.PostMethod(url, usuario, {}, 'Error al registrar usuario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    getCatalogos(catalogo:string, params?:any){
        const url = `/catalogos/${catalogo}`;
        return new Promise((resolve, reject) => {
            this._apiService.GetMethod(url, params, 'Error al obtener información.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    actualizarRolUsuario(usuarioId: number, rolId: number){
        const url = `/users/${usuarioId}/rol`;
        const body = { rolId };
        return new Promise((resolve, reject) => {
            this._apiService.PutMethod(url, body, {}, 'Error al actualizar rol del usuario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }
}
