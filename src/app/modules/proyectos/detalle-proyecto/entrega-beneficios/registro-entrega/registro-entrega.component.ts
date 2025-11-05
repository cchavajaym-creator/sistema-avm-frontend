import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from 'app/core/user/user.service';

import { ApiService } from 'app/core/service/api-service';
import { ProyectosService } from 'app/modules/proyectos/proyectos-service';

@Component({
  selector: 'app-registro-entrega',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: 'registro-entrega.component.html',
})
export class RegistroEntregaComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  proyectoId: number;

  constructor(
    private fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _proyectos: ProyectosService,
    private _api: ApiService,
    private _userService: UserService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      fechaEvento: [null, [Validators.required]], // datetime-local string
      lugar: ['', [Validators.required, Validators.maxLength(200)]],
      observaciones: ['', [Validators.maxLength(500)]],
    });
  }

  async ngOnInit(): Promise<void> {
    const idParam = this._route.parent?.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!id || isNaN(id)) {
      this._api.showErrorMessage('Proyecto inválido');
      this.navigateToProjectBase();
      return;
    }
    this.proyectoId = id;
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.value as any;
    const fechaStr = this._toDateTimeString(v.fechaEvento);
    const createdBy = this._currentUserId();
    const payload = {
      nombre: v.nombre?.trim(),
      fechaEvento: fechaStr,
      lugar: v.lugar?.trim(),
      observaciones: v.observaciones?.trim() || null,
      createdBy,
    };
    try {
      this.guardando = true;
      await this._proyectos.registrarEventoEntrega(this.proyectoId, payload as any);
      this._api.showSuccessMessage('Evento de entrega registrado');
      this.navigateToProjectBase();
    } finally {
      this.guardando = false;
    }
  }

  cancelar(): void {
    this.navigateToProjectBase();
  }

  private navigateToProjectBase(): void {
    if (this._route.parent) {
      this._router.navigate(['./'], { relativeTo: this._route.parent });
    } else {
      this._router.navigate(['/listado-proyectos']);
    }
  }

  private _toDateTimeString(input: any): string {
    // Espera un string tipo 'YYYY-MM-DDTHH:mm' del input datetime-local
    if (typeof input === 'string' && input.length >= 16) {
      // Asegurar segundos
      return input.length === 16 ? `${input}:00` : input;
    }
    // Fallback si llega Date
    if (input instanceof Date) {
      const y = input.getFullYear();
      const m = (input.getMonth() + 1).toString().padStart(2, '0');
      const d = input.getDate().toString().padStart(2, '0');
      const hh = input.getHours().toString().padStart(2, '0');
      const mm = input.getMinutes().toString().padStart(2, '0');
      const ss = input.getSeconds().toString().padStart(2, '0');
      return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
    }
    return String(input ?? '');
  }

  private _currentUserId(): number | null {
    const u: any = this._userService.usuarioLogueadoValues as any;
    return (u?.userId ?? u?.sub ?? null) as number | null;
  }
}
