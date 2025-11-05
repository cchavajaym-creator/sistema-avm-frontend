import { Component, Inject, Optional, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProyectosService } from '../../proyectos-service';
import { ApiService } from 'app/core/service/api-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Actividad } from '../../models/actividad.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TagComponent } from 'app/shared/tag/tag.component';

@Component({
  selector: 'app-agregar-actividad-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TagComponent,
  ],
  templateUrl: 'agregar-actividad-dialog.component.html'
})
export class AgregarActividadDialogComponent implements OnInit {
  form: FormGroup;
  enviando = false;
  editMode = false;
  proyectoId!: number;
  actividadId?: number;
  minDate: Date = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

  tiposActividad = [
    { value: 'informativa', label: 'Informativa' },
    { value: 'capacitacion', label: 'Capacitación' },
    { value: 'logistica', label: 'Logística' },
  ];

  constructor(
    private fb: FormBuilder,
    private _proyectosService: ProyectosService,
    private _api: ApiService,
    private _router: Router,
    private _route: ActivatedRoute,
    @Optional() private _dialogRef?: MatDialogRef<AgregarActividadDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { proyectoId: number },
  ) {
    this.form = this.fb.group({
      nombreActividad: ['', [Validators.required, Validators.maxLength(200)]],
      tipoActividad: ['', Validators.required],
      descripcion: [''],
      fechaActividad: [null, [Validators.required, this.minDateValidator()]], // Date
      lugar: [''],
    });
  }

  ngOnInit(): void {
    // Resolve proyectoId from dialog data or from route parent (/:id)
    const idFromData = this.data?.proyectoId;
    let idFromRoute: number | undefined;
    let parent = this._route.parent;
    while (parent) {
      const raw = parent.snapshot.paramMap.get('id');
      if (raw) {
        idFromRoute = Number(raw);
        break;
      }
      parent = parent.parent;
    }
    this.proyectoId = (idFromData ?? idFromRoute)!;

    // Detect edit mode by presence of :actividadId on current route
    const actividadIdParam = this._route.snapshot.paramMap.get('actividadId');
    if (actividadIdParam) {
      this.editMode = true;
      this.actividadId = Number(actividadIdParam);
      this.cargarActividad();
    }
  }

  private async cargarActividad(): Promise<void> {
    if (!this.proyectoId || !this.actividadId) return;
    try {
      const actividad: Actividad = await this._proyectosService.getActividadDeProyecto(
        this.proyectoId,
        this.actividadId
      );
      this.form.patchValue({
        nombreActividad: actividad.nombreActividad,
        tipoActividad: actividad.tipoActividad,
        descripcion: actividad.descripcion,
        fechaActividad: actividad.fechaActividad ? new Date(actividad.fechaActividad) : null,
        lugar: actividad.lugar,
      });
    } catch {}
  }

  cerrar(): void {
    if (this._dialogRef) {
      this._dialogRef.close();
    } else {
      // Navega atrás: cierra el drawer
      // Intenta ir a '/proyectos/:id'
      this._router.navigate(['../../'], { relativeTo: this._route }).catch(() => {
        this._router.navigate(['/proyectos', this.proyectoId]);
      });
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value as any;
    // Asegurar formato YYYY-MM-DD
    const fechaActividad = typeof raw.fechaActividad === 'string' ? raw.fechaActividad : new Date(raw.fechaActividad).toISOString().slice(0, 10);
    const payload = {
      nombreActividad: raw.nombreActividad,
      tipoActividad: raw.tipoActividad,
      descripcion: raw.descripcion || '',
      fechaActividad,
      lugar: raw.lugar || '',
    } as const;
    try {
      this.enviando = true;
      if (this.editMode && this.actividadId) {
        await this._proyectosService.updateActividadDeProyecto(this.proyectoId, this.actividadId, payload as any);
        this._api.showSuccessMessage('Actividad actualizada');
      } else {
        await this._proyectosService.addActividadAProyecto(this.proyectoId, payload as any);
        this._api.showSuccessMessage('Actividad agregada');
      }
      if (this._dialogRef) {
        this._dialogRef.close(true);
      } else {
        // Volver a la lista
        this._proyectosService.getActividadesDeProyecto(this.proyectoId)
        this.cerrar();
      }
    } finally {
      this.enviando = false;
    }
  }

  // Fecha seleccionada (para el template pill)
  get fechaActividad(): Date | null {
    const v = this.form.get('fechaActividad')?.value;
    return v ? new Date(v) : null;
  }

  // Vencida comparando solo fecha (sin hora)
  isOverdue(): boolean {
    if (!this.fechaActividad) return false;
    const d = new Date(this.fechaActividad);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }

  // Validador: no permitir fechas anteriores a hoy
  private minDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      d.setHours(0,0,0,0);
      const min = new Date(this.minDate);
      min.setHours(0,0,0,0);
      return d.getTime() < min.getTime() ? { minDate: true } : null;
    };
  }

  // Color helper for tag preview
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
}
