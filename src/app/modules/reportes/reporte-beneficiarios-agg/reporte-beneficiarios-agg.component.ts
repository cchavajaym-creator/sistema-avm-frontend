import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { ReportesService } from '../reportes.service';
import { BeneficiarioAggItem } from '../models/reporte-beneficiarios-agg.model';
import { AdminService } from 'app/modules/admin/admin-service';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { EstadoChipComponent } from 'app/shared/estado-chip/estado-chip.component';

@Component({
  selector: 'app-reporte-beneficiarios-agg',
  standalone: true,
  templateUrl: 'reporte-beneficiarios-agg.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    EstadoChipComponent,
  ],
})
export class ReporteBeneficiariosAggComponent implements OnInit, OnDestroy {
  // Filtros
  departamentoId = signal<number | null>(null);
  municipioId = signal<number | null>(null);
  estadoBeneficiario = signal<number | null>(null);
  mayorEdad = signal<boolean | null>(null);
  buscar = signal<string>('');

  // Datos
  private subs = new Subscription();
  private data = signal<BeneficiarioAggItem[]>([]);
  total = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  sortActive = signal<string>('');
  sortDirection = signal<'asc' | 'desc' | ''>('');

  displayedColumns = [
    'nombreCompleto',
    'genero',
    'nombreDepartamento',
    'nombreMunicipio',
    'estadoBeneficiario',
    'edad',
    'esMayorEdad',
    'proyectosNombres',
  ];

  filtrados = computed(() => {
    const rows = [...this.data()];
    const active = this.sortActive();
    const dir = this.sortDirection();
    if (!active || !dir) return rows;
    const compare = (a: any, b: any): number => {
      const va = a?.[active];
      const vb = b?.[active];
      const na = va instanceof Date ? va.getTime() : (typeof va === 'string' ? va.toLowerCase() : va);
      const nb = vb instanceof Date ? vb.getTime() : (typeof vb === 'string' ? vb.toLowerCase() : vb);
      if (na == null && nb == null) return 0;
      if (na == null) return -1;
      if (nb == null) return 1;
      return na < nb ? -1 : na > nb ? 1 : 0;
    };
    rows.sort((a, b) => (dir === 'asc' ? compare(a, b) : -compare(a, b)));
    return rows;
  });

  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];

  constructor(
    private _reportes: ReportesService,
    private _admin: AdminService,
  ) {}

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.refrescar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  aplicarFiltros(): void {
    this.page.set(0);
    this.refrescar();
  }

  limpiarFiltros(): void {
    this.departamentoId.set(null);
    this.municipioId.set(null);
    this.estadoBeneficiario.set(null);
    this.mayorEdad.set(null);
    this.buscar.set('');
    this.page.set(0);
  }

  async exportarXLSX(): Promise<void> {
    try {
      const { blob, filename } = await this._reportes.exportReporteBeneficiariosAggXlsx({
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'reporte_proyectos_por_beneficiario.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  async exportarCSV(): Promise<void> {
    try {
      const { blob, filename } = await this._reportes.exportReporteBeneficiariosAggCsv({
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'reporte_proyectos_por_beneficiario.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.refrescar();
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || '');
    this.sortDirection.set(sort.direction || '');
  }

  private refrescar(): void {
    this._reportes
      .getReporteBeneficiariosAgg({
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .then((resp) => {
        const items = resp?.items ?? [];
        // Normaliza por si backend envía strings en proyectosNombres
        const normalized = items.map((r) => ({
          ...r,
          proyectosNombres: Array.isArray(r.proyectosNombres)
            ? r.proyectosNombres
            : (typeof r.proyectosNombres === 'string'
                ? r.proyectosNombres.split(',').map((s) => s.trim()).filter(Boolean)
                : r.proyectosNombres),
        }));
        this.data.set(normalized);
        this.total.set(resp?.total ?? items.length);
      })
      .catch(() => void 0);
  }

  private cargarDepartamentos(): void {
    this._admin.getCatalogos('departamentos').then((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? []);
      this.departamentos = items as Departamento[];
    });
  }

  private cargarMunicipios(depId: number): void {
    this._admin.getCatalogos('municipios', { departamentoId: depId }).then((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? []);
      this.municipios = items as Municipio[];
    });
  }

  setDepartamento(id: number | null): void {
    this.departamentoId.set(id);
    this.municipioId.set(null);
    this.municipios = [];
    if (typeof id === 'number') this.cargarMunicipios(id);
    this.page.set(0);
  }

  setMunicipio(id: number | null): void {
    this.municipioId.set(id);
    this.page.set(0);
  }

  generoLabel(g: string | null | undefined): string {
    if (g === 'F') return 'Femenino';
    if (g === 'M') return 'Masculino';
    return g ?? '-';
  }

  estadoBeneficiarioLabel(v: number | null | undefined): string {
    if (v === 1) return 'Activo';
    if (v === 2) return 'Inactivo';
    return v != null ? String(v) : '-';
  }

  // Utilidad para plantillas: verificar arrays sin usar el global directamente
  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  // Paleta de colores para chips de proyectos
  private _chipPalette = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-teal-100 text-teal-800 border-teal-200',
  ];

  projectColor(index: number): string {
    const i = Math.abs(index) % this._chipPalette.length;
    return this._chipPalette[i];
  }

  toArray(value: any): string[] {
    if (Array.isArray(value)) return value as string[];
    if (value == null) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s);
    }
    return [String(value)];
  }
}
