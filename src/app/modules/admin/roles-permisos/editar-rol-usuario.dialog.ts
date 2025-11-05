import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminService } from '../admin-service';
import { ApiService } from 'app/core/service/api-service';
import { RolUsuario } from '../models/rol.model';
import { UsuarioDTO } from '../models/listado-usuarios.model';

@Component({
  selector: 'app-editar-rol-usuario-dialog',
  standalone: true,
  templateUrl: './editar-rol-usuario.dialog.html',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class EditarRolUsuarioDialogComponent implements OnInit {
  usuarios: UsuarioDTO[] = [];
  roles: RolUsuario[] = [];
  seleccionadoUsuarioId: number | null = null;
  seleccionadoRolId: number | null = null;
  usuarioReadOnly = false;

  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<EditarRolUsuarioDialogComponent>,
    private _adminService: AdminService,
    private _api: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: { usuarioPreseleccionadoId?: number, rolIdPreseleccionado?: number }
  ) {}

  ngOnInit(): void {
    // Cargar usuarios y roles
    this._adminService.getListadoUsuarios().then((resp: any) => {
      this.usuarios = resp as UsuarioDTO[];
      if (this.data?.usuarioPreseleccionadoId) {
        this.seleccionadoUsuarioId = this.data.usuarioPreseleccionadoId;
        this.usuarioReadOnly = true;
      }
    });
    this._adminService.getCatalogos('roles').then((resp: any) => {
      this.roles = resp as RolUsuario[];
      if (this.data?.rolIdPreseleccionado) {
        const rol = this.roles.find(r => r.rolId === this.data!.rolIdPreseleccionado);
        if (rol) this.seleccionadoRolId = rol.rolId;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (!this.seleccionadoUsuarioId || !this.seleccionadoRolId) {
      return;
    }
    this.guardando = true;
    this._adminService.actualizarRolUsuario(this.seleccionadoUsuarioId, this.seleccionadoRolId)
      .then(() => {
        this._api.showSuccessMessage('Rol actualizado correctamente');
        this.dialogRef.close({ usuarioId: this.seleccionadoUsuarioId, rolId: this.seleccionadoRolId });
      })
      .finally(() => this.guardando = false);
  }
}
