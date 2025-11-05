import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { BeneficiarioDTO } from './models/beneficiariosDTO.model';
import { BeneficiarioUpdateDTO } from './models/beneficiario-update.model';
import { LocacionDTO, LocacionesDTO } from './models/locacionDTO.model';
import { BehaviorSubject } from 'rxjs';
import { BeneficiarioListDTO, ResponseBeneficiarioListDTO } from './models/beneficiarios-list-DTO.model';

@Injectable({providedIn: 'root'})
export class BeneficiariosService {
    locaion: BehaviorSubject<LocacionesDTO[]>= new BehaviorSubject<LocacionesDTO[]>([])
    beneficiarios: BehaviorSubject<BeneficiarioListDTO[]>= new BehaviorSubject<BeneficiarioListDTO[]>([])

    get locaion$() {
        return this.locaion.asObservable();
    }

    get beneficiarios$() {
        return this.beneficiarios.asObservable();
    }

    constructor(private _apiService: ApiService) { }

    postBeneficiarios(beneficiario: BeneficiarioDTO) {
        const url = '/beneficiarios';
        return new Promise((resolve, reject) => {
            this._apiService.PostMethod(url, beneficiario, {}, 'Error al registrar usuario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    updateBeneficiario(beneficiarioId: number, beneficiario: BeneficiarioUpdateDTO) {
        const url = `/beneficiarios/${beneficiarioId}`;
        return new Promise((resolve, reject) => {
            this._apiService.PutMethod(url, beneficiario, {}, 'Error al actualizar beneficiario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    getBeneficiarios(
        start?: number,
        end?: number,
        filters?: { numeroDocumento?: string; q?: string; municipioId?: number; departamentoId?: number }
    ): Promise<ResponseBeneficiarioListDTO> {
        const url = '/beneficiarios';
        return new Promise((resolve, reject) => {
            const params: any = {};
            if (typeof start === 'number') { params.start = start; }
            if (typeof end === 'number') { params.end = end; }
            if (filters?.numeroDocumento) { params.numeroDocumento = filters.numeroDocumento; }
            if (filters?.q) { params.q = filters.q; }
            if (typeof filters?.municipioId === 'number') { params.municipioId = filters.municipioId; }
            if (typeof filters?.departamentoId === 'number') { params.departamentoId = filters.departamentoId; }

            this._apiService.GetMethod(url, params, 'Error al on¿btener listado de Beneficiarios.')
                .subscribe((response: ResponseBeneficiarioListDTO) => {
                    // Emit only the items array to subscribers to keep existing component bindings intact
                    this.beneficiarios.next(response.items || [])
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    getBeneficiarioPorId(id: number) {
        const url = `/beneficiarios/por-id/${id}`;
        return new Promise((resolve, reject) => {
            this._apiService.GetMethod(url, {}, 'Error al obtener el beneficiario.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    getCatalogos(municipio_id:number){
        const url = `/locaciones?municipioId=${municipio_id}`;
        return new Promise((resolve, reject) => {
            this._apiService.GetMethod(url, {}, 'Error al obtener información.')
                .subscribe((response: LocacionesDTO[]) => {
                    this.locaion.next(response)
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

    postLocacion(locacion: LocacionDTO) {
        const url = '/locaciones';
        return new Promise((resolve, reject) => {
            this._apiService.PostMethod(url, locacion, {}, 'Error al registrar locación.')
                .subscribe((response: any) => {
                    resolve(response);
                }, error => {
                    reject(true);
                });
        });
    }

}
