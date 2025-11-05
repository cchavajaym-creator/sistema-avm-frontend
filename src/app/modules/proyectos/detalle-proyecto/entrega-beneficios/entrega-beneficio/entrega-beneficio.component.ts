import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatDivider } from "@angular/material/divider";
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { ProyectosService } from 'app/modules/proyectos/proyectos-service';
import { ProyectoBeneficiario } from 'app/modules/proyectos/models/proyecto-beneficiario.model';


@Component({
    selector: 'app-entrega-beneficio',
    templateUrl: 'entrega-beneficio.component.html',
    imports: [
    CommonModule, MatButtonModule, MatIconModule, RouterLink,
    MatDivider, MatTableModule, MatTooltipModule
]
})

export class EntregaBeneficioComponent implements OnInit {
    displayedColumns = ['nombre', 'fechaEvento', 'lugar', 'observaciones', 'acciones'];
    proyectoId: number | null = null;
    beneficiarios: ProyectoBeneficiario[] = [];
    cargandoBeneficiarios = false;

    constructor(
        private _route: ActivatedRoute,
        public _proyectos: ProyectosService,
    ) { }

    async ngOnInit() {
        const idParam = this._route.snapshot.paramMap.get('id') ?? this._route.parent?.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (id && !isNaN(id)) {
            this.proyectoId = id;
            this._proyectos.loadEventosEntrega(id);
            // Cargar beneficiarios del proyecto (igual que en registro de asistencias)
            this.cargandoBeneficiarios = true;
            try {
                this.beneficiarios = await this._proyectos.getBeneficiariosDeProyecto(id);
            } finally {
                this.cargandoBeneficiarios = false;
            }
        }
    }
}
