import { Component, OnInit } from '@angular/core';
import { AgregarUsuarioDTO } from '../models/nuevo-usuario.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdminService } from '../admin-service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Departamento } from '../models/departamentos.model';
import { Municipio } from '../models/municipio.model';
import { RolUsuario } from '../models/rol.model';
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

@Component({
    selector: 'form-agregar-usuario',
    templateUrl: 'agregar-usuario.component.html',
    imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule
]
})

export class FormularioAgregarUsuarioComponent implements OnInit {
    usuario:AgregarUsuarioDTO = new AgregarUsuarioDTO
    departamentos: Departamento[]
    municipios: Municipio[]
    roles: RolUsuario[]
    departamentoIdSeleccionado: number = 19;

    constructor(
        private _adminService: AdminService,
         public dialogRef: MatDialogRef<FormularioAgregarUsuarioComponent>,
    ) { }

    ngOnInit() {
        this.getRoles();
    }

    registrarUsuario(){
        this._adminService.postUsuario(this.usuario)
        .then((response: any)=>{
            this.dialogRef.close(false)
            this._adminService.getListadoUsuarios()
        })
    }

    getDepartamentos(){
        const catalogo ='departamentos'
        this._adminService.getCatalogos(catalogo)
        .then((response:any)=>{
            this.departamentos= response as Departamento[]
        })
    }

    getMunicipios(departamentoId: number | string ){
        const depId = Number(departamentoId);
        const catalogo ='municipios'
        const params = {
            departamentoId: depId
        }
        this._adminService.getCatalogos(catalogo, params)
        .then((response:any)=>{
            this.municipios= response as Municipio[]
        })
    }

    getRoles(){
        const catalogo ='roles'
        this._adminService.getCatalogos(catalogo)
        .then((response:any)=>{
            this.roles= response as RolUsuario[]
        })

    }


}
