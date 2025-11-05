import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProyectosService } from '../../proyectos-service';
import { Actividad } from '../../models/actividad.model';
import { Observable, Subscription } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TagComponent } from 'app/shared/tag/tag.component';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDragHandle,
    CdkDragPreview,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-actividades-proyecto',
  standalone: true,
  imports: [CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RouterLink,
    MatTooltipModule,
    TagComponent,
    CdkDropList,
    CdkDrag,
    //NgClass,
    CdkDragPreview,
    CdkDragHandle,
    TitleCasePipe,
    DatePipe,

],
  templateUrl: 'actividades-proyecto.component.html'
})
export class ActividadesProyectoComponent implements OnInit, OnDestroy {
  @Input() proyectoId!: number;

  actividades$: Observable<Actividad[]>
  cargando = false;
  private subs = new Subscription();

  tasksCount: any = {
        completed: 0,
        incomplete: 0,
        total: 0,
    };

  constructor(
    private _proyectosService: ProyectosService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router,

) {}

  ngOnInit(): void {
    this.refrescar();
  }

  refrescar(): void {
    if (!this.proyectoId) return;
    this.cargando = true;
    this._proyectosService.getActividadesDeProyecto(this.proyectoId)
    this.actividades$= this._proyectosService.actividadesProyecto$

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();

  }

  abrirAgregarActividad(): void {
    // Abrir el formulario dentro del drawer como ruta hija
    this._router.navigate(['./actividades/nueva'], { relativeTo: this._activatedRoute });
  }

    // Color para tipos de actividad -> reutiliza app-tag
    tipoColor(tipo?: string): 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray' {
        const t = (tipo || '').toLowerCase();
        switch (t) {
            case 'informativa':
                return 'info';
            case 'capacitacion':
            case 'capacitación':
                return 'success';
            case 'logistica':
            case 'logística':
                return 'accent';
            default:
                return 'gray';
        }
    }

    // TrackBy for @for loop
    trackByFn(index: number, actividad: Actividad): number | string {
        return actividad?.actividadId ?? index;
    }

    // Handle drag-drop reordering locally
    dropped(event: CdkDragDrop<Actividad[]>, actividades: Actividad[]): void {
        if (!event || event.previousIndex === event.currentIndex) return;
        moveItemInArray(actividades, event.previousIndex, event.currentIndex);
    }
}
