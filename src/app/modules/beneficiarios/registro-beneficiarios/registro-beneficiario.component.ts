import { BeneficiariosService } from './../beneficiarios-service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { AdminService } from 'app/modules/admin/admin-service';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { LocacionDTO, LocacionesDTO } from '../models/locacionDTO.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AgregarLocacionDialogComponent } from './agregar-locacion-dialog.component';

@Component({
    selector: 'app-registro-beneficiario',
    standalone: true,
    templateUrl: 'registro-beneficiario.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatStepperModule,
    ]
})

export class RegistroBeneficiarioComponent implements OnInit, OnDestroy {
    formFieldHelpers: string[] = [''];
    beneficiarioForm: FormGroup;
    obteniendoUbicacion = false;
    guardando = false;
    // Catálogos
    departamentos: Departamento[] = [];
    municipios: Municipio[] = [];
    locaciones: LocacionesDTO[] = [];
    private subs = new Subscription();
    // País fijo (solo lectura)
    readonly paisNombre = 'Guatemala';
    readonly paisId = 1;

    generos = [
        { value: 'M', label: 'Masculino' },
        { value: 'F', label: 'Femenino' },
        { value: 'O', label: 'Otro' },
    ];

    constructor(
        private fb: FormBuilder,
        private _adminService: AdminService,
        private _beneficiariosService: BeneficiariosService,
        private _dialog: MatDialog,
        private _router: Router,
        private _route: ActivatedRoute,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit() {
        this.beneficiarioForm = this.fb.group({
            primerNombre: ['', [Validators.required, Validators.maxLength(100)]],
            segundoNombre: ['', [Validators.maxLength(100)]],
            tercerNombre: [null],
            primerApellido: ['', [Validators.required, Validators.maxLength(100)]],
            segundoApellido: [null],
            fechaNacimiento: [null],
            genero: [null],
            tipoDocumento: ['DPI'],
            numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
            direccionDetalle: [''],
            departamentoId: [null, Validators.required],
            municipioId: [null, Validators.required],
            locacionId: [null],
            telefono: [''],
            estadoId: [5],
            fechaInicio: [new Date()],
            latitud: [''],
            longitud: [''],
        });
        // Cargar catálogos
        this.getDepartamentos();

        // Suscripción a locaciones del servicio
        const sub = this._beneficiariosService.locaion$.subscribe((locs) => {
            this.locaciones = locs || [];
        });
        this.subs.add(sub);
        // Modo edición si se carga como hijo de perfil
        const parentId = this._route.parent?.snapshot.paramMap.get('id');
        const nav = this._router.getCurrentNavigation();
        const state: any = nav?.extras?.state ?? (window.history && (window.history.state || null));
        const b = state?.beneficiario;
        if (parentId) {
            this.modoEdicion = true;
            this.beneficiarioId = Number(parentId);
            if (b) {
                this.prefillFromDetalle(b);
            }
        }
    }

    modoEdicion = false;
    beneficiarioId: number | null = null;
    mapaUrl: SafeResourceUrl | null = null;

    private prefillFromDetalle(b: any): void {
        const persona = b?.persona || {};
        const municipioId = persona?.municipio?.municipioId ?? null;
        const locacionId = persona?.locacion?.locacionId ?? null;
        this.beneficiarioForm.patchValue({
            primerNombre: persona?.primerNombre || '',
            segundoNombre: persona?.segundoNombre || '',
            tercerNombre: persona?.tercerNombre || null,
            primerApellido: persona?.primerApellido || '',
            segundoApellido: persona?.segundoApellido || null,
            fechaNacimiento: persona?.fechaNacimiento ? new Date(persona.fechaNacimiento) : null,
            tipoDocumento: persona?.tipoDocumento || 'DPI',
            numeroDocumento: persona?.numeroDocumento || '',
            direccionDetalle: '',
            municipioId,
            locacionId,
            telefono: persona?.telefono || '',
            fechaInicio: b?.fechaInicio ? new Date(b.fechaInicio) : new Date(),
            latitud: b?.latitud || '',
            longitud: b?.longitud || '',
        });
        if (municipioId) {
            this.getLocaciones(municipioId);
        }
        // Actualizar mapa si ya vienen coordenadas
        this.actualizarMapa();
    }



    onSubmit(): void {
        this.beneficiarioForm.markAllAsTouched();
        if (this.beneficiarioForm.invalid) {
            return;
        }
        const v = this.beneficiarioForm.value as any;

        const normalizeDate = (d: any) => {
            if (!d) return null;
            const date = (d instanceof Date) ? d : new Date(d);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const payload: any = {
            primerNombre: v.primerNombre,
            segundoNombre: v.segundoNombre || '',
            tercerNombre: v.tercerNombre ?? null,
            primerApellido: v.primerApellido,
            segundoApellido: v.segundoApellido ?? null,
            fechaNacimiento: normalizeDate(v.fechaNacimiento),
            genero: v.genero || null,
            tipoDocumento: v.tipoDocumento,
            numeroDocumento: v.numeroDocumento,
            direccionDetalle: v.direccionDetalle || null,
            municipioId: v.municipioId ? Number(v.municipioId) : null,
            locacionId: v.locacionId ? Number(v.locacionId) : null,
            telefono: v.telefono || null,
            estadoId: v.estadoId ? Number(v.estadoId) : 1,
            fechaInicio: normalizeDate(v.fechaInicio || new Date()),
            latitud: v.latitud || null,
            longitud: v.longitud || null,
        };

        this.guardando = true;
        const op = this.modoEdicion && this.beneficiarioId
            ? this._beneficiariosService.updateBeneficiario(this.beneficiarioId, payload)
            : this._beneficiariosService.postBeneficiarios(payload);

        op
        .then(() => {
            if (this.modoEdicion) {
                this._router.navigate(['../'], { relativeTo: this._route });
            } else {
                this._router.navigate(['/beneficiarios']);
            }
        })
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Error al guardar beneficiario', err);
        })
        .finally(() => {
            this.guardando = false;
        });
    }

    obtenerUbicacion(): void {
        if (!('geolocation' in navigator)) {
            // eslint-disable-next-line no-console
            console.error('Geolocalización no soportada por el navegador.');
            return;
        }
        this.obteniendoUbicacion = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toString();
                const lng = position.coords.longitude.toString();
                this.beneficiarioForm.patchValue({ latitud: lat, longitud: lng });
                this.actualizarMapa();
                this.obteniendoUbicacion = false;
            },
            (error) => {
                // eslint-disable-next-line no-console
                console.error('Error obteniendo ubicación:', error);
                this.obteniendoUbicacion = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    // Mantiene URL de Google Maps (aunque no se muestra en el registro)
    actualizarMapa(): void {
        const latRaw = this.beneficiarioForm.get('latitud')?.value;
        const lonRaw = this.beneficiarioForm.get('longitud')?.value;
        const lat = typeof latRaw === 'string' ? parseFloat(latRaw.replace(',', '.')) : Number(latRaw);
        const lon = typeof lonRaw === 'string' ? parseFloat(lonRaw.replace(',', '.')) : Number(lonRaw);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            this.mapaUrl = null;
            return;
        }
        const url = `https://www.google.com/maps?q=${lat},${lon}&hl=es&z=15&output=embed`;
        this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    limpiarCoordenadas(): void {
        this.beneficiarioForm.patchValue({ latitud: null, longitud: null });
        this.actualizarMapa();
    }

    getFormFieldHelpersAsString(): string {
        return this.formFieldHelpers.join(' ');
    }

    // -----------------------------
    // Catálogos
    // -----------------------------
    getDepartamentos(): void {
        const catalogo = 'departamentos';
        this._adminService
            .getCatalogos(catalogo)
            .then((response: any) => {
                this.departamentos = response as Departamento[];
                // Preseleccionar departamento 19 y cargar municipios
                const defaultDepId = 19;
                this.beneficiarioForm.patchValue({ departamentoId: defaultDepId, municipioId: null });
                this.getMunicipios(defaultDepId);
            });
    }

    onDepartamentoChange(depId: number): void {
        this.beneficiarioForm.patchValue({ municipioId: null, departamentoId: depId, locacionId: null });
        this.locaciones = [];
        this.getMunicipios(depId);
    }

    getMunicipios(departamentoId: number | string): void {
        const depId = Number(departamentoId);
        const catalogo = 'municipios';
        const params = { departamentoId: depId };
        this._adminService
            .getCatalogos(catalogo, params)
            .then((response: any) => {
                this.municipios = response as Municipio[];
            });
    }

    onMunicipioChange(municipioId: number): void {
        this.beneficiarioForm.patchValue({ municipioId, locacionId: null });
        if (!municipioId) {
            this.locaciones = [];
            return;
        }
        this.getLocaciones(municipioId);
    }

    private getLocaciones(municipioId: number): void {
        this._beneficiariosService.getCatalogos(municipioId);
    }

    onLocacionSelection(value: any): void {
        if (value === 'AGREGAR') {
            // Revert selection to null while adding
            this.beneficiarioForm.patchValue({ locacionId: null });
            const municipioId = this.beneficiarioForm.get('municipioId')?.value;
            if (!municipioId) {
                // eslint-disable-next-line no-console
                console.error('Seleccione un municipio antes de agregar una locación.');
                return;
            }
            const dialogRef = this._dialog.open(AgregarLocacionDialogComponent, {
                width: '420px',
                data: { municipioId }
            });
            dialogRef.afterClosed().subscribe((result) => {
                if (result && result.locacionId) {
                    // Refrescar y seleccionar la nueva locación
                    this.getLocaciones(municipioId);
                    this.beneficiarioForm.patchValue({ locacionId: result.locacionId });
                } else if (result === 'refresh') {
                    // Solo refrescar listado de locaciones
                    this.getLocaciones(municipioId);
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }
}
