import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BeneficiarioListDTO } from 'app/modules/beneficiarios/models/beneficiarios-list-DTO.model';

@Component({
  selector: 'app-confirmar-agregar-beneficiario-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirmar-agregar-beneficiario-dialog.component.html'
})
export class ConfirmarAgregarBeneficiarioDialogComponent {
  constructor(
    private _dialogRef: MatDialogRef<ConfirmarAgregarBeneficiarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      proyectoId: number;
      beneficiario: BeneficiarioListDTO;
      payload: { beneficiarioId: number; fechaIncorporacion: string; estadoId: number };
    }
  ) {}

  confirmar(): void {
    this._dialogRef.close(true);
  }

  cancelar(): void {
    this._dialogRef.close(false);
  }
}

