import { user } from './../../mock-api/common/user/data';
import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from 'app/core/user/user.service';
import { Observable, Subject, filter, take, takeUntil } from 'rxjs';
import { UsuarioLogueado } from 'app/core/user/user.types';
import { HomeService } from './home.service';
import { ProyectoUsuario } from '../proyectos/models/proyecto-usuario.model';
import { ProyectosUserDTO } from './proyectos-usuarios.model';
import { ProyectoCardComponent } from 'app/shared/proyecto-card/proyecto-card.component';
import { MetricCardComponent } from 'app/shared/metric-card/metric-card.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { RegistroProyectoComponent } from '../proyectos/registro-proyectos/registro-proyecto.component';
import { NgApexchartsModule, ApexNonAxisChartSeries, ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexLegend, ApexTitleSubtitle, ApexResponsive, ApexXAxis, ApexPlotOptions, ApexTooltip, ApexGrid } from 'ng-apexcharts';

@Component({
    selector: 'app-hom',
    standalone: true,
    templateUrl: 'home.component.html',
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        ProyectoCardComponent,
        MetricCardComponent,
        MatDividerModule,
        NgApexchartsModule
    ]
})

export class HomeComponent implements OnInit, OnDestroy {
    private _userService = inject(UserService);
    private _zone = inject(NgZone);
    usuarioLogueado$: Observable<UsuarioLogueado>
    proyectosUser$: Observable<ProyectosUserDTO>

    user_id:number = 0
    private _destroy$ = new Subject<void>();
    // Totales basados en indicadores (gráficas)
    totalBeneficiariosIndicadores = 0;
    totalProyectosIndicadores = 0;

    constructor(private _homeService: HomeService, private _dialog: MatDialog) {

    }

    openRegistroProyecto(): void {
        this._dialog.open(RegistroProyectoComponent, {
            panelClass: ['w-full', 'md:w-5/12'],
            maxHeight: 'calc(100vh - 4rem)',
            disableClose: true,
        }).afterClosed().subscribe((ok) => {
            if (ok) {
                // Si se creó un proyecto, puedes recargar listados si aplica
                this.getProyectos();
                this.loadActivosPorProyecto();
            }
        });
    }

    ngOnInit() {

        this.proyectosUser$ = this._homeService.proyectosUser$;
        this.usuarioLogueado$ = this._userService.usuarioLogueado$;

        this._userService.usuarioLogueado$
            .pipe(filter(Boolean), takeUntil(this._destroy$))
            .subscribe((user) => {

                this.user_id = (user.userId ?? user.sub) as number;
                this.getProyectos();
            });

        // Cargar distribución por género para la gráfica
        this.loadDistribucionGenero();
        // Cargar beneficiarios activos por proyecto
        this.loadActivosPorProyecto();
    }

    getProyectos(){
        console.log(this.user_id)
        this._homeService.getProyectosUser(this.user_id)
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    // ------------------
    // ApexCharts: Pie Género
    // ------------------
    generoSeries: ApexNonAxisChartSeries = [];
    generoChart: ApexChart = { type: 'pie', height: 320, toolbar: { show: false } };
    generoLabels: string[] = [];
    generoLegend: ApexLegend = { show: true, position: 'bottom' };
    generoDataLabels: ApexDataLabels = { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` };
    generoTitle: ApexTitleSubtitle = { text: undefined };
    generoResponsive: ApexResponsive[] = [
        { breakpoint: 640, options: { chart: { height: 280 }, legend: { position: 'bottom' } } }
    ];

    // ------------------
    // ApexCharts: Barras Activos por Proyecto
    // ------------------
    activosSeries: ApexAxisChartSeries = [];
    activosChart: ApexChart = {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        events: {
            dataPointSelection: (_event: any, _chartCtx: any, config: any) => {
                const index = config?.dataPointIndex ?? -1;
                // Asegurar actualización de UI dentro de la zona de Angular
                this._zone.run(() => this.onBarSelected(index));
            }
        }
    };
    activosPlotOptions: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6 } };
    activosDataLabels: ApexDataLabels = { enabled: true };
    activosXAxis: ApexXAxis = { categories: [] };
    activosTooltip: ApexTooltip = { y: { formatter: (val: number) => `${val}` } };
    activosGrid: ApexGrid = { padding: { left: 8, right: 12 } };
    // Datos en memoria para asociar barra -> proyecto
    activosItems: Array<{ proyectoId: number; proyecto: string; totalBeneficiariosActivos: number }> = [];
    // Selección dinámica para metric card
    selectedProyectoNombre: string = '';
    selectedProyectoTotal: number = 0;

    private async loadDistribucionGenero(): Promise<void> {
        try {
            const items = await this._homeService.getDistribucionGenero();
            const categorias = items.map(i => i.generoDesc);
            const datos = items.map(i => Number(i.totalBeneficiarios || 0));
            const total = datos.reduce((a, b) => a + b, 0) || 0;
            this.generoLabels = categorias;
            // Para pie, la serie es un arreglo de números; Apex calcula porcentajes automáticamente
            this.generoSeries = datos;
            // Total de beneficiarios basado en indicadores
            this.totalBeneficiariosIndicadores = total;
            // Si quisieras basar la serie en porcentaje del backend, usar: items.map(i => i.porcentaje)
        } catch {
            this.generoSeries = [];
            this.generoLabels = [];
            this.totalBeneficiariosIndicadores = 0;
        }
    }

    private async loadActivosPorProyecto(): Promise<void> {
        try {
            const items = await this._homeService.getBeneficiariosActivosPorProyecto();
            this.activosItems = items || [];
            const categorias = this.activosItems.map(i => i.proyecto);
            const datos = this.activosItems.map(i => Number(i.totalBeneficiariosActivos || 0));
            this.activosXAxis = { ...this.activosXAxis, categories: categorias };
            this.activosSeries = [{ name: 'Activos', data: datos }];
            // Total de proyectos basado en indicadores (número de categorías devueltas)
            this.totalProyectosIndicadores = this.activosItems?.length ?? 0;
            // Opcional: seleccionar la primera barra por defecto
            if (this.activosItems.length > 0) {
                this.onBarSelected(0);
            } else {
                this.onBarSelected(-1);
            }
        } catch {
            this.activosSeries = [];
            this.activosXAxis = { ...this.activosXAxis, categories: [] };
            this.totalProyectosIndicadores = 0;
            this.onBarSelected(-1);
        }
    }

    // Actualiza la tarjeta dinámica con el índice de barra seleccionada
    private onBarSelected(index: number): void {
        const item = index >= 0 ? this.activosItems[index] : undefined;
        this.selectedProyectoNombre = item?.proyecto || 'Selecciona un proyecto en la gráfica';
        this.selectedProyectoTotal = item?.totalBeneficiariosActivos || 0;
    }

}
