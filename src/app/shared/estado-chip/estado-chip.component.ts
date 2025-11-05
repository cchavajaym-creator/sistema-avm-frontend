import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'estado-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      [ngClass]="colorClasses"
      [attr.aria-label]="textoFinal"
      >
      <span class="h-2 w-2 rounded-full" [ngClass]="dotClasses"></span>
      {{ textoFinal }}
    </span>
  `,
})
export class EstadoChipComponent {
  @Input() estado: number | string | boolean | null | undefined;
  @Input() texto?: string;

  get isActivo(): boolean {
    return this.estado === 1 || this.estado === '1' || this.estado === true || this.texto?.toLowerCase() === 'activo';
  }

  get isInactivo(): boolean {
    return this.estado === 2 || this.estado === '2' || this.estado === false || this.texto?.toLowerCase() === 'inactivo';
  }

  get textoFinal(): string {
    if (this.texto) return this.texto;
    if (this.isActivo) return 'Activo';
    if (this.isInactivo) return 'Inactivo';
    // Fallback
    return this.estado != null ? String(this.estado) : '-';
  }

  get colorClasses(): string {
    if (this.isActivo) return 'bg-green-100 text-green-800 border-green-200';
    if (this.isInactivo) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  get dotClasses(): string {
    if (this.isActivo) return 'bg-green-500';
    if (this.isInactivo) return 'bg-red-500';
    return 'bg-gray-400';
  }
}

