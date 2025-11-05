import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BeneficiosService } from 'app/modules/proyectos/beneficios-service';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { RegistroBeneficioComponent } from 'app/modules/proyectos/detalle-proyecto/beneficios/registro-beneficio.component';

@Component({
  selector: 'app-listado-beneficios',
  standalone: true,
  templateUrl: 'listado-beneficios.component.html',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSidenavModule, RegistroBeneficioComponent]
})
export class ListadoBeneficiosComponent implements OnInit {
  beneficios: any[] = [];
  cargando = false;
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(private _beneficiosService: BeneficiosService) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    try {
      this.beneficios = await this._beneficiosService.getBeneficios();
    } finally {
      this.cargando = false;
    }
  }

  abrirNuevo(): void {
    this.drawer?.open();
  }

  cerrarDrawer(): void {
    this.drawer?.close();
    this.cargar();
  }
}
