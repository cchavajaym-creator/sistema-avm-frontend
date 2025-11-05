import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProyectosService } from '../proyectos-service';
import { ApiService } from 'app/core/service/api-service';
import { MatTableModule } from '@angular/material/table';
import { MatDivider } from '@angular/material/divider';
import { ProyectoBeneficiario } from '../models/proyecto-beneficiario.model';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BeneficiosService } from '../beneficios-service';
import { MatInputModule } from '@angular/material/input';
import { BeneficiosDTO } from '../models/beneficios.model';
import { EventoEntregaDTO } from '../models/evento-entrega.model';

@Component({
  selector: 'app-entrega-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatTableModule, MatDivider, MatCheckboxModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: 'entrega-detalle.component.html'
})
export class EntregaDetalleComponent implements OnInit, OnDestroy {
  proyectoId!: number;
  eventoId!: number;
  cargando = true;
  evento: EventoEntregaDTO = null;
  beneficiarios: ProyectoBeneficiario[] = [];
  cargandoBeneficiarios = false;
  displayedColumns = ['nombre', 'municipio', 'entrega', 'cantidad', 'observaciones'];
  beneficios: BeneficiosDTO[] = [];
  beneficioIdSeleccionado: number | null = null;
  entregasBeneficiarios: Record<number, boolean> = {};
  cantidadesBeneficiarios: Record<number, number> = {};
  observacionesBeneficiarios: Record<number, string> = {};
  guardando = false;
  // Entregas existentes del evento (todas, se filtran por beneficio seleccionado)
  entregasEvento: import('../models/entrega-beneficio.model').EntregaBeneficio[] = [];
  // Control de edición
  edicionHabilitada = true;
  totalEntregasPrevias = 0;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _proyectos: ProyectosService,
    private _api: ApiService,
    private _beneficiosService: BeneficiosService,
  ) {}

  ngOnInit(): void {
    this._route.paramMap.subscribe(async (params) => {
      const pIdRaw = params.get('id') ?? this._route.parent?.snapshot.paramMap.get('id');
      const eIdRaw = params.get('eventoId');
      const pId = pIdRaw ? Number(pIdRaw) : NaN;
      const eId = eIdRaw ? Number(eIdRaw) : NaN;
      if (!pId || !eId || isNaN(pId) || isNaN(eId)) {
        this._router.navigate(['/listado-proyectos']);
        return;
      }
      this.proyectoId = pId;
      this.eventoId = eId;
      this.cargando = true;
      try {
        this.evento = await this._proyectos.getEventoEntrega(this.proyectoId, this.eventoId);
        // Cargar beneficiarios asociados al proyecto
        this.cargandoBeneficiarios = true;
        try {
          this.beneficiarios = await this._proyectos.getBeneficiariosDeProyecto(this.proyectoId);
          this.entregasBeneficiarios = Object.fromEntries((this.beneficiarios || []).map(b => [b.beneficiarioId, false]));
          this.cantidadesBeneficiarios = Object.fromEntries((this.beneficiarios || []).map(b => [b.beneficiarioId, 1]));
          this.observacionesBeneficiarios = Object.fromEntries((this.beneficiarios || []).map(b => [b.beneficiarioId, '']));
        } finally {
          this.cargandoBeneficiarios = false;
        }
        // Cargar beneficios del proyecto
        try {
          this.beneficios = await this._beneficiosService.getBeneficiosPorProyecto(this.proyectoId);
          this.beneficioIdSeleccionado = null;
        } catch {}
        // Cargar entregas existentes del evento
        try {
          this.entregasEvento = await this._proyectos.getEntregasDeEvento(this.proyectoId, this.eventoId);
        } catch {
          this.entregasEvento = [];
        }
        // Intentar preseleccionar beneficio según entregas o lista de beneficios
        this.preseleccionarBeneficio();
      } finally {
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {}

  get unidadMedidaSeleccionada(): string | null {
    const ben = (this.beneficios || []).find(b => b?.beneficioId === this.beneficioIdSeleccionado);
    return (ben?.unidadMedida ?? null) as string | null;
  }

  onToggleEntrega(beneficiarioId: number, entregado: boolean): void {
    if (entregado) {
      const current = Number(this.cantidadesBeneficiarios[beneficiarioId]) || 0;
      if (current <= 0) {
        this.cantidadesBeneficiarios[beneficiarioId] = 1;
      }
    } else {
      this.cantidadesBeneficiarios[beneficiarioId] = 0;
      this.observacionesBeneficiarios[beneficiarioId] = '';
    }
  }

  async onBeneficioChange(_beneficioId: number | null): Promise<void> {
    // Re-mapear UI según entregas existentes del beneficio seleccionado
    this.mapearEntregasAUi();
  }

  private mapearEntregasAUi(): void {
    // Reset a valores por defecto
    for (const b of this.beneficiarios || []) {
      this.entregasBeneficiarios[b.beneficiarioId] = false;
      this.cantidadesBeneficiarios[b.beneficiarioId] = 1;
      this.observacionesBeneficiarios[b.beneficiarioId] = '';
    }
    if (!this.beneficioIdSeleccionado) return;
    const porBeneficio = (this.entregasEvento || []).filter(e => e.beneficioId === this.beneficioIdSeleccionado);
    this.totalEntregasPrevias = porBeneficio.length;
    // Si hay entregas previas, bloquear edición por defecto
    this.edicionHabilitada = this.totalEntregasPrevias === 0;
    for (const e of porBeneficio) {
      const id = e.beneficiarioId;
      const entregado = e.estadoId === 1;
      this.entregasBeneficiarios[id] = entregado;
      this.cantidadesBeneficiarios[id] = e.cantidad ?? (entregado ? 1 : 0);
      this.observacionesBeneficiarios[id] = e.observaciones ?? '';
    }
  }

  habilitarEdicion(): void {
    this.edicionHabilitada = true;
  }

  private preseleccionarBeneficio(): void {
    if (this.beneficioIdSeleccionado) return;
    // Si entregas traen beneficioId, usar el primero que exista en la lista de beneficios
    const idsEntregas = (this.entregasEvento || [])
      .map(e => (e as any).beneficioId)
      .filter((v: any) => v !== null && v !== undefined) as number[];
    const primeroDeEntregas = idsEntregas.find(id => (this.beneficios || []).some(b => b?.beneficioId === id));
    if (primeroDeEntregas != null) {
      this.beneficioIdSeleccionado = primeroDeEntregas;
      this.mapearEntregasAUi();
      return;
    }
    // Si no hay beneficioId en entregas, pero solo hay un beneficio, preseleccionarlo
    if ((this.beneficios || []).length === 1) {
      this.beneficioIdSeleccionado = this.beneficios[0].beneficioId;
      this.mapearEntregasAUi();
    }
  }

  async guardarEntregas(): Promise<void> {
    if (!this.proyectoId || !this.eventoId || !this.beneficioIdSeleccionado) {
      this._api.showErrorMessage('Debe seleccionar un beneficio.');
      return;
    }
    const ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fechaEntrega = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
    const seleccionados = (this.beneficiarios || []).filter(b => !!this.entregasBeneficiarios[b.beneficiarioId]);
    if (seleccionados.length === 0) {
      this._api.showErrorMessage('Seleccione al menos un beneficiario entregado.');
      return;
    }
    const items = seleccionados.map(b => ({
      beneficiarioId: b.beneficiarioId,
      fechaEntrega,
      cantidad: Number(this.cantidadesBeneficiarios[b.beneficiarioId]) || 0,
      estadoId: 1,
      observaciones: (this.observacionesBeneficiarios[b.beneficiarioId] || '').trim() || undefined,
    }));
    const payload = { eventoId: this.eventoId, items } as const;
    try {
      this.guardando = true;
      await this._proyectos.registrarEntregasBeneficioLote(this.proyectoId, this.beneficioIdSeleccionado, payload as any);
      this._api.showSuccessMessage('Entregas registradas correctamente');
      // Recargar y re-mapear entregas del evento
      this.entregasEvento = await this._proyectos.getEntregasDeEvento(this.proyectoId, this.eventoId);
      this.mapearEntregasAUi();
    } finally {
      this.guardando = false;
    }
  }
}
