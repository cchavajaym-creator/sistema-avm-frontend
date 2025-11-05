import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProyectosService } from '../proyectos-service';
import { Proyecto } from '../models/proyecto.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav'
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { InfoProyectoComponent } from './info-proyecto/info-proyecto.component';
import { UsuariosProyectoComponent } from './usuarios-proyecto/usuarios-proyecto.component';
import { BeneficiariosProyectoComponent } from './beneficiarios-proyecto/beneficiarios-proyecto.component';
import { ActividadesProyectoComponent } from './actividades-proyecto/actividades-proyecto.component';
import { RegistroBeneficioComponent } from './beneficios/registro-beneficio.component';
import { ListadoBeneficiosProyectoComponent } from './beneficios/listado-beneficios-proyecto.component';
import { MatDividerModule } from '@angular/material/divider';
import { EntregaBeneficioComponent } from "./entrega-beneficios/entrega-beneficio/entrega-beneficio.component";

@Component({
    selector: 'app-detalle-proyecto',
    templateUrl: './detalle-proyecto.component.html',
    imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSidenavModule,
    NgClass,
    InfoProyectoComponent,
    UsuariosProyectoComponent,
    BeneficiariosProyectoComponent,
    ListadoBeneficiosProyectoComponent,
    ActividadesProyectoComponent,
    RouterOutlet,
    EntregaBeneficioComponent
],
})
export class DetalleProyectoComponent implements OnInit, OnDestroy {
    proyecto: Proyecto | null = null;
    cargando = true;
    private _sub = new Subscription();


    @ViewChild('drawer') drawer: MatDrawer;
    @ViewChild('detailDrawer') detailDrawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    detailDrawerOpened: boolean = false;
    // Cuando es true, se muestra el router-outlet a pantalla completa (detalle de actividad)
    showFullScreenChild: boolean = false;
    panels: any[] = [];
    selectedPanel: string = 'informacion-general';

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _proyectosService: ProyectosService,

        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const sub = this._route.paramMap.subscribe(async (params) => {
            const idParam = params.get('id');
            const id = idParam ? Number(idParam) : NaN;
            if (!id || isNaN(id)) {
                this._router.navigate(['/listado-proyectos']);
                return;
            }
            this.cargando = true;
            try {
                this.proyecto = await this._proyectosService.getProyectoById(id);
            } finally {
                this.cargando = false;
            }
        });
        this._sub.add(sub);

        // Mantener los datos generales reactivos a cambios (PUT)
        const subProyecto = this._proyectosService.proyectoActual$
            .subscribe((p) => {
                if (p) {
                    this.proyecto = p;
                    this._changeDetectorRef.markForCheck();
                }
            });
        this._sub.add(subProyecto);

        // Setup available panels
        this.panels = [
            {
                id: 'informacion-general',
                icon: 'heroicons_outline:document-text',
                title: 'Datos Generales del proyecto',
                description: 'Información básica, fechas y estado del proyecto.'
            },
            {
                id: 'beneficiarios',
                icon: 'heroicons_outline:user-group',
                title: 'Beneficiarios',
                description: 'Gestiona las personas beneficiarias asociadas al proyecto.'
            },
            {
                id: 'beneficios',
                icon: 'heroicons_outline:gift',
                title: 'Beneficios',
                description: 'Consulta y asocia beneficios disponibles a este proyecto.'
            },
            {
                id: 'entrega_beneficios',
                icon: 'heroicons_outline:calendar-days',
                title: 'Entrega de Beneficio',
                description: 'Registra entrega de beneficios.'
            },
            {
                id: 'actividades',
                icon: 'heroicons_outline:calendar',
                title: 'Actividades',
                description: 'Planifica, registra y da seguimiento a actividades.'
            },
            {
                id: 'team',
                icon: 'heroicons_outline:user-group',
                title: 'Usuarios del Proyecto',
                description: 'Administra miembros del equipo.'
            },
        ];

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                } else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Sincroniza estado inicial y en cada navegación del router para el drawer de edición
        this._router.events.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => this.syncDetailDrawer());
        this.syncDetailDrawer();
    }

    ngOnDestroy(): void {
        this._sub.unsubscribe();
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Navigate to the panel
     *
     * @param panel
     */
    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    /**
     * Get the details of the panel
     *
     * @param id
     */
    getPanelInfo(id: string): any {
        return this.panels.find((panel) => panel.id === id);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    private syncDetailDrawer(): void {
        // Busca el último hijo activo
        let route = this._route;
        while (route.firstChild) {
            route = route.firstChild;
        }
        const path = route.snapshot.routeConfig?.path ?? '';
        // Mostrar detalle de actividad a pantalla completa (no en drawer)
        const isActividadDetalle = path === 'actividades/:actividadId';
        const isEntregaDetalle = path === 'entregas/:eventoId';
        this.showFullScreenChild = isActividadDetalle || isEntregaDetalle;
        // Abrir drawer solo para edición/alta de actividad o editar proyecto
        const shouldOpen =
            path === 'editar' ||
            path === 'actividades/nueva' ||
            path === 'actividades/:actividadId/editar' ||
            path === 'beneficios/nuevo' ||
            path === 'entregas/nueva';

        this.detailDrawerOpened = shouldOpen && !isActividadDetalle;
        if (this.detailDrawerOpened) {
            this.detailDrawer?.open();
        } else {
            this.detailDrawer?.close();
        }
        this._changeDetectorRef.markForCheck();
    }

    closeDetailDrawer(): void {
        // Navega a la ruta base del proyecto para cerrar y quitar contenido del drawer
        this._router.navigate(['./'], { relativeTo: this._route });
        this.detailDrawerOpened = false;
        this.detailDrawer?.close();
        this._changeDetectorRef.markForCheck();
    }
}
