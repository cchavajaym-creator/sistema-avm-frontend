import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Actividad } from '../../models/actividad.model';

@Component({
  selector: 'app-ver-actividad-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: 'ver-actividad-dialog.component.html'
})
export class VerActividadDialogComponent {
  constructor(
    private _dialogRef: MatDialogRef<VerActividadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actividad: Actividad },
  ) {}

  cerrar(): void {
    this._dialogRef.close();
  }
}

