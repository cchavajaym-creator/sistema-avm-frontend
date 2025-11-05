import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from 'app/core/service/api-service';
import { ProyectosService } from '../proyectos-service';
import { RegistroProyectoService } from './registro-proyectos.service';
import { EstadosDTO } from 'app/modules/models-general/estados.model';

@Component({
    selector: 'app-registro-proyecto',
    standalone: true,
    templateUrl: 'registro-proyecto.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatTooltipModule,
    ],
})
export class RegistroProyectoComponent implements OnInit {
    formFieldHelpers: string[] = [''];
    proyectoForm: FormGroup;
    estados: EstadosDTO[] = [];
    guardando = false;
    fechaFinMin: string | null = null;
    isDialog = false;

    constructor(
        private fb: FormBuilder,
        private _apiService: ApiService,
        private _proyectosService: ProyectosService,
        private _registroProyectoService: RegistroProyectoService,
        @Optional() private _dialogRef?: MatDialogRef<RegistroProyectoComponent>
    ) {
        this.isDialog = !!_dialogRef;
    }

    ngOnInit(): void {
        this.proyectoForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(150)]],
            descripcion: ['', [Validators.maxLength(1000)]],
            fechaInicio: [new Date(),null],
            fechaFin: [null],
            estadoId: [null, [Validators.required]],
        }, { validators: [this._validateFechas()] });

        this.cargarEstados();

        // Inicializar restricción mínima de fecha fin basada en fecha inicio
        const ini = this.proyectoForm.get('fechaInicio')?.value;
        this.fechaFinMin = this._toYMD(ini);
        this.proyectoForm.get('fechaInicio')?.valueChanges.subscribe((d) => {
            this.fechaFinMin = this._toYMD(d);
            // Revalidar rango
            this.proyectoForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
        });
    }

    onSubmit(): void {
        this.proyectoForm.markAllAsTouched();
        if (this.proyectoForm.invalid) {
            return;
        }
        const v = this.proyectoForm.value as any;

        const normalizeDate = (d: any) => {
            if (!d) return null;
            const date = d instanceof Date ? d : new Date(d);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const payload = {
            nombreProyecto: v.nombre,
            descripcion: v.descripcion || null,
            fechaInicio: normalizeDate(v.fechaInicio),
            fechaFin: normalizeDate(v.fechaFin),
            estadoId:v.estadoId
        };

        this.guardando = true;
        this._proyectosService
            .postProyecto(payload)
            .then(() => {
                this._apiService.showSuccessMessage('Proyecto registrado correctamente.');
                if (this._dialogRef) {
                    this._dialogRef.close(true);
                } else {
                    this.proyectoForm.reset();
                }
            })
            .catch(() => {
                // Error handling es mostrado por ApiService
            })
            .finally(() => {
                this.guardando = false;
            });
    }

    private cargarEstados() {
        const params = { tipoEstado: 'p' }
        this._registroProyectoService.cargarEstados(params)
        .then((response: EstadosDTO[])=>{
            this.estados= response
        })
    }

    private _toYMD(d: any): string | null {
        if (!d) return null;
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date.getTime())) return null;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    private _validateFechas() {
        return (group: FormGroup) => {
            const ini = group.get('fechaInicio')?.value;
            const fin = group.get('fechaFin')?.value;
            if (!ini || !fin) {
                group.get('fechaFin')?.setErrors(null);
                return null;
            }
            const dIni = new Date(ini);
            const dFin = new Date(fin);
            if (isNaN(dIni.getTime()) || isNaN(dFin.getTime())) {
                group.get('fechaFin')?.setErrors({ invalidDate: true });
                return { invalidDate: true };
            }
            if (dFin < dIni) {
                group.get('fechaFin')?.setErrors({ rangoInvalido: true });
                return { rangoInvalido: true };
            }
            // Limpiar errores si el rango es válido
            if (group.get('fechaFin')?.hasError('rangoInvalido') || group.get('fechaFin')?.hasError('invalidDate')) {
                group.get('fechaFin')?.setErrors(null);
            }
            return null;
        };
    }

    cancel(): void {
        if (this._dialogRef) {
            this._dialogRef.close(false);
        }
    }
}
