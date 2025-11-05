import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BeneficiosService } from '../../beneficios-service';
import { ProyectosService } from '../../proyectos-service';
import { ApiService } from 'app/core/service/api-service';

@Component({
  selector: 'app-registro-beneficio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: 'registro-beneficio.component.html'
})
export class RegistroBeneficioComponent implements OnInit {
  // proyectoId no es necesario para estos endpoints; se deja opcional por compatibilidad visual
  @Input() proyectoId?: number;
  // Modo de cierre: 'navigate' (por defecto, cierra navegando) o 'emit' (emite evento)
  @Input() closeMode: 'navigate' | 'emit' = 'navigate';
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  guardando = false;
  // listado de beneficios existentes
  beneficios: any[] = [];
  cargandoBeneficios = false;
  asociandoId: number | null = null;
  isProjectContext = false;

  constructor(
    private fb: FormBuilder,
    private _beneficiosService: BeneficiosService,
    private _proyectosService: ProyectosService,
    private _api: ApiService,
    private _route: ActivatedRoute,
    private _router: Router,
  ) {
    this.form = this.fb.group({
      nombreBeneficio: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', [Validators.maxLength(500)]],
      unidadMedida: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  async ngOnInit(): Promise<void> {
    // Detecta si se está abriendo como drawer dentro de un proyecto
    const projectIdParam = this._route.parent?.snapshot.paramMap.get('id');
    this.isProjectContext = !!projectIdParam && !isNaN(Number(projectIdParam));
    await this.cargarBeneficios();
  }

  async cargarBeneficios(): Promise<void> {
    this.cargandoBeneficios = true;
    try {
      this.beneficios = await this._beneficiosService.getBeneficios();
    } finally {
      this.cargandoBeneficios = false;
    }
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.value as any;
    const payload = {
      nombreBeneficio: v.nombreBeneficio,
      descripcion: v.descripcion || null,
      unidadMedida: v.unidadMedida,
    };
    try {
      this.guardando = true;
      await this._beneficiosService.addBeneficio(payload as any);
      this._api.showSuccessMessage('Beneficio registrado');
      this.form.reset();
      // Cerrar según el modo
      this.closeMode === 'emit' ? this.closed.emit() : this.navigateToProjectBase();
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.closeMode === 'emit' ? this.closed.emit() : this.navigateToProjectBase();
  }

  private navigateToProjectBase(): void {
    // Prefer navegar al padre directo (ruta base del proyecto)
    if (this._route.parent) {
      this._router.navigate(['./'], { relativeTo: this._route.parent });
      return;
    }
    // Fallback absoluto usando el id del proyecto si está disponible
    const id = this._route.parent?.snapshot.paramMap.get('id') || this._route.snapshot.paramMap.get('id');
    if (id) {
      this._router.navigate(['/proyectos', id]);
    } else {
      // Último recurso: subir dos niveles relativos
      this._router.navigate(['../../'], { relativeTo: this._route });
    }
  }

  async asociarABeneficio(beneficioId: number): Promise<void> {
    // Resolver proyectoId: usar @Input si viene, sino leer del padre
    const pidRaw = this.proyectoId ?? Number(this._route.parent?.snapshot.paramMap.get('id'));
    const pid = Number(pidRaw);
    if (!pid || isNaN(pid)) {
      this._api.showErrorMessage('No se pudo determinar el proyecto.');
      return;
    }
    if (!beneficioId) return;
    try {
      this.asociandoId = beneficioId;
      await this._proyectosService.asociarBeneficioAProyecto(pid, beneficioId);
      this._api.showSuccessMessage('Beneficio asociado al proyecto');
    } finally {
      this.asociandoId = null;
    }
  }
}
