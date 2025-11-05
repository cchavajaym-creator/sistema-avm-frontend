import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AdminService } from 'app/modules/admin/admin-service';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { EstadoChipComponent } from 'app/shared/estado-chip/estado-chip.component';
import { ReportesService } from '../reportes.service';
import { BeneficiarioDetalleItem } from '../models/reporte-beneficiarios.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reporte-beneficiarios',
  standalone: true,
  templateUrl: 'reporte-beneficiarios.component.html',
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    EstadoChipComponent
  ],
})
export class ReporteBeneficiariosComponent implements OnInit, OnDestroy {
  // Filtros reactivos según ListFilters
  municipioId = signal<number | null>(null);
  departamentoId = signal<number | null>(null);
  estadoBeneficiario = signal<number | null>(null);
  mayorEdad = signal<boolean | null>(null);
  buscar = signal<string>('');

  private subs = new Subscription();

  // Almacen local de datos del reporte proveniente del servicio
  private data = signal<BeneficiarioDetalleItem[]>([]);

  // Paginación y ordenamiento
  total = signal<number>(0);
  page = signal<number>(0); // 0-based UI
  pageSize = signal<number>(10);
  sortActive = signal<string>('');
  sortDirection = signal<'asc' | 'desc' | ''>('');

  displayedColumns = [
    'nombreCompleto',
    'genero',
    'nombreDepartamento',
    'nombreMunicipio',
    'estadoBeneficiario',
    'fechaInicio',
    'edad',
    'esMayorEdad',
    'latitud',
    'longitud',
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
  departamentoSearch = signal<string>('');
  municipioSearch = signal<string>('');
  departamentosFiltrados = computed(() => {
    const q = this.departamentoSearch().toLowerCase();
    return !q ? this.departamentos : this.departamentos.filter(d => d.nombreDepartamento.toLowerCase().includes(q));
  });
  municipiosFiltrados = computed(() => {
    const q = this.municipioSearch().toLowerCase();
    return !q ? this.municipios : this.municipios.filter(m => m.nombreMunicipio.toLowerCase().includes(q));
  });

  constructor(
    private _reportesService: ReportesService,
    private _adminService: AdminService,
  ) {}

  ngOnInit(): void {
    const s = this._reportesService.beneficiariosReporte$.subscribe((items) => {
      // Normaliza fechaInicio a Date para el filtro por fechas
      const normalized = (items || []).map((r) => ({
        ...r,
        // agrega una propiedad Date auxiliar para filtros
        fechaInicio: (r as any).fechaInicio instanceof Date ? (r as any).fechaInicio : new Date(r.fechaInicio)
      }));
      this.data.set(normalized);
    });
    this.subs.add(s);

    // Catálogos
    this.cargarDepartamentos();

    // Carga inicial: traer todos (sin paginación)
    this.refrescar(true);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  limpiarFiltros(): void {
    this.municipioId.set(null);
    this.departamentoId.set(null);
    this.estadoBeneficiario.set(null);
    this.mayorEdad.set(null);
    this.buscar.set('');
    this.page.set(0);
  }

  exportarCSV(): void {
    const rows = this.filtrados();
    const header = [
      'BeneficiarioId',
      'PersonaId',
      'NombreCompleto',
      'Genero',
      'Departamento',
      'Municipio',
      'EstadoBeneficiario',
      'FechaInicio',
      'Edad',
      'EsMayorEdad',
      'Latitud',
      'Longitud',
    ];
    const body = rows.map((r: any) => [
      r.beneficiarioId,
      r.personaId,
      r.nombreCompleto,
      this.generoLabel(r.genero),
      r.nombreDepartamento,
      r.nombreMunicipio,
      this.estadoBeneficiarioLabel(r.estadoBeneficiario),
      new Date(r.fechaInicio).toISOString().split('T')[0],
      r.edad ?? '',
      r.esMayorEdad ? 'Sí' : 'No',
      r.latitud,
      r.longitud,
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_beneficiarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportarXLSX(): Promise<void> {
    try {
      const { blob, filename } = await this._reportesService.exportReporteBeneficiariosXlsx({
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'reporte_beneficiarios.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // manejo de error centralizado por ApiService/interceptor si aplica
    }
  }

  // Handlers de filtros: actualiza signal y consulta al servicio
  setBuscar(value: string): void {
    this.buscar.set(value);
  }

  setMayorEdad(value: boolean | null): void {
    this.mayorEdad.set(value);
  }

  setEstadoBeneficiario(value: number | null): void {
    this.estadoBeneficiario.set(value);
  }

  private refrescar(initial = false): void {
    const baseFilters: any = {
      municipioId: this.municipioId() ?? undefined,
      departamentoId: this.departamentoId() ?? undefined,
      estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
      mayorEdad: this.mayorEdad(),
      q: this.buscar(),
    };

    const filters = initial
      ? baseFilters // sin paginación en la primera carga para traer todos
      : { ...baseFilters, page: this.page() + 1, pageSize: this.pageSize() };

    this._reportesService
      .getReporteBeneficiarios(filters)
      .then((resp) => this.total.set(resp?.total ?? this.data().length))
      .catch(() => void 0);
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.refrescar(false);
  }

  onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active || '');
    this.sortDirection.set(sort.direction || '');
  }

  estadoBeneficiarioLabel(v: number | null | undefined): string {
    if (v === 1) return 'Activo';
    if (v === 2) return 'Inactivo';
    return v != null ? String(v) : '-';
  }

  generoLabel(g: string | null | undefined): string {
    if (g === 'F') return 'Femenino';
    if (g === 'M') return 'Masculino';
    return g ?? '-';
  }

  // Chip de estado se maneja en el componente compartido

  private cargarDepartamentos(): void {
    this._adminService.getCatalogos('departamentos').then((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? []);
      this.departamentos = items as Departamento[];
    });
  }

  private cargarMunicipios(departamentoId: number): void {
    this._adminService.getCatalogos('municipios', { departamentoId }).then((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? []);
      this.municipios = items as Municipio[];
    });
  }

  setDepartamento(id: number | null): void {
    this.departamentoId.set(id);
    this.municipioId.set(null);
    this.municipios = [];
    if (typeof id === 'number') {
      this.cargarMunicipios(id);
    }
    this.page.set(0);
  }

  setMunicipio(id: number | null): void {
    this.municipioId.set(id);
    this.page.set(0);
  }

  aplicarFiltros(): void {
    this.page.set(0);
    this.refrescar();
  }
}
