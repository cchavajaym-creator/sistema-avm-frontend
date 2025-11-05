import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProyectosUserDTO } from './proyectos-usuarios.model';
import { ChartBarProyectos } from './chart-bar-proyectos.model';

@Injectable({providedIn: 'root'})
export class HomeService {
    proyectosUser: BehaviorSubject<ProyectosUserDTO>= new BehaviorSubject<ProyectosUserDTO>(null)

    get proyectosUser$():Observable<any> {
        return this.proyectosUser.asObservable()
    }

    constructor(private _apiService: ApiService) { }

    getProyectosUser(user_id:number){
        const url = `/users/${user_id}/proyectos`
        return new Promise ((resolve, reject)=>{
            this._apiService
                .GetMethod(url, {}, 'Error al obtener proyecto.')
                .subscribe(
                    (response: ProyectosUserDTO) => {
                        this.proyectosUser.next(response)
                        resolve(response);
                    },
                    (error) => {
                        reject(true);
                    }
                );
        })
    }

    // Distribución de beneficiarios por género
    getDistribucionGenero(): Promise<Array<{ generoDesc: string; totalBeneficiarios: number; porcentaje: number }>> {
        const url = `/beneficiarios-distribucion-genero`;
        return new Promise((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener distribución por género.')
                .subscribe(
                    (response: any) => {
                        const items = Array.isArray(response) ? response : (response?.items ?? []);
                        resolve(items);
                    },
                    () => reject([])
                );
        });
    }

    // Beneficiarios activos por proyecto
    getBeneficiariosActivosPorProyecto(): Promise<Array<{ proyectoId: number; proyecto: string; totalBeneficiariosActivos: number }>> {
        const url = `/beneficiarios-activos-por-proyecto`;
        return new Promise((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener beneficiarios activos por proyecto.')
                .subscribe(
                    (response: ChartBarProyectos[]) => {
                        console.log(response)
                        resolve(response);
                    },
                    () => reject([])
                );
        });
    }

}
