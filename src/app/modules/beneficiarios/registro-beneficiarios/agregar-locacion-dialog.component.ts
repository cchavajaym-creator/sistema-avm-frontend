import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BeneficiariosService } from '../beneficiarios-service';

@Component({
  selector: 'app-agregar-locacion-dialog',
  standalone: true,
  template: `
    <h2 mat-dialog-title>Agregar locación</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Nombre de la locación</mat-label>
          <input matInput formControlName="nombreLocacion" />
          <mat-error *ngIf="form.get('nombreLocacion')?.hasError('required')">Campo requerido</mat-error>
          <mat-error *ngIf="form.get('nombreLocacion')?.hasError('maxlength')">Máximo 150 caracteres</mat-error>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions class="flex items-center justify-end gap-3 mt-4">
      <button mat-stroked-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="form.invalid || saving">
        {{ saving ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  `,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ]
})
export class AgregarLocacionDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private _beneficiariosService: BeneficiariosService,
    private dialogRef: MatDialogRef<AgregarLocacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { municipioId: number }
  ) {
    this.form = this.fb.group({
      nombreLocacion: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const payload = {
      municipioId: this.data.municipioId,
      nombreLocacion: this.form.value.nombreLocacion as string
    };
    this._beneficiariosService.postLocacion(payload).then((resp: any) => {
      // Si el API devuelve el id creado, lo regresamos para seleccionarlo
      const locacionId = resp?.locacionId ?? null;
      this.dialogRef.close(locacionId ? { locacionId } : 'refresh');
    }).finally(() => {
      this.saving = false;
    });
  }
}

