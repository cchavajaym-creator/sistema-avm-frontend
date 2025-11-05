import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProyectosService } from '../proyectos-service';
import { ApiService } from 'app/core/service/api-service';
import { Actividad } from '../models/actividad.model';
import { ProyectoBeneficiario } from '../models/proyecto-beneficiario.model';
import { Subscription } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AsistenciaActividad } from '../models/asistencia-actividad.model';
import { MetricCardComponent } from 'app/shared/metric-card/metric-card.component';

@Component({
  selector: 'app-actividad-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MetricCardComponent],
  templateUrl: 'actividad-detalle.component.html'
})
export class ActividadDetalleComponent implements OnInit, OnDestroy {
  actividad: Actividad | null = null;
  cargando = true;
  proyectoId!: number;
  actividadId!: number;
  private _sub = new Subscription();

  beneficiarios: ProyectoBeneficiario[] = [];
  asistenciasBeneficiarios: Record<number, boolean> = {};
  cargandoListas = false;
  guardando = false;
  asistenciaFecha: string = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  observacionesBeneficiarios: Record<number, string> = {};
  asistencias: AsistenciaActividad[] = [];
  presentesCount = 0;
  ausentesCount = 0;
  private asistenciaPersonaMap: Record<number, { nombre: string; departamento?: string | null; municipio?: string | null; fecha?: string | null }> = {};
  ahora: Date = new Date();

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _proyectosService: ProyectosService,
    private _api: ApiService,
  ) {}

  ngOnInit(): void {
    const sub = this._route.paramMap.subscribe(async (params) => {
      // Read project id from current or parent route
      const idParam =
        params.get('proyectoId') ??
        params.get('id') ??
        this._route.parent?.snapshot.paramMap.get('id') ??
        this._route.parent?.snapshot.paramMap.get('proyectoId');
      const pId = idParam ? Number(idParam) : NaN;
      const aId = Number(params.get('actividadId'));
      if (!pId || !aId || isNaN(pId) || isNaN(aId)) {
        this._router.navigate(['/listado-proyectos']);
        return;
      }
      this.proyectoId = pId;
      this.actividadId = aId;
      this.cargando = true;
      try {
        this.actividad = await this._proyectosService.getActividadDeProyecto(pId, aId);
        await this.cargarListas(pId);
        await this.cargarAsistencias();
      } finally {
        this.cargando = false;
      }
    });
    this._sub.add(sub);
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }

  private async cargarListas(proyectoId: number): Promise<void> {
    this.cargandoListas = true;
    try {
      const beneficiarios = await this._proyectosService.getBeneficiariosDeProyecto(proyectoId);
      this.beneficiarios = beneficiarios ?? [];
      this.asistenciasBeneficiarios = Object.fromEntries(
        (this.beneficiarios || []).map((b) => [b.beneficiarioId, false])
      );
      this.observacionesBeneficiarios = Object.fromEntries(
        (this.beneficiarios || []).map((b) => [b.beneficiarioId, ''])
      );
    } finally {
      this.cargandoListas = false;
    }
  }

  private normalizarFecha(fechaIso: string | null | undefined): string | null {
    if (!fechaIso) return null;
    try {
      const d = new Date(fechaIso);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }

  async cargarAsistencias(): Promise<void> {
    if (!this.proyectoId || !this.actividadId) return;
    const all = await this._proyectosService.getAsistenciasDeActividad(this.proyectoId, this.actividadId);
    const target = (this.asistenciaFecha || '').slice(0, 10);
    this.asistencias = (all || []).filter(a => this.normalizarFecha(a.fechaRegistro) === target);

    // Reinicia mapas
    for (const b of this.beneficiarios || []) {
      this.asistenciasBeneficiarios[b.beneficiarioId] = false;
      this.observacionesBeneficiarios[b.beneficiarioId] = '';
    }
    // Aplica valores desde asistencias
    this.asistenciaPersonaMap = {};
    for (const a of this.asistencias) {
      if (a?.beneficiarioId != null) {
        this.asistenciasBeneficiarios[a.beneficiarioId] = a.estadoId === 1;
        this.observacionesBeneficiarios[a.beneficiarioId] = a.observaciones ?? '';
        const p = a.beneficiario?.persona;
        if (p) {
          const parts = [p.primerNombre, p.segundoNombre, p.tercerNombre, p.primerApellido, p.segundoApellido]
            .filter((s) => !!s && String(s).trim().length > 0);
          const nombre = parts.join(' ');
          this.asistenciaPersonaMap[a.beneficiarioId] = {
            nombre: nombre || `${p.primerNombre ?? ''} ${p.primerApellido ?? ''}`.trim(),
            departamento: p.departamento ?? undefined,
            municipio: p.municipio ?? undefined,
            // Guardar la fecha completa para poder mostrar hora:min:seg
            fecha: a.fechaRegistro || null,
          };
        }
      }
    }
    this.recontarAsistencias();
  }

  onFechaCambio(): void {
    this.cargarAsistencias();
  }

  displayNombre(b: ProyectoBeneficiario): string {
    const fromAsistencia = this.asistenciaPersonaMap[b.beneficiarioId]?.nombre;
    if (fromAsistencia) return fromAsistencia;
    const pn = b.persona?.primerNombre || '';
    const pa = b.persona?.primerApellido || '';
    return `${pn} ${pa}`.trim();
  }

  displayDepartamento(beneficiarioId: number): string | null | undefined {
    return this.asistenciaPersonaMap[beneficiarioId]?.departamento;
  }

  displayMunicipio(beneficiarioId: number): string | null | undefined {
    return this.asistenciaPersonaMap[beneficiarioId]?.municipio;
  }

  displayFechaRegistro(beneficiarioId: number): string | null | undefined {
    return this.asistenciaPersonaMap[beneficiarioId]?.fecha;
  }

  private recontarAsistencias(): void {
    const total = (this.beneficiarios || []).length;
    const presentes = Object.values(this.asistenciasBeneficiarios).filter(Boolean).length;
    this.presentesCount = presentes;
    this.ausentesCount = Math.max(0, total - presentes);
  }

  async guardarAsistencias(): Promise<void> {
    if (!this.proyectoId || !this.actividadId) return;
    // Construir fecha con hora:min:seg en el momento de guardar
    this.ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = this.ahora.getFullYear();
    const m = pad(this.ahora.getMonth() + 1);
    const d = pad(this.ahora.getDate());
    const hh = pad(this.ahora.getHours());
    const mm = pad(this.ahora.getMinutes());
    const ss = pad(this.ahora.getSeconds());
    const fechaConHora = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
    // Actualiza la fecha base para filtros (solo la parte de fecha)
    this.asistenciaFecha = `${y}-${m}-${d}`;
    const items = (this.beneficiarios || []).map((b) => ({
      beneficiarioId: b.beneficiarioId,
      fechaRegistro: fechaConHora,
      estadoId: this.asistenciasBeneficiarios[b.beneficiarioId] ? 1 : 2,
      observaciones: this.observacionesBeneficiarios[b.beneficiarioId] || undefined,
    }));
    const payload = { items } as const;
    try {
      this.guardando = true;
      await this._proyectosService.registrarAsistenciaActividad(this.proyectoId, this.actividadId, payload as any);
      this._api.showSuccessMessage('Asistencias registradas correctamente');
      await this.cargarAsistencias();
    } finally {
      this.guardando = false;
    }
  }
}
