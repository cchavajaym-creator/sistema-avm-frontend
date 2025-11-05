import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProyectosService } from '../../proyectos-service';
import { ProyectoBeneficiario } from '../../models/proyecto-beneficiario.model';
import { Subscription } from 'rxjs';
import { BeneficiarioListDTO } from 'app/modules/beneficiarios/models/beneficiarios-list-DTO.model';
import { SeleccionarBeneficiarioDialogComponent } from '../agregar-beneficiario-proyecto/seleccionar-beneficiario-dialog.component';
import { ConfirmDialogComponent } from 'app/shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from 'app/core/service/api-service';
import { TagComponent } from 'app/shared/tag/tag.component';

@Component({
  selector: 'app-beneficiarios-proyecto',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, TagComponent],
  templateUrl: './beneficiarios-proyecto.component.html'
})
export class BeneficiariosProyectoComponent implements OnInit, OnDestroy {
  @Input() proyectoId!: number;

  beneficiarios: ProyectoBeneficiario[] = [];
  cargando = false;
  private subs = new Subscription();

  constructor(
    private _proyectosService: ProyectosService,
    private _dialog: MatDialog,
    private _api: ApiService,
  ) {}

  ngOnInit(): void {
    this.refrescar();
  }

  refrescar(): void {
    if (!this.proyectoId) { return; }
    this.cargando = true;
    this._proyectosService
      .getBeneficiariosDeProyecto(this.proyectoId)
      .then((resp) => {
        this.beneficiarios = resp ?? [];
      })
      .finally(() => {
        this.cargando = false;
      });
  }

  nombreCompleto(b: ProyectoBeneficiario): string {
    const p = b.persona;
    return [p.primerNombre, p.segundoNombre,p.tercerNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(' ');
  }

  estadoLabel(id?: number): string {
    if (id === 1) return 'Activo';
    if (id === 2) return 'Inactivo';
    return 'Desconocido';
  }

  estadoColor(id?: number): 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray' {
    if (id === 1) return 'success';
    if (id === 2) return 'info';
    return 'gray';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || !this.proyectoId) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.cargando = true;
    this._api
      .PostMethod('/beneficiarios/import', formData, { proyectoId: this.proyectoId })
      .subscribe({
        next: () => {
          this._api.showSuccessMessage('Archivo procesado correctamente');
          this.refrescar();
        },
        error: () => {
          // Errores ya son manejados por ApiService
        },
        complete: () => {
          this.cargando = false;
          // Permitir volver a seleccionar el mismo archivo
          if (input) {
            input.value = '';
          }
        },
      });
  }

  abrirAgregarBeneficiario(): void {
    const dialogRef = this._dialog.open(SeleccionarBeneficiarioDialogComponent, {
      panelClass: ['w-full', 'md:10/12'],
      maxHeight: '80vh',
      autoFocus: false,
      disableClose: true,
      data: { proyectoId: this.proyectoId },
    });

    dialogRef.afterClosed().subscribe(() => {
      // Al cerrar el selector, refrescamos el listado por si se agregaron beneficiarios
      this.refrescar();
    });
  }

  async confirmarEliminar(b: ProyectoBeneficiario): Promise<void> {
    const nombre = this.nombreCompleto(b);
    const ref = this._dialog.open(ConfirmDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        title: 'Eliminar beneficiario del proyecto',
        message: `¿Deseas eliminar al beneficiario\n${nombre} del proyecto?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe(async (ok: boolean) => {
      if (ok) {
        try {
          this.cargando = true;
          await this._proyectosService.removeBeneficiarioDeProyecto(this.proyectoId, b.beneficiarioId);
          this._api.showSuccessMessage('Beneficiario eliminado');
          this.refrescar();
        } finally {
          this.cargando = false;
        }
      }
    });
  }
}
