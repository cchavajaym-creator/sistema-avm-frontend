import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BeneficiosService } from '../../beneficios-service';
import { ProyectosService } from '../../proyectos-service';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-listado-beneficios-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: 'listado-beneficios-proyecto.component.html'
})
export class ListadoBeneficiosProyectoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() proyectoId!: number;

  beneficios: any[] = [];
  cargando = false;
  q = '';

  private _destroy$ = new Subject<void>();

  constructor(
    private _beneficiosService: BeneficiosService,
    private _proyectosService: ProyectosService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
    // Suscribirse a cambios en beneficios del proyecto para refrescar automáticamente
    this._proyectosService.beneficiosProyectoChanged$
      .pipe(
        takeUntil(this._destroy$),
        filter((pid) => !!this.proyectoId && pid === this.proyectoId)
      )
      .subscribe(() => {
        this.cargar();
      });
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['proyectoId'] && changes['proyectoId'].currentValue) {
      await this.cargar();
    }
  }

  async cargar(): Promise<void> {
    if (!this.proyectoId) return;
    this.cargando = true;
    try {
      this.beneficios = await this._beneficiosService.getBeneficiosPorProyecto(this.proyectoId, this.q);
    } finally {
      this.cargando = false;
    }
  }

  limpiar(): void {
    this.q = '';
    this.cargar();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
