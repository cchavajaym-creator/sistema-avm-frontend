import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { PerfilUsuarioDTO } from '../models/perfil-usuario.model';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminService } from '../../admin/admin-service';
import { Departamento } from '../../admin/models/departamentos.model';
import { Municipio } from '../../admin/models/municipio.model';
import { ApiService } from 'app/core/service/api-service';

@Component({
    selector: 'app-perfil-usuario',
    standalone: true,
    templateUrl: 'perfil-usuario.component.html',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule]
})

export class PerfilUsuarioComponent implements OnInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _fb = inject(FormBuilder);
    private _perfilService = inject(PerfilUsuarioService);
    private _adminService = inject(AdminService);
    private _api = inject(ApiService);

    userId: number = null;
    form: FormGroup;
    cargando = true;
    guardando = false;
    departamentos: Departamento[] = [];
    municipios: Municipio[] = [];

    constructor() {
        this.form = this._fb.group({
            usuarioId: [{ value: null, disabled: true }],
            personaId: [{ value: null, disabled: true }],
            primerNombre: ['', Validators.required],
            segundoNombre: [''],
            tercerNombre: [''],
            primerApellido: ['', Validators.required],
            segundoApellido: [''],
            fechaNacimiento: [''], // yyyy-MM-dd
            genero: [''],
            tipoDocumento: [''],
            numeroDocumento: [''],
            direccionDetalle: [''],
            departamentoId: [null],
            municipioId: [null],
            locacionId: [null],
            telefono: [''],
            contrasena: [''],
        });
    }

    async ngOnInit(): Promise<void> {
        this.userId = Number(this._route.snapshot.paramMap.get('userId'));
        await this.cargar();
    }

    private async cargar(): Promise<void> {
        this.cargando = true;
        try {
            const resp = (await this._perfilService.getPerfilUsuario(this.userId)) as PerfilUsuarioDTO;
            const data = { ...resp } as any;
            // Normalizar fecha a formato input date
            if (data?.fechaNacimiento) {
                data.fechaNacimiento = this.toInputDate(data.fechaNacimiento);
            }
            this.form.reset();
            this.form.patchValue(data);
            await this.cargarDepartamentosYPrefill(data?.municipioId ?? null);
        } finally {
            this.cargando = false;
        }
    }

    private async cargarDepartamentosYPrefill(municipioId: number | null): Promise<void> {
        // Cargar departamentos
        const resp = await this._adminService.getCatalogos('departamentos');
        this.departamentos = (resp as Departamento[]) ?? [];

        let departamentoId: number | null = this.form.get('departamentoId')?.value ?? null;

        if (municipioId) {
            // Intentar deducir el departamento recorriendo y buscando el municipio
            departamentoId = await this.encontrarDepartamentoPorMunicipio(municipioId);
        }

        if (!departamentoId) {
            // Fallback como en beneficiarios: 19 si existe
            const defaultDep = this.departamentos.find(d => d.departamentoId === 19) ? 19 : (this.departamentos[0]?.departamentoId ?? null);
            departamentoId = defaultDep;
        }

        if (departamentoId) {
            await this.cargarMunicipios(departamentoId);
        }
        if (municipioId) {
            this.form.patchValue({ departamentoId, municipioId });
        } else {
            this.form.patchValue({ departamentoId });
        }
    }

    private async encontrarDepartamentoPorMunicipio(municipioId: number): Promise<number | null> {
        for (const dep of this.departamentos) {
            const muniResp = await this._adminService.getCatalogos('municipios', { departamentoId: dep.departamentoId });
            const municipios = (muniResp as Municipio[]) ?? [];
            if (municipios.some(m => Number(m.municipioId) === Number(municipioId))) {
                return dep.departamentoId;
            }
        }
        return null;
    }

    async cargarMunicipios(departamentoId: number): Promise<void> {
        const resp = await this._adminService.getCatalogos('municipios', { departamentoId });
        this.municipios = (resp as Municipio[]) ?? [];
    }

    async onDepartamentoChange(depId: string | number): Promise<void> {
        const id = Number(depId) || null;
        this.form.patchValue({ departamentoId: id, municipioId: null });
        this.municipios = [];
        if (id) await this.cargarMunicipios(id);
    }

    // (change) innecesario para municipio cuando usamos formControlName + [value]
    // Si se necesitara reaccionar, leer directamente del control y normalizar:
    // onMunicipioChange(): void {
    //     const v = this.form.get('municipioId')?.value;
    //     const id = v === '' || v === null || v === undefined ? null : Number(v);
    //     this.form.patchValue({ municipioId: id });
    // }

    async guardar(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.guardando = true;
        try {
            const payload = this.buildPayload();
            await this._perfilService.putPerfilUsuario(this.userId, payload);
            this._api.showSuccessMessage('Perfil de usuario actualizado');
        } finally {
            this.guardando = false;
        }
    }

    volver(): void {
        this._router.navigate(['/usuarios']);
    }

    private toInputDate(value: string): string {
        // Acepta 'YYYY-MM-DD' o ISO y devuelve 'YYYY-MM-DD'
        if (!value) return '';
        const d = value.includes('T') ? value.split('T')[0] : value;
        return d;
    }

    private buildPayload(): Partial<PerfilUsuarioDTO> {
        const raw = this.form.getRawValue();
        const payload: Partial<PerfilUsuarioDTO> = {
            usuarioId: raw.usuarioId ?? this.userId,
            personaId: raw.personaId ?? undefined,
            primerNombre: raw.primerNombre ?? '',
            segundoNombre: raw.segundoNombre ?? '',
            tercerNombre: raw.tercerNombre ?? null,
            primerApellido: raw.primerApellido ?? '',
            segundoApellido: raw.segundoApellido ?? '',
            fechaNacimiento: raw.fechaNacimiento ?? '',
            genero: raw.genero ? String(raw.genero).toUpperCase() : '',
            tipoDocumento: raw.tipoDocumento ?? '',
            numeroDocumento: raw.numeroDocumento ?? '',
            direccionDetalle: raw.direccionDetalle ?? '',
            municipioId: raw.municipioId === '' || raw.municipioId === null || raw.municipioId === undefined
                ? null
                : Number(raw.municipioId),
            locacionId: raw.locacionId ?? null,
            telefono: raw.telefono ?? '',
            contrasena: raw.contrasena ?? '',
        } as Partial<PerfilUsuarioDTO>;
        return payload;
    }
}
