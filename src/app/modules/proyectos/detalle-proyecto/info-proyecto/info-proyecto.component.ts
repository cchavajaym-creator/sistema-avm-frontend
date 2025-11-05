import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FuseCardComponent } from '@fuse/components/card';
import { Proyecto } from '../../models/proyecto.model';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TagComponent } from 'app/shared/tag/tag.component';
import { ProyectosService } from '../../proyectos-service';
import { NgApexchartsModule, ApexNonAxisChartSeries, ApexChart, ApexLegend, ApexResponsive, ApexDataLabels, ApexTitleSubtitle, ApexPlotOptions, ApexStroke } from 'ng-apexcharts';


@Component({
    selector: 'app-info-proyecto',
    templateUrl: './info-proyecto.component.html',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatDividerModule, TagComponent, NgApexchartsModule],
})
export class InfoProyectoComponent implements OnChanges {
    @Input() proyecto: Proyecto | null = null;

    private _proyectos = inject(ProyectosService);

    // Resumen del proyecto para gráficas
    resumen: {
        proyectoId: number;
        nombreProyecto: string;
        fechaInicio?: string;
        fechaFin?: string;
        estadoProyecto?: number;
        actividades?: { total: number; realizadas: number; pendientes: number };
        beneficios?: { entregasTotal: number; beneficiosDistintos: number; cantidadTotal: string };
        beneficiarios?: { total: number; activos: number };
    } | null = null;

    cargandoResumen = false;

    // Charts config (ApexCharts)
    actSeries: ApexNonAxisChartSeries = [];
    actChart: ApexChart = { type: 'donut', height: 280, toolbar: { show: false } };
    actLabels: string[] = ['Realizadas', 'Pendientes'];
    actLegend: ApexLegend = { show: true, position: 'bottom' };
    actResponsive: ApexResponsive[] = [{ breakpoint: 640, options: { chart: { height: 240 } } }];
    actDataLabels: ApexDataLabels = { enabled: true };
    actTitle: ApexTitleSubtitle = { text: 'Actividades' };
    actStroke: ApexStroke = { width: 1 };

    benfSeries: ApexNonAxisChartSeries = [];
    benfChart: ApexChart = { type: 'pie', height: 280, toolbar: { show: false } };
    benfLabels: string[] = ['Activos', 'Inactivos'];
    benfLegend: ApexLegend = { show: true, position: 'bottom' };
    benfResponsive: ApexResponsive[] = [{ breakpoint: 640, options: { chart: { height: 240 } } }];
    benfDataLabels: ApexDataLabels = { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%` };
    benfTitle: ApexTitleSubtitle = { text: 'Beneficiarios' };

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['proyecto'] && this.proyecto?.proyectoId) {
            this.loadResumen(this.proyecto.proyectoId);
        }
    }

    private async loadResumen(id: number): Promise<void> {
        try {
            this.cargandoResumen = true;
            const data = await this._proyectos.getResumenProyecto(id);
            this.resumen = data ?? null;
            this.prepareCharts();
        } catch {
            this.resumen = null;
            this.actSeries = [];
            this.benfSeries = [];
        } finally {
            this.cargandoResumen = false;
        }
    }

    private prepareCharts(): void {
        const a = this.resumen?.actividades;
        const b = this.resumen?.beneficiarios;
        const realizadas = Number(a?.realizadas || 0);
        const pendientes = Number(a?.pendientes || 0);
        this.actSeries = [realizadas, pendientes];

        const total = Number(b?.total || 0);
        const activos = Number(b?.activos || 0);
        const inactivos = Math.max(0, total - activos);
        this.benfSeries = [activos, inactivos];
    }

    // Helpers para etiquetas de fecha
    private normalize(dateStr?: string | null): Date | null {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private today(): Date {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }

    isPast(dateStr?: string | null): boolean {
        const d = this.normalize(dateStr);
        if (!d) return false;
        return d.getTime() < this.today().getTime();
    }

    // Color de etiqueta: rojo si es pasada, azul si futura/actual
    dateTagColor(dateStr?: string | null): 'warn' | 'info' {
        return this.isPast(dateStr) ? 'warn' : 'info';
    }

    dateTagLabel(dateStr?: string | null): string {
        if (!dateStr) return 'Sin fecha';
        return this.isPast(dateStr) ? 'Vencida' : 'Vigente';
    }

    proyectoFinalizado(): boolean {
        if (!this.proyecto || !this.proyecto.fechaFin) return false;
        return this.isPast(this.proyecto.fechaFin);
    }

    estadoColor(desc?: string | null): 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray' {
        const t = (desc || '').toLowerCase();
        if (t.includes('activo')) return 'success';
        if (t.includes('progreso') || t.includes('vigente')) return 'info';
        if (t.includes('pendiente')) return 'accent';
        if (t.includes('final') || t.includes('cerrado') || t.includes('inactivo') || t.includes('cancel')) return 'warn';
        return 'primary';
    }
}
