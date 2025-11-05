import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BeneficiariosService } from '../beneficiarios-service';
import { TagComponent } from 'app/shared/tag/tag.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatDivider } from "@angular/material/divider";
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';

interface Municipio {
  municipioId: number;
  nombreMunicipio: string;
}

interface Locacion {
  locacionId?: number;
  nombreLocacion?: string;
}

interface Persona {
  personaId: number;
  primerNombre: string | null;
  segundoNombre: string | null;
  tercerNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correoElectronico?: string | null;
  fechaNacimiento?: string | null; // YYYY-MM-DD
  municipio: Municipio | null;
  locacion: Locacion | null;
}

interface BeneficiarioDetalle {
  beneficiarioId: number;
  estadoId: number;
  fechaInicio: string;
  latitud: string | null;
  longitud: string | null;
  persona: Persona;
}

@Component({
  selector: 'app-perfil-beneficiario',
  standalone: true,
  templateUrl: 'perfil-beneficiario.component.html',
  imports: [CommonModule, RouterModule, RouterOutlet, MatSidenavModule, MatIconModule, MatButtonModule, TagComponent, MatDivider]
})
export class PerfilBeneficiarioComponent implements OnInit, OnDestroy {
  private _route = inject(ActivatedRoute);
  private _benefService = inject(BeneficiariosService);
  private sanitizer = inject(DomSanitizer);
  private _router = inject(Router);

  id: number = null;
  data: BeneficiarioDetalle = null;
  cargando = true;
  mapaUrl: SafeResourceUrl = null;
  @ViewChild('detailDrawer') detailDrawer: MatDrawer;
  detailDrawerOpened = false;

  ngOnInit(): void {
    this.id = Number(this._route.snapshot.paramMap.get('id'));
    this.cargar();

    this._router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.syncDrawerWithRoute();
      }
    });
    this.syncDrawerWithRoute();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const resp = await this._benefService.getBeneficiarioPorId(this.id);
      this.data = resp as BeneficiarioDetalle;
      this.actualizarMapa();
    } finally {
      this.cargando = false;
    }
  }

  nombreCompleto(p: Persona): string {
    return [
      p?.primerNombre,
      p?.segundoNombre,
      p?.tercerNombre,
      p?.primerApellido,
      p?.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  ngOnDestroy(): void {}

  actualizarMapa(): void {
    // Construir mapa si hay lat/lng válidos
    const latRaw = this.data?.latitud;
    const lngRaw = this.data?.longitud;
    const lat = typeof latRaw === 'string' ? parseFloat(latRaw.replace(',', '.')) : Number(latRaw);
    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw.replace(',', '.')) : Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const url = `https://www.google.com/maps?q=${lat},${lng}&hl=es&z=15&output=embed`;
      this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      return;
    }
    this.mapaUrl = null;
  }

  // Edad y menor de edad
  edad(fechaNacimiento?: string | null): number | null {
    if (!fechaNacimiento) return null;
    const dob = new Date(fechaNacimiento);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  esMenorDeEdad(fechaNacimiento?: string | null): boolean {
    const e = this.edad(fechaNacimiento);
    return e !== null && e < 18;
  }

  abrirEditar(): void {
    this._router.navigate(['editar'], { relativeTo: this._route, state: { beneficiario: this.data } });
  }

  cerrarDrawer(): void {
    this._router.navigate(['./'], { relativeTo: this._route });
  }

  private syncDrawerWithRoute(): void {
    let r = this._route;
    while (r.firstChild) r = r.firstChild;
    const path = r.snapshot.routeConfig?.path ?? '';
    const open = path === 'editar';
    this.detailDrawerOpened = open;
    if (open) this.detailDrawer?.open(); else this.detailDrawer?.close();
  }
}
