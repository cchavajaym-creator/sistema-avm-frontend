import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from 'app/core/service/api-service';
import { BeneficiariosReporteFilters, ReporteResponse, BeneficiarioDetalleItem } from './models/reporte-beneficiarios.model';
import { environment } from 'eviroments/enviroment';
import { BeneficiariosProyectoFilters, BeneficiarioProyectoItem } from './models/reporte-beneficiarios-proyecto.model';
import { BeneficiarioAggItem, BeneficiariosAggFilters } from './models/reporte-beneficiarios-agg.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private _beneficiariosReporte = new BehaviorSubject<BeneficiarioDetalleItem[]>([]);

  get beneficiariosReporte$() {
    return this._beneficiariosReporte.asObservable();
  }

  constructor(private _api: ApiService, private _http: HttpClient) {}

  getReporteBeneficiarios(filters: BeneficiariosReporteFilters = {}): Promise<ReporteResponse<BeneficiarioDetalleItem>> {
    // Endpoint proporcionado por el backend
    const url = '/beneficiarios-detalle';
    const params: any = {};

    if (filters.q) params.q = filters.q;
    if (typeof filters.municipioId === 'number') params.municipioId = String(filters.municipioId);
    if (typeof filters.departamentoId === 'number') params.departamentoId = String(filters.departamentoId);
    if (typeof filters.estadoBeneficiario === 'number') params.estadoBeneficiario = String(filters.estadoBeneficiario);
    if (typeof filters.mayorEdad === 'boolean') params.mayorEdad = filters.mayorEdad;
    if (typeof filters.page === 'number') params.page = String(filters.page);
    if (typeof filters.pageSize === 'number') params.pageSize = String(filters.pageSize);
    if (typeof filters.start === 'number') params.start = String(filters.start);
    if (typeof filters.end === 'number') params.end = String(filters.end);

    return new Promise((resolve, reject) => {
      this._api
        .GetMethod(url, params, 'Error al obtener el reporte de beneficiarios.')
        .subscribe(
          (resp: ReporteResponse<BeneficiarioDetalleItem>) => {
            this._beneficiariosReporte.next(resp?.items ?? []);
            resolve(resp);
          },
          () => reject(true)
        );
    });
  }

  // Placeholder para futuros reportes de proyectos
  getReporteProyectos(params?: any) {
    const url = '/reportes/proyectos';
    return this._api.GetMethod(url, params, 'Error al obtener el reporte de proyectos.');
  }

  // Formateadores adicionales si llegan a ser necesarios en otros endpoints

  exportReporteBeneficiariosXlsx(filters: BeneficiariosReporteFilters = {}): Promise<{ blob: Blob; filename?: string }> {
    const endpoint = '/beneficiarios-detalle/export/xlsx';
    const url = `${environment.URL_BACKEND}${endpoint}`;

    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (typeof filters.municipioId === 'number') params = params.set('municipioId', String(filters.municipioId));
    if (typeof filters.departamentoId === 'number') params = params.set('departamentoId', String(filters.departamentoId));
    if (typeof filters.estadoBeneficiario === 'number') params = params.set('estadoBeneficiario', String(filters.estadoBeneficiario));
    if (typeof filters.mayorEdad === 'boolean') params = params.set('mayorEdad', filters.mayorEdad ? 'true' : 'false');

    return new Promise((resolve, reject) => {
      this._http
        .get(url, { params, responseType: 'blob', observe: 'response' })
        .subscribe({
          next: (resp) => {
            const blob = resp.body as Blob;
            // Intentar obtener nombre desde Content-Disposition
            const cd = resp.headers.get('content-disposition') || resp.headers.get('Content-Disposition');
            let filename: string | undefined = undefined;
            if (cd) {
              const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
              const raw = match?.[1] || match?.[2];
              if (raw) filename = decodeURIComponent(raw);
            }
            resolve({ blob, filename });
          },
          error: () => reject(true),
        });
    });
  }

  // ------------------------------------------------------
  // Reporte: Beneficiarios por Proyecto
  // ------------------------------------------------------
  getReporteBeneficiariosPorProyecto(filters: BeneficiariosProyectoFilters = {}): Promise<ReporteResponse<BeneficiarioProyectoItem>> {
    const url = '/beneficiarios-detalle-proyecto';
    const params: any = {};

    if (typeof filters.proyectoId === 'number') params.proyectoId = String(filters.proyectoId);
    if (typeof filters.estadoEnProyecto === 'number') params.estadoEnProyecto = String(filters.estadoEnProyecto);
    if (typeof filters.municipioId === 'number') params.municipioId = String(filters.municipioId);
    if (typeof filters.departamentoId === 'number') params.departamentoId = String(filters.departamentoId);
    if (typeof filters.estadoBeneficiario === 'number') params.estadoBeneficiario = String(filters.estadoBeneficiario);
    if (typeof filters.mayorEdad === 'boolean') params.mayorEdad = filters.mayorEdad;
    if (filters.q) params.q = filters.q;
    if (typeof filters.page === 'number') params.page = String(filters.page);
    if (typeof filters.pageSize === 'number') params.pageSize = String(filters.pageSize);
    if (typeof filters.start === 'number') params.start = String(filters.start);
    if (typeof filters.end === 'number') params.end = String(filters.end);

    return new Promise((resolve, reject) => {
      this._api
        .GetMethod(url, params, 'Error al obtener beneficiarios por proyecto.')
        .subscribe(
          (resp: ReporteResponse<BeneficiarioProyectoItem>) => resolve(resp),
          () => reject(true)
        );
    });
  }

  obtenerBeneficiarioProyecto(beneficiarioId: number, proyectoId: number): Promise<BeneficiarioProyectoItem> {
    const url = '/beneficiarios-detalle-proyecto';
    const params: any = { beneficiarioId: String(beneficiarioId), proyectoId: String(proyectoId) };
    return new Promise((resolve, reject) => {
      this._api
        .GetMethod(url, params, 'Error al obtener beneficiario del proyecto.')
        .subscribe(
          (resp: any) => {
            const item: BeneficiarioProyectoItem = Array.isArray(resp?.items) ? resp.items[0] : (resp as BeneficiarioProyectoItem);
            resolve(item);
          },
          () => reject(true)
        );
    });
  }

  exportReporteBeneficiariosProyectoXlsx(filters: BeneficiariosProyectoFilters = {}): Promise<{ blob: Blob; filename?: string }> {
    const endpoint = '/beneficiarios-detalle-proyecto/export/xlsx';
    const url = `${environment.URL_BACKEND}${endpoint}`;

    let params = new HttpParams();
    if (typeof filters.proyectoId === 'number') params = params.set('proyectoId', String(filters.proyectoId));
    if (typeof filters.estadoEnProyecto === 'number') params = params.set('estadoEnProyecto', String(filters.estadoEnProyecto));
    if (typeof filters.municipioId === 'number') params = params.set('municipioId', String(filters.municipioId));
    if (typeof filters.departamentoId === 'number') params = params.set('departamentoId', String(filters.departamentoId));
    if (typeof filters.estadoBeneficiario === 'number') params = params.set('estadoBeneficiario', String(filters.estadoBeneficiario));
    if (typeof filters.mayorEdad === 'boolean') params = params.set('mayorEdad', filters.mayorEdad ? 'true' : 'false');
    if (filters.q) params = params.set('q', filters.q);

    return new Promise((resolve, reject) => {
      this._http
        .get(url, { params, responseType: 'blob', observe: 'response' })
        .subscribe({
          next: (resp) => {
            const blob = resp.body as Blob;
            const cd = resp.headers.get('content-disposition') || resp.headers.get('Content-Disposition');
            let filename: string | undefined = undefined;
            if (cd) {
              const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
              const raw = match?.[1] || match?.[2];
              if (raw) filename = decodeURIComponent(raw);
            }
            resolve({ blob, filename });
          },
          error: () => reject(true),
        });
    });
  }

  // ------------------------------------------------------
  // Reporte: Proyectos por Beneficiario (AGG)
  // ------------------------------------------------------
  getReporteBeneficiariosAgg(filters: BeneficiariosAggFilters = {}): Promise<ReporteResponse<BeneficiarioAggItem>> {
    const url = '/beneficiarios-detalle-agg';
    const params: any = {};

    if (typeof filters.municipioId === 'number') params.municipioId = String(filters.municipioId);
    if (typeof filters.departamentoId === 'number') params.departamentoId = String(filters.departamentoId);
    if (typeof filters.estadoBeneficiario === 'number') params.estadoBeneficiario = String(filters.estadoBeneficiario);
    if (typeof filters.mayorEdad === 'boolean') params.mayorEdad = filters.mayorEdad;
    if (filters.q) params.q = filters.q;
    if (typeof filters.page === 'number') params.page = String(filters.page);
    if (typeof filters.pageSize === 'number') params.pageSize = String(filters.pageSize);
    if (typeof filters.start === 'number') params.start = String(filters.start);
    if (typeof filters.end === 'number') params.end = String(filters.end);

    return new Promise((resolve, reject) => {
      this._api
        .GetMethod(url, params, 'Error al obtener beneficiarios agregados (proyectos por beneficiario).')
        .subscribe(
          (resp: ReporteResponse<BeneficiarioAggItem>) => resolve(resp),
          () => reject(true)
        );
    });
  }

  exportReporteBeneficiariosAggXlsx(filters: BeneficiariosAggFilters = {}): Promise<{ blob: Blob; filename?: string }> {
    const endpoint = '/beneficiarios-detalle-agg/export/xlsx';
    const url = `${environment.URL_BACKEND}${endpoint}`;

    let params = new HttpParams();
    if (typeof filters.municipioId === 'number') params = params.set('municipioId', String(filters.municipioId));
    if (typeof filters.departamentoId === 'number') params = params.set('departamentoId', String(filters.departamentoId));
    if (typeof filters.estadoBeneficiario === 'number') params = params.set('estadoBeneficiario', String(filters.estadoBeneficiario));
    if (typeof filters.mayorEdad === 'boolean') params = params.set('mayorEdad', filters.mayorEdad ? 'true' : 'false');
    if (filters.q) params = params.set('q', filters.q);

    return new Promise((resolve, reject) => {
      this._http
        .get(url, { params, responseType: 'blob', observe: 'response' })
        .subscribe({
          next: (resp) => {
            const blob = resp.body as Blob;
            const cd = resp.headers.get('content-disposition') || resp.headers.get('Content-Disposition');
            let filename: string | undefined = undefined;
            if (cd) {
              const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
              const raw = match?.[1] || match?.[2];
              if (raw) filename = decodeURIComponent(raw);
            }
            resolve({ blob, filename });
          },
          error: () => reject(true),
        });
    });
  }

  exportReporteBeneficiariosAggCsv(filters: BeneficiariosAggFilters = {}): Promise<{ blob: Blob; filename?: string }> {
    const endpoint = '/beneficiarios-detalle-agg/export/csv';
    const url = `${environment.URL_BACKEND}${endpoint}`;

    let params = new HttpParams();
    if (typeof filters.municipioId === 'number') params = params.set('municipioId', String(filters.municipioId));
    if (typeof filters.departamentoId === 'number') params = params.set('departamentoId', String(filters.departamentoId));
    if (typeof filters.estadoBeneficiario === 'number') params = params.set('estadoBeneficiario', String(filters.estadoBeneficiario));
    if (typeof filters.mayorEdad === 'boolean') params = params.set('mayorEdad', filters.mayorEdad ? 'true' : 'false');
    if (filters.q) params = params.set('q', filters.q);

    return new Promise((resolve, reject) => {
      this._http
        .get(url, { params, responseType: 'blob', observe: 'response' })
        .subscribe({
          next: (resp) => {
            const blob = resp.body as Blob;
            const cd = resp.headers.get('content-disposition') || resp.headers.get('Content-Disposition');
            let filename: string | undefined = undefined;
            if (cd) {
              const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
              const raw = match?.[1] || match?.[2];
              if (raw) filename = decodeURIComponent(raw);
            }
            resolve({ blob, filename });
          },
          error: () => reject(true),
        });
    });
  }
}
