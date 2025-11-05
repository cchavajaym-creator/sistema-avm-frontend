import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { Observable } from 'rxjs';
import { UsuarioDTO } from '../models/listado-usuarios.model';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormularioAgregarUsuarioComponent } from '../form-agregar-usuario/agregar-usuario.component';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'app/core/service/api-service';

@Component({
    selector: 'listado-usuarios',
    templateUrl: 'listado-usuarios.component.html',
    imports:[
        CommonModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule
    ]
})

export class ListadoUsuariosComponent implements OnInit {
    usuarios$: Observable<UsuarioDTO[]>

    constructor(
        private _adminService: AdminService,
        private _api:ApiService,
        public _dialog: MatDialog,
        private _router: Router,
    ) {
        this.usuarios$= this._adminService.usuarios$
    }

    ngOnInit() {
        this.getAllUsers()
    }

    getAllUsers(){
        this._adminService.getListadoUsuarios()
    }

    agregarUsuario(){
        const dialog= this._dialog.open(FormularioAgregarUsuarioComponent,{
                        panelClass: ['w-full', 'md:w-4/12','mx-0'],
                        maxHeight: 'calc(100vh - 4rem)',
                        disableClose: true,
        })
    }

    irAlPerfil(usuarioId: number): void {
        this._router.navigate(['perfil', usuarioId]);
    }

    editarRolUsuario(user: UsuarioDTO): void {
        import('../roles-permisos/editar-rol-usuario.dialog').then(({ EditarRolUsuarioDialogComponent }) => {
            this._dialog.open(EditarRolUsuarioDialogComponent, {
                panelClass: ['w-full', 'md:w-4/12', 'mx-0'],
                maxHeight: 'calc(100vh - 4rem)',
                data: { usuarioPreseleccionadoId: user?.usuarioId, rolIdPreseleccionado: user?.rol?.rolId }
            }).afterClosed().subscribe((result) => {
                if (result?.usuarioId && result?.rolId) {
                    this._api.showSuccessMessage('El usuario se ha registrado correctamente');
                    this.getAllUsers();
                }
            });
        });
    }
}
