import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseCardComponent } from '@fuse/components/card';
import { Proyecto } from 'app/modules/proyectos/models/proyecto.model';
import { MatDividerModule } from '@angular/material/divider';
import { TagComponent } from 'app/shared/tag/tag.component';

@Component({
  selector: 'app-proyecto-card',
  standalone: true,
  templateUrl: './proyecto-card.component.html',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatDividerModule, FuseCardComponent, TagComponent]
})
export class ProyectoCardComponent {
  @Input() proyecto: Proyecto;

  estadoColor(desc?: string | null): 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray' {
    const t = (desc || '').toLowerCase();
    if (t.includes('activo')) return 'success';
    if (t.includes('progreso') || t.includes('vigente')) return 'info';
    if (t.includes('pendiente')) return 'accent';
    if (t.includes('final') || t.includes('cerrado') || t.includes('inactivo') || t.includes('cancel')) return 'warn';
    return 'primary';
  }
}
