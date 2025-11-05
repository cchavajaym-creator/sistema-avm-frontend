import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './metric-card.component.html',
  host: { class: 'block w-full' }
})
export class MetricCardComponent {
  @Input() title: string;
  @Input() value: number | string;
  @Input() subtitle: string = 'Total';
  @Input() icon?: string; // MatIcon ligature name
  @Input() svgIcon?: string; // MatIcon svg icon name
  @Input() wrapperClass?: string; // Extra/override classes for container
}
