import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { EstadoChipComponent } from 'app/shared/estado-chip/estado-chip.component';
import { Subscription } from 'rxjs';
import { ReportesService } from '../reportes.service';
import { BeneficiarioProyectoItem } from '../models/reporte-beneficiarios-proyecto.model';
import { AdminService } from 'app/modules/admin/admin-service';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { ProyectosService } from 'app/modules/proyectos/proyectos-service';

@Component({
  selector: 'app-reporte-beneficiarios-proyecto',
  standalone: true,
  templateUrl: 'reporte-beneficiarios-proyecto.component.html',
  imports: [
    CommonModule,
    DatePipe,
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
export class ReporteBeneficiariosProyectoComponent implements OnInit, OnDestroy {
  // Filtros
  proyectoId = signal<number | null>(null);
  estadoEnProyecto = signal<number | null>(null);
  departamentoId = signal<number | null>(null);
  municipioId = signal<number | null>(null);
  estadoBeneficiario = signal<number | null>(null);
  mayorEdad = signal<boolean | null>(null);
  buscar = signal<string>('');

  // Datos
  private subs = new Subscription();
  private data = signal<BeneficiarioProyectoItem[]>([]);
  total = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  sortActive = signal<string>('');
  sortDirection = signal<'asc' | 'desc' | ''>('');

  displayedColumns = [
    'nombreProyecto',
    'nombreCompleto',
    'genero',
    'nombreDepartamento',
    'nombreMunicipio',
    'estadoBeneficiario',
    'estadoEnProyecto',
    'fechaIncorporacionProyecto',
    'edad',
    'esMayorEdad',
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

  // Catálogos
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];
  proyectos: { proyectoId: number; nombreProyecto: string }[] = [];
  // Lista directa de proyectos en el select (sin input de búsqueda duplicado)

  constructor(
    private _reportes: ReportesService,
    private _admin: AdminService,
    private _proyectos: ProyectosService,
  ) {}

  ngOnInit(): void {
    const s = this._reportes
      .getReporteBeneficiariosPorProyecto({ page: 1, pageSize: this.pageSize() })
      .then((resp) => {
        const items = (resp?.items ?? []).map(this.normalizeItem);
        this.data.set(items);
        this.total.set(resp?.total ?? items.length);
      });
    // cargar catálogos
    this.cargarDepartamentos();
    this.cargarProyectos();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private normalizeItem(r: any): BeneficiarioProyectoItem {
    const edadNum = typeof r.edad === 'string' ? Number(r.edad) : r.edad;
    const mayor = typeof r.esMayorEdad === 'boolean' ? r.esMayorEdad : (typeof edadNum === 'number' ? edadNum >= 18 : false);
    return {
      ...r,
      edad: edadNum,
      esMayorEdad: mayor,
    } as BeneficiarioProyectoItem;
  }

  aplicarFiltros(): void {
    this.page.set(0);
    this.refrescar();
  }

  limpiarFiltros(): void {
    this.proyectoId.set(null);
    this.estadoEnProyecto.set(null);
    this.departamentoId.set(null);
    this.municipioId.set(null);
    this.estadoBeneficiario.set(null);
    this.mayorEdad.set(null);
    this.buscar.set('');
    this.page.set(0);
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
      .getReporteBeneficiariosPorProyecto({
        proyectoId: this.proyectoId() ?? undefined,
        estadoEnProyecto: this.estadoEnProyecto() ?? undefined,
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .then((resp) => {
        const items = (resp?.items ?? []).map(this.normalizeItem);
        this.data.set(items);
        this.total.set(resp?.total ?? items.length);
      })
      .catch(() => void 0);
  }

  async exportarXLSX(): Promise<void> {
    try {
      const { blob, filename } = await this._reportes.exportReporteBeneficiariosProyectoXlsx({
        proyectoId: this.proyectoId() ?? undefined,
        estadoEnProyecto: this.estadoEnProyecto() ?? undefined,
        municipioId: this.municipioId() ?? undefined,
        departamentoId: this.departamentoId() ?? undefined,
        estadoBeneficiario: this.estadoBeneficiario() ?? undefined,
        mayorEdad: this.mayorEdad(),
        q: this.buscar(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'reporte_beneficiarios_proyecto.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // error handling centralizado
    }
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

  private cargarProyectos(): void {
    this._proyectos.getProyectos({}).then((resp: any) => {
      const items = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? []);
      this.proyectos = (items || []).map((p: any) => ({ proyectoId: p.proyectoId, nombreProyecto: p.nombreProyecto }));
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

  estadoEnProyectoLabel(v: number | null | undefined): string {
    if (v === 1) return 'Activo';
    if (v === 2) return 'Inactivo';
    return v != null ? String(v) : '-';
  }

  // Colores gestionados por el componente compartido
}
