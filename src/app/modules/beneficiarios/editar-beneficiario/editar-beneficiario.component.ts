import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { BeneficiariosService } from '../beneficiarios-service';
import { ApiService } from 'app/core/service/api-service';
import { BeneficiarioUpdateDTO } from '../models/beneficiario-update.model';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from 'app/modules/admin/admin-service';
import { Departamento } from 'app/modules/admin/models/departamentos.model';
import { Municipio } from 'app/modules/admin/models/municipio.model';
import { LocacionesDTO } from '../models/locacionDTO.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AgregarLocacionDialogComponent } from '../registro-beneficiarios/agregar-locacion-dialog.component';

@Component({
  selector: 'app-editar-beneficiario',
  standalone: true,
  templateUrl: 'editar-beneficiario.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
    MatStepperModule,
],
})
export class EditarBeneficiarioComponent implements OnInit, OnDestroy {
  form: FormGroup;
  guardando = false;
  beneficiarioId!: number;
  // Catálogos
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];
  locaciones: LocacionesDTO[] = [];
  private subs = new Subscription();
  private destroy$ = new Subject<void>();
  generos = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'O', label: 'Otro' },
  ];
  mapUrl: SafeResourceUrl | null = null;

  constructor(
    private fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _benefService: BeneficiariosService,
    private _api: ApiService,
    private _adminService: AdminService,
    private _dialog: MatDialog,
    private sanitizer: DomSanitizer,
  ) {
    this.form = this.fb.group({
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      tercerNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      fechaNacimiento: [''],
      genero: [''],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      direccionDetalle: [''],
      departamentoId: [null, Validators.required],
      municipioId: [null, Validators.required],
      locacionId: [null],
      estadoId: [1, Validators.required],
      telefono: [''],
      rolId: [null],
      latitud: ['', Validators.required],
      longitud: ['', Validators.required],
      fechaInicio: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.beneficiarioId = Number(this._route.parent?.snapshot.paramMap.get('id'));

    // Cargar catálogos base
    this.getDepartamentos();

    // Suscripción a locaciones (se actualizan por municipio)
    const sub = this._benefService.locaion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((locs) => this.locaciones = locs || []);
    this.subs.add(sub);

    if (this.beneficiarioId) {
      // Obtener datos desde API por id (evita depender de navigation state)
      this._benefService.getBeneficiarioPorId(this.beneficiarioId)
        .then((resp: any) => this.prefillFromDetalle(resp));
    }

    // Actualizar mapa al cambiar coordenadas
    this.form.get('latitud')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateMapUrl());
    this.form.get('longitud')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateMapUrl());
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.value as any;
    const normalizeDate = (d: any) => {
      if (!d) return null;
      const date = (d instanceof Date) ? d : new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const payload: BeneficiarioUpdateDTO = {
      primerNombre: v.primerNombre,
      segundoNombre: v.segundoNombre || '',
      tercerNombre: v.tercerNombre || '',
      primerApellido: v.primerApellido,
      segundoApellido: v.segundoApellido || '',
      fechaNacimiento: normalizeDate(v.fechaNacimiento) as any,
      genero: v.genero || '',
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento,
      direccionDetalle: v.direccionDetalle || '',
      municipioId: v.municipioId ? Number(v.municipioId) : null,
      locacionId: v.locacionId ? Number(v.locacionId) : null,
      estadoId: v.estadoId ? Number(v.estadoId) : null,
      telefono: v.telefono || '',
      latitud: v.latitud || '',
      longitud: v.longitud || '',
      fechaInicio: normalizeDate(v.fechaInicio) as any,
    } as any;
    try {
      this.guardando = true;
      await this._benefService.updateBeneficiario(this.beneficiarioId, payload);
      this._api.showSuccessMessage('Beneficiario actualizado');
      this.cerrar();
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this._router.navigate(['../'], { relativeTo: this._route });
  }

  // -----------------------------
  // Catálogos y ubicaciones
  // -----------------------------
  getDepartamentos(): void {
    const catalogo = 'departamentos';
    this._adminService.getCatalogos(catalogo)
      .then((response: any) => {
        this.departamentos = response as Departamento[];
        // Si no hay valor, preseleccionar 19 como en registro
        const depId = this.form.get('departamentoId')?.value ?? 19;
        this.form.patchValue({ departamentoId: depId });
        this.getMunicipios(depId);
      });
  }

  getMunicipios(departamentoId: number | string): void {
    const depId = Number(departamentoId);
    const catalogo = 'municipios';
    const params = { departamentoId: depId };
    this._adminService.getCatalogos(catalogo, params)
      .then((response: any) => {
        this.municipios = response as Municipio[];
      });
  }

  onDepartamentoChange(depId: number): void {
    this.form.patchValue({ municipioId: null, locacionId: null, departamentoId: depId });
    this.locaciones = [];
    this.getMunicipios(depId);
  }

  onMunicipioChange(municipioId: number): void {
    this.form.patchValue({ municipioId, locacionId: null });
    if (!municipioId) {
      this.locaciones = [];
      return;
    }
    this.getLocaciones(municipioId);
  }

  private getLocaciones(municipioId: number): void {
    this._benefService.getCatalogos(municipioId);
  }

  onLocacionSelection(value: any): void {
    if (value === 'AGREGAR') {
      this.form.patchValue({ locacionId: null });
      const municipioId = this.form.get('municipioId')?.value;
      if (!municipioId) {
        return;
      }
      const dialogRef = this._dialog.open(AgregarLocacionDialogComponent, {
        width: '420px',
        data: { municipioId }
      });
      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result && result.locacionId) {
            this.getLocaciones(municipioId);
            this.form.patchValue({ locacionId: result.locacionId });
          } else if (result === 'refresh') {
            this.getLocaciones(municipioId);
          }
      });
    }
  }

  obtenerUbicacion(): void {
    if (!('geolocation' in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        this.form.patchValue({ latitud: lat, longitud: lng });
        this.updateMapUrl();
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }

  private prefillFromDetalle(b: any): void {
    const municipioId = b?.persona?.municipio?.municipioId || null;
    const depId = b?.persona?.municipio?.departamentoId || null; // Puede venir nulo en la respuesta
    const rawGenero = (b?.persona?.genero ?? '').toString().toUpperCase();
    const genero = ['M','F','O'].includes(rawGenero) ? rawGenero : '';
    this.form.patchValue({
      primerNombre: b?.persona?.primerNombre || '',
      segundoNombre: b?.persona?.segundoNombre || '',
      tercerNombre: b?.persona?.tercerNombre || '',
      primerApellido: b?.persona?.primerApellido || '',
      segundoApellido: b?.persona?.segundoApellido || '',
      fechaNacimiento: b?.persona?.fechaNacimiento ? String(b?.persona?.fechaNacimiento).substring(0,10) : '',
      genero,
      tipoDocumento: b?.persona?.tipoDocumento || 'DPI',
      numeroDocumento: b?.persona?.numeroDocumento || '',
      direccionDetalle: b?.persona?.direccionDetalle || '',
      departamentoId: depId ?? this.form.get('departamentoId')?.value ?? 19,
      municipioId: municipioId,
      locacionId: b?.persona?.locacion?.locacionId || null,
      estadoId: b?.estadoId ?? 1,
      telefono: b?.persona?.telefono || '',
      latitud: b?.latitud || '',
      longitud: b?.longitud || '',
      fechaInicio: b?.fechaInicio ? String(b?.fechaInicio).substring(0,10) : ''
    });
    const depToLoad = depId ?? this.form.get('departamentoId')?.value ?? 19;
    if (depToLoad) {
      this.getMunicipios(depToLoad);
    }
    if (municipioId) {
      this.getLocaciones(municipioId);
    }
    this.updateMapUrl();
  }

  private updateMapUrl(): void {
    const latRaw = this.form.get('latitud')?.value;
    const lngRaw = this.form.get('longitud')?.value;
    const lat = typeof latRaw === 'string' ? parseFloat(latRaw.replace(',', '.')) : Number(latRaw);
    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw.replace(',', '.')) : Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const url = `https://www.google.com/maps?q=${lat},${lng}&hl=es&z=15&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      this.mapUrl = null;
    }
  }
}
