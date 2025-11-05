import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

import { BeneficiariosService } from 'app/modules/beneficiarios/beneficiarios-service';
import { BeneficiarioListDTO, ResponseBeneficiarioListDTO } from 'app/modules/beneficiarios/models/beneficiarios-list-DTO.model';
import { AdminService } from 'app/modules/admin/admin-service';
import { ApiService } from 'app/core/service/api-service';
import { ConfirmarAgregarBeneficiarioDialogComponent } from '../confirmar-agregar-beneficiario/confirmar-agregar-beneficiario-dialog.component';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { ProyectosService } from '../../proyectos-service';

@Component({
  selector: 'app-seleccionar-beneficiario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './seleccionar-beneficiario-dialog.component.html'
})
export class SeleccionarBeneficiarioDialogComponent {
  beneficiarios: BeneficiarioListDTO[] = [];
  cargando = false;
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  // Filtros
  q = '';
  numeroDocumento = '';
  departamentoId: number | null = null;
  municipioId: number | null = null;
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];

  constructor(
    private _beneficiariosService: BeneficiariosService,
    private _dialogRef: MatDialogRef<SeleccionarBeneficiarioDialogComponent>,
    private _adminService: AdminService,
    private _proyectosService: ProyectosService,
    private _api: ApiService,
    private _dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { proyectoId: number },
  ) {
    this._beneficiariosService.beneficiarios$.subscribe((list) => {
      this.beneficiarios = list || [];
    });
    this.cargarDepartamentos();
    this.refrescar();
  }

  refrescar(): void {
    this.cargando = true;
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this._beneficiariosService
      .getBeneficiarios(start, end, this.buildFilters())
      .then((resp: ResponseBeneficiarioListDTO) => {
        this.total = resp?.total ?? 0;
      })
      .finally(() => (this.cargando = false));
  }

  pageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.refrescar();
  }

  nombreCompleto(b: BeneficiarioListDTO): string {
    const p = b.persona;
    return [p.primerNombre, p.segundoNombre, p.tercerNombre, p.primerApellido, p.segundoApellido]
      .filter(Boolean)
      .join(' ');
  }

  seleccionar(b: BeneficiarioListDTO): void {
    const today = new Date();
    const fechaIncorporacion = today.toISOString().slice(0, 10); // YYYY-MM-DD; usar moment si está disponible
    const payload = {
      beneficiarioId: b.beneficiarioId,
      fechaIncorporacion,
      estadoId: b.estadoId,
    } as const;

    const confirmRef = this._dialog.open(ConfirmarAgregarBeneficiarioDialogComponent, {
      width: '520px',
      disableClose: true,
      data: {
        proyectoId: this.data?.proyectoId,
        beneficiario: b,
        payload,
      },
    });

    confirmRef.afterClosed().subscribe(async (confirmado: boolean) => {
      if (confirmado && this.data?.proyectoId) {
        try {
          this.cargando = true;
          await this._proyectosService.addBeneficiarioAProyecto(this.data.proyectoId, payload as any);
          this._api.showSuccessMessage('Beneficiario agregado al proyecto');
          this.refrescar();
        } catch (e) {
        } finally {
          this.cargando = false;
        }
      }
    });
  }

  cerrar(): void {
    this._dialogRef.close();
  }

  buscar(): void {
    this.pageIndex = 0; // reset to first page
    this.refrescar();
  }

  limpiar(): void {
    this.q = '';
    this.numeroDocumento = '';
    this.departamentoId = null;
    this.municipioId = null;
    this.municipios = [];
    this.buscar();
  }

  onDepartamentoChange(depId: number | null): void {
    this.departamentoId = depId;
    this.municipioId = null;
    if (depId) {
      this.cargarMunicipios(depId);
    } else {
      this.municipios = [];
    }
  }

  private cargarDepartamentos(): void {
    const catalogo = 'departamentos';
    this._adminService.getCatalogos(catalogo).then((response: any) => {
      this.departamentos = (response as Departamento[]) ?? [];
    });
  }

  private cargarMunicipios(departamentoId: number): void {
    const catalogo = 'municipios';
    const params = { departamentoId };
    this._adminService.getCatalogos(catalogo, params).then((response: any) => {
      this.municipios = (response as Municipio[]) ?? [];
    });
  }

  private buildFilters() {
    const filters: any = {};
    if (this.q?.trim()) filters.q = this.q.trim();
    if (this.numeroDocumento?.trim()) filters.numeroDocumento = this.numeroDocumento.trim();
    if (typeof this.municipioId === 'number') filters.municipioId = this.municipioId;
    if (typeof this.departamentoId === 'number') filters.departamentoId = this.departamentoId;
    return filters;
  }
}
