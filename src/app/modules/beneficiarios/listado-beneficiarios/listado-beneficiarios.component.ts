import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { BeneficiariosService } from '../beneficiarios-service';
import { BeneficiarioListDTO, ResponseBeneficiarioListDTO } from '../models/beneficiarios-list-DTO.model';
import { Subscription } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TagComponent } from 'app/shared/tag/tag.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-listado-beneficiarios',
  templateUrl:'listado-beneficiarios.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule, RouterModule, MatPaginatorModule, TagComponent]

})
export class ListadoBeneficiariosComponent implements OnInit, OnDestroy {
  beneficiarios: BeneficiarioListDTO[] = [];
  cargando = false;
  private subs = new Subscription();
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(private _beneficiariosService: BeneficiariosService) {}

  ngOnInit(): void {
    const sub = this._beneficiariosService.beneficiarios$.subscribe((list) => {
      this.beneficiarios = list || [];
      this.cargando = false;
    });
    this.subs.add(sub);
    this.refrescar();
  }

  refrescar(): void {
    this.cargando = true;
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this._beneficiariosService
      .getBeneficiarios(start, end)
      .then((resp: ResponseBeneficiarioListDTO) => {
        this.total = resp?.total ?? 0;
      })
      .finally(() => {
        this.cargando = false;
      });
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

  estadoColor(id?: number): 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray' {
    if (id === 1) return 'success';
    if (id === 2) return 'info';
    if (id === 3) return 'warn';
    return 'gray';
  }

  estadoLabel(id?: number): string {
    if (id === 1) return 'Activo';
    if (id === 2) return 'Inactivo';
    return 'Desconocido';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
