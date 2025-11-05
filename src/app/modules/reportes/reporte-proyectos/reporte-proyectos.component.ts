import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reporte-proyectos',
  standalone: true,
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-2">Reporte de Proyectos</h2>
      <p class="text-gray-600">Sección en construcción. Pronto podrás filtrar y exportar reportes de proyectos.</p>
    </div>
  `,
  imports: [CommonModule, MatIconModule]
})
export class ReporteProyectosComponent {}

