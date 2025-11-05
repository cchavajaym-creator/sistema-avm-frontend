import { Injectable } from '@angular/core';
import { ApiService } from 'app/core/service/api-service';
import { Proyecto } from './models/proyecto.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ProyectoUsuario } from './models/proyecto-usuario.model';
import { ProyectoBeneficiario } from './models/proyecto-beneficiario.model';
import { Actividad } from './models/actividad.model';
import { AsistenciaActividad } from './models/asistencia-actividad.model';
import { EntregaBeneficio } from './models/entrega-beneficio.model';

@Injectable({ providedIn: 'root' })
export class ProyectosService {
    private _proyectos = new BehaviorSubject<Proyecto[]>([]);
    proyectos$ = this._proyectos.asObservable();
    // Proyecto actual para el detalle/edición
    private _proyectoActual = new BehaviorSubject<Proyecto | null>(null);
    proyectoActual$ = this._proyectoActual.asObservable();
    actividadesProyecto: BehaviorSubject<Actividad[]> = new BehaviorSubject<Actividad[]>([])
    // Listado de eventos de entrega del proyecto actual
    private _eventosEntrega = new BehaviorSubject<any[]>([]);
    eventosEntrega$ = this._eventosEntrega.asObservable();

    get actividadesProyecto$():Observable<any>{
        return this.actividadesProyecto.asObservable()
    }

    constructor(private _apiService: ApiService) {}

    // Notificador para cambios en beneficios asociados a un proyecto
    private _beneficiosProyectoChanged = new Subject<number>();
    beneficiosProyectoChanged$ = this._beneficiosProyectoChanged.asObservable();

    postProyecto(body: {
        nombreProyecto: string;
        descripcion?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    }) {
        const url = '/proyectos';
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    (error) => {
                        reject(true);
                    }
                );
        });
    }

    getProyectos(params?: any) {
        const url = '/proyectos';
        return new Promise<Proyecto[]>((resolve, reject) => {
            this._apiService
                .GetMethod(url, params, 'Error al obtener proyectos.')
                .subscribe(
                    (response: any) => {
                        const data = (response as Proyecto[]) ?? [];
                        resolve(data);
                    },
                    (error) => {
                        reject(true);
                    }
                );
        });
    }

    /**
     * Obtiene el resumen del proyecto para gráficas del detalle
     * GET /proyectos/resumen/:id
     */
    getResumenProyecto(proyectoId: number) {
        const url = `/proyectos/resumen/${proyectoId}`;
        return new Promise<any>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener el resumen del proyecto.')
                .subscribe(
                    (response: any) => resolve(response),
                    () => reject(true)
                );
        });
    }

    loadProyectos(params?: any): void {
        const url = '/proyectos';
        this._apiService
            .GetMethod(url, params, 'Error al obtener proyectos.')
            .subscribe(
                (response: any) => {
                    const data = (response as Proyecto[]) ?? [];
                    this._proyectos.next(data);
                },
                () => {
                    this._proyectos.next([]);
                }
            );
    }

    getProyectoById(id: number) {
        const url = `/proyectos/${id}`;
        return new Promise<Proyecto>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener el proyecto.')
                .subscribe(
                    (response: any) => {
                        const proyecto = response as Proyecto;
                        this._proyectoActual.next(proyecto);
                        resolve(proyecto);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    updateProyecto(
        id: number,
        body: {
            nombreProyecto: string;
            descripcion?: string | null;
            fechaInicio?: string | null;
            fechaFin?: string | null;
            estadoId: number;
        }
    ) {
        const url = `/proyectos/${id}`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PutMethod(url, body, {}, 'Error al actualizar el proyecto.')
                .subscribe(
                    (response: any) => {
                        // Intentar actualizar el estado local del proyecto actual
                        if (response && typeof response === 'object') {
                            this._proyectoActual.next(response as Proyecto);
                        } else {
                            const current = this._proyectoActual.getValue();
                            if (current) {
                                const merged: Proyecto = {
                                    ...current,
                                    nombreProyecto: body.nombreProyecto,
                                    descripcion: body.descripcion ?? current.descripcion,
                                    fechaInicio: body.fechaInicio ?? current.fechaInicio,
                                    fechaFin: body.fechaFin ?? current.fechaFin,
                                    estado: {
                                        ...(current.estado || { estadoId: body.estadoId }),
                                        estadoId: body.estadoId,
                                    },
                                };
                                this._proyectoActual.next(merged);
                            }
                        }
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    setProyectoActual(proyecto: Proyecto | null): void {
        this._proyectoActual.next(proyecto);
    }

    addUsuarioAProyecto(proyectoId: number, usuarioId: number) {
        const url = `/proyectos/${proyectoId}/usuarios`;
        const body = { usuarioId } as const;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al agregar usuario al proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    getUsuariosDeProyecto(proyectoId: number) {
        const url = `/proyectos/${proyectoId}/usuarios`;
        return new Promise<ProyectoUsuario[]>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener usuarios del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve((response as ProyectoUsuario[]) ?? []);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    getBeneficiariosDeProyecto(proyectoId: number) {
        const url = `/proyectos/${proyectoId}/beneficiarios`;
        return new Promise<ProyectoBeneficiario[]>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener beneficiarios del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve((response as ProyectoBeneficiario[]) ?? []);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    removeUsuarioDeProyecto(proyectoId: number, usuarioId: number) {
        const url = `/proyectos/${proyectoId}/usuarios/${usuarioId}`;
        return new Promise((resolve, reject) => {
            this._apiService
                .DeleteMethod(url, {}, 'Error al remover usuario del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    addBeneficiarioAProyecto(
        proyectoId: number,
        body: { beneficiarioId: number; fechaIncorporacion: string; estadoId: number }
    ) {
        const url = `/proyectos/${proyectoId}/beneficiarios`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al agregar beneficiario al proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    removeBeneficiarioDeProyecto(proyectoId: number, beneficiarioId: number) {
        const url = `/proyectos/${proyectoId}/beneficiarios/${beneficiarioId}`;
        return new Promise((resolve, reject) => {
            this._apiService
                .DeleteMethod(url, {}, 'Error al remover beneficiario del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    getActividadesDeProyecto(proyectoId: number) {
        const url = `/proyectos/${proyectoId}/actividades`;
        return new Promise<Actividad[]>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener actividades del proyecto.')
                .subscribe(
                    (response: Actividad[]) => {
                        this.actividadesProyecto.next(response)
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    getActividadDeProyecto(proyectoId: number, actividadId: number) {
        const url = `/proyectos/${proyectoId}/actividades/${actividadId}`;
        return new Promise<Actividad>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener la actividad del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response as Actividad);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    addActividadAProyecto(
        proyectoId: number,
        body: {
            nombreActividad: string;
            tipoActividad: string;
            descripcion?: string | null;
            fechaActividad: string; // YYYY-MM-DD
            lugar?: string | null;
        }
    ) {
        const url = `/proyectos/${proyectoId}/actividades`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al agregar actividad al proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    addBeneficioAProyecto(
        proyectoId: number,
        body: { nombreBeneficio: string; descripcion?: string | null; unidadMedida: string }
    ) {
        const url = `/proyectos/${proyectoId}/beneficios`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar beneficio del proyecto.')
                .subscribe(
                    (response: any) => {
                        // Notificar cambio para que vistas dependientes recarguen
                        try { this._beneficiosProyectoChanged.next(proyectoId); } catch {}
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    asociarBeneficioAProyecto(proyectoId: number, beneficioId: number) {
        const url = `/proyectos/${proyectoId}/beneficios`;
        const body = { beneficioId } as const;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al asociar beneficio al proyecto.')
                .subscribe(
                    (response: any) => {
                        // Notificar cambio para que vistas dependientes recarguen
                        try { this._beneficiosProyectoChanged.next(proyectoId); } catch {}
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    updateActividadDeProyecto(
        proyectoId: number,
        actividadId: number,
        body: {
            nombreActividad: string;
            tipoActividad: string;
            descripcion?: string | null;
            fechaActividad: string; // YYYY-MM-DD
            lugar?: string | null;
        }
    ) {
        const url = `/proyectos/${proyectoId}/actividades/${actividadId}`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PutMethod(url, body, {}, 'Error al actualizar la actividad del proyecto.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    registrarAsistenciaActividad(
        proyectoId: number,
        actividadId: number,
        body: { items: { beneficiarioId: number; fechaRegistro: string; estadoId: number; observaciones?: string }[] }
    ) {
        const url = `/proyectos/${proyectoId}/actividades/${actividadId}/asistencias/lote`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar asistencia de la actividad.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    getAsistenciasDeActividad(
        proyectoId: number,
        actividadId: number,
    ) {
        const url = `/proyectos/${proyectoId}/actividades/${actividadId}/asistencias`;
        return new Promise<AsistenciaActividad[]>((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener asistencias de la actividad.')
                .subscribe(
                    (response: any) => {
                        resolve((response as AsistenciaActividad[]) ?? []);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    registrarEntregaBeneficio(
        proyectoId: number,
        body: { beneficiarioId: number; beneficioId: number; fechaEntrega: string; cantidad: number; observaciones?: string | null }
    ) {
        const url = `/proyectos/${proyectoId}/entregas`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar la entrega.')
                .subscribe(
                    (response: any) => {
                        resolve(response);
                    },
                    () => {
                        reject(true);
                    }
                );
        });
    }

    registrarEntregasBeneficioLote(
        proyectoId: number,
        beneficioId: number,
        body: { eventoId: number; items: { beneficiarioId: number; fechaEntrega: string; cantidad: number; estadoId: number; observaciones?: string }[] }
    ) {
        const url = `/proyectos/${proyectoId}/beneficios/${beneficioId}/entregas/lote`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar entregas del beneficio.')
                .subscribe(
                    (response: any) => resolve(response),
                    () => reject(true)
                );
        });
    }

    registrarEventoEntrega(
        proyectoId: number,
        body: { nombre: string; fechaEvento: string; lugar: string; observaciones?: string | null; createdBy?: number | null }
    ) {
        const url = `/proyectos/${proyectoId}/eventos-entrega`;
        return new Promise((resolve, reject) => {
            this._apiService
                .PostMethod(url, body, {}, 'Error al registrar el evento de entrega.')
                .subscribe(
                    (response: any) => {
                        // Refrescar la lista de eventos tras registrar uno nuevo
                        try { this.loadEventosEntrega(proyectoId); } catch {}
                        resolve(response);
                    },
                    () => reject(true)
                );
        });
    }

    getEventosEntrega(proyectoId: number): Promise<any[]> {
        const url = `/proyectos/${proyectoId}/eventos-entrega`;
        return new Promise((resolve) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener eventos de entrega.')
                .subscribe(
                    (response: any) => resolve((response as any[]) ?? []),
                    () => resolve([])
                );
        });
    }

    loadEventosEntrega(proyectoId: number): void {
        const url = `/proyectos/${proyectoId}/eventos-entrega`;
        this._apiService
            .GetMethod(url, {}, 'Error al obtener eventos de entrega.')
            .subscribe(
                (response: any) => this._eventosEntrega.next((response as any[]) ?? []),
                () => this._eventosEntrega.next([])
            );
    }

    getEventoEntrega(proyectoId: number, eventoId: number): Promise<any> {
        const url = `/proyectos/${proyectoId}/eventos-entrega?eventoId=${eventoId}`;
        return new Promise((resolve, reject) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener detalle del evento de entrega.')
                .subscribe(
                    (response: any) => resolve(response),
                    () => reject(true)
                );
        });
    }

    getEntregasDeEvento(proyectoId: number, eventoId: number): Promise<EntregaBeneficio[]> {
        const url = `/proyectos/${proyectoId}/eventos-entrega/${eventoId}/entregas`;
        return new Promise((resolve) => {
            this._apiService
                .GetMethod(url, {}, 'Error al obtener entregas del evento.')
                .subscribe(
                    (response: any) => resolve((response as EntregaBeneficio[]) ?? []),
                    () => resolve([])
                );
        });
    }
}
