import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { EstadosDTO } from 'app/modules/models-general/estados.model';

@Injectable({providedIn: 'root'})
export class RegistroProyectoService {


    constructor(private _apiService: ApiService) { }

    cargarEstados(params:any) {
        const url = `/catalogos/estados`;
        return new Promise((resolve, reject) => {
        this._apiService
            .GetMethod(url, params, 'Error al obtener estados del proyecto.')
            .subscribe((response: EstadosDTO[]) => {
                    resolve(response);
                },
                () => {
                    reject(true);
                })
        });
    }

}
