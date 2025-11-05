import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { ProyectosService } from '../../proyectos-service';
import { ApiService } from 'app/core/service/api-service';
import { Proyecto } from '../../models/proyecto.model';
import { RegistroProyectoService } from '../../registro-proyectos/registro-proyectos.service';
import { EstadosDTO } from 'app/modules/models-general/estados.model';
import { MatDividerModule } from '@angular/material/divider';
import { TagComponent } from 'app/shared/tag/tag.component';

@Component({
  selector: 'app-editar-proyecto',
  standalone: true,
  templateUrl: 'editar-proyecto.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    TagComponent,
  ],
})
export class EditarProyectoComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  proyectoId!: number;
  estados: EstadosDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _proyectosService: ProyectosService,
    private _registroProyectoService: RegistroProyectoService,
    private _api: ApiService
  ) {
    this.form = this.fb.group({
      nombreProyecto: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: [''],
      fechaInicio: [null],
      fechaFin: [null],
      estadoId: [null, [Validators.required]],
    });
  }

  async ngOnInit(): Promise<void> {
    // Primero intenta obtener el proyecto desde el estado de navegación
    const nav = this._router.getCurrentNavigation();
    const state: any = nav?.extras?.state ?? (window.history && (window.history.state || null));
    const proyectoFromState: Proyecto | null = state?.proyecto ?? null;

    if (proyectoFromState) {
      this.proyectoId = proyectoFromState.proyectoId;
      this.form.patchValue({
        nombreProyecto: proyectoFromState.nombreProyecto || '',
        descripcion: proyectoFromState.descripcion || '',
        fechaInicio: proyectoFromState.fechaInicio ? moment(proyectoFromState.fechaInicio).format('YYYY-MM-DD') : null,
        fechaFin: proyectoFromState.fechaFin ? moment(proyectoFromState.fechaFin).format('YYYY-MM-DD') : null,
        estadoId: proyectoFromState.estado?.estadoId ?? null,
      });
      this.cargarEstados();
      return;
    }

    // Fallback: cargar por servicio usando el id de la ruta
    const id = Number(this._route.snapshot.paramMap.get('id'));
    this.proyectoId = id;
    const proyecto: Proyecto = await this._proyectosService.getProyectoById(id);
    this.form.patchValue({
      nombreProyecto: proyecto?.nombreProyecto || '',
      descripcion: proyecto?.descripcion || '',
      fechaInicio: proyecto?.fechaInicio ? moment(proyecto.fechaInicio).format('YYYY-MM-DD') : null,
      fechaFin: proyecto?.fechaFin ? moment(proyecto.fechaFin).format('YYYY-MM-DD') : null,
      estadoId: proyecto?.estado?.estadoId ?? null,
    });
    this.cargarEstados();
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.value as any;

    const payload = {
      nombreProyecto: v.nombreProyecto,
      descripcion: v.descripcion || null,
      fechaInicio: moment(v.fechaInicio).format("YYYY-MM-DD"),
      fechaFin: moment(v.fechaFin).format("YYYY-MM-DD"),
      estadoId: Number(v.estadoId),
    };
    try {
      this.guardando = true;
      await this._proyectosService.updateProyecto(this.proyectoId, payload as any);

      this._proyectosService.getProyectoById(this.proyectoId)

      this._api.showSuccessMessage('Proyecto actualizado');
      this.cerrar();
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this._router.navigate(['../'], { relativeTo: this._route });
  }

  private cargarEstados(): void {
    const params = { tipoEstado: 'p' };
    this._registroProyectoService
      .cargarEstados(params)
      .then((response: EstadosDTO[]) => {
        this.estados = response || [];
      });
  }

  // Helpers para etiqueta del estado seleccionado
  estadoDescripcionActual(): string | null {
    const id = this.form.get('estadoId')?.value;
    const e = this.estados.find((x) => Number(x.estadoId) === Number(id));
    return e ? (e.descripcion || (e as any).nombre || null) : null;
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
