import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../admin-service';
import { RolUsuario } from '../models/rol.model';
import { UsuarioDTO } from '../models/listado-usuarios.model';
import { MatDialog } from '@angular/material/dialog';
import { EditarRolUsuarioDialogComponent } from './editar-rol-usuario.dialog';

@Component({
    selector: 'roles-permisos',
    standalone: true,
    templateUrl: './roles-permisos.component.html',
    imports: [CommonModule],
})
export class RolesPermisosComponent implements OnInit {
    usuarios: UsuarioDTO[] = [];
    loading = false;

    constructor(private _adminService: AdminService, private _dialog: MatDialog) {}

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.loading = true;
        this._adminService
            .getListadoUsuarios()
            .then((res: any) => {
                this.usuarios = (res as UsuarioDTO[]) || [];
            })
            .finally(() => (this.loading = false));
    }

    editarRolUsuario(user?: UsuarioDTO): void {
        this._dialog.open(EditarRolUsuarioDialogComponent, {
            panelClass: ['w-full', 'md:w-4/12', 'mx-0'],
            maxHeight: 'calc(100vh - 4rem)',
            data: { usuarioPreseleccionadoId: user?.usuarioId, rolIdPreseleccionado: user?.rol?.rolId }
        }).afterClosed().subscribe((result) => {
            if (result?.usuarioId && result?.rolId) {
                // Refrescar listado
                this.cargarUsuarios();
            }
        });
    }
}
