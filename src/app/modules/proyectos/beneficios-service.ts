import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';

export interface BeneficioDTO {
  nombreBeneficio: string;
  descripcion?: string | null;
  unidadMedida: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiosService {
  constructor(private _api: ApiService) {}

  getBeneficios(): Promise<any[]> {
    const url = '/beneficios';
    return new Promise((resolve) => {
      this._api.GetMethod(url, {}, 'Error al obtener beneficios.')
        .subscribe(
          (resp: any) => resolve(resp ?? []),
          () => resolve([])
        );
    });
  }

  getBeneficioById(beneficioId: number): Promise<any> {
    const url = `/beneficios/${beneficioId}`;
    return new Promise((resolve, reject) => {
      this._api.GetMethod(url, {}, 'Error al obtener beneficio.')
        .subscribe(
          (resp: any) => resolve(resp),
          () => reject(true)
        );
    });
  }

  getBeneficiosPorProyecto(proyectoId: number, q?: string): Promise<any[]> {
    const url = '/beneficios';
    const params: any = { proyectoId };
    if (q && q.trim().length > 0) params.q = q.trim();
    return new Promise((resolve) => {
      this._api.GetMethod(url, params, 'Error al obtener beneficios del proyecto.')
        .subscribe(
          (resp: any) => resolve(resp ?? []),
          () => resolve([])
        );
    });
  }

  addBeneficio(body: BeneficioDTO): Promise<any> {
    const url = '/beneficios';
    return new Promise((resolve, reject) => {
      this._api.PostMethod(url, body, {}, 'Error al registrar beneficio.')
        .subscribe(
          (resp: any) => resolve(resp),
          () => reject(true)
        );
    });
  }

  updateBeneficio(beneficioId: number, body: BeneficioDTO): Promise<any> {
    const url = `/beneficios/${beneficioId}`;
    return new Promise((resolve, reject) => {
      this._api.PutMethod(url, body, {}, 'Error al actualizar beneficio.')
        .subscribe(
          (resp: any) => resolve(resp),
          () => reject(true)
        );
    });
  }

  deleteBeneficio(beneficioId: number): Promise<any> {
    const url = `/beneficios/${beneficioId}`;
    return new Promise((resolve, reject) => {
      this._api.DeleteMethod(url, {}, 'Error al eliminar beneficio.')
        .subscribe(
          (resp: any) => resolve(resp),
          () => reject(true)
        );
    });
  }
}
