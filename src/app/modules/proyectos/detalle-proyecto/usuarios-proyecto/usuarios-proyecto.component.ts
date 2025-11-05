import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseCardComponent } from '@fuse/components/card';
import { AdminService } from 'app/modules/admin/admin-service';
import { UsuarioDTO } from 'app/modules/admin/models/listado-usuarios.model';
import { ApiService } from 'app/core/service/api-service';
import { ProyectoUsuario } from '../../models/proyecto-usuario.model';
import { ProyectosService } from '../../proyectos-service';


@Component({
    selector: 'app-usuarios-proyecto',
    templateUrl: './usuarios-proyecto.component.html',
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        FuseCardComponent,
    ],
})
export class UsuariosProyectoComponent implements OnInit {
    @Input({ required: true }) proyectoId!: number;

    usuarios: UsuarioDTO[] = [];
    usuarioIdSeleccionado: number | null = null;
    usuariosAsignados: ProyectoUsuario[] = [];
    cargando = true;

    constructor(
        private _adminService: AdminService,
        private _api: ApiService,
        private _proyectosService: ProyectosService
    ) {}

    async ngOnInit(): Promise<void> {
        await this._load();
    }

    private async _load(): Promise<void> {
        this.cargando = true;
        try {
            const users = (await this._adminService.getListadoUsuarios()) as UsuarioDTO[];
            this.usuarios = users ?? [];
            await this._loadUsuariosAsignados();
        } finally {
            this.cargando = false;
        }
    }

    private async _loadUsuariosAsignados(): Promise<void> {
        try {
            this.usuariosAsignados = await this._proyectosService.getUsuariosDeProyecto(
                this.proyectoId
            );
        } catch {}
    }

    async agregarUsuario(): Promise<void> {
        if (!this.usuarioIdSeleccionado) return;
        // Evitar duplicados
        if (this.usuariosAsignados.some((x) => x.usuarioId === this.usuarioIdSeleccionado)) {
            this._api.showErrorMessage('El usuario ya está asignado al proyecto');
            return;
        }
        try {
            await this._proyectosService.addUsuarioAProyecto(
                this.proyectoId,
                this.usuarioIdSeleccionado
            );
            this._api.showSuccessMessage('Usuario agregado al proyecto');
            this.usuarioIdSeleccionado = null;
            await this._loadUsuariosAsignados();
        } catch (e) {}
    }

    async removerUsuario(u: ProyectoUsuario): Promise<void> {
        try {
            await this._proyectosService.removeUsuarioDeProyecto(
                this.proyectoId,
                u.usuarioId
            );
            this._api.showSuccessMessage('Usuario removido del proyecto');
            await this._loadUsuariosAsignados();
        } catch (e) {}
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
