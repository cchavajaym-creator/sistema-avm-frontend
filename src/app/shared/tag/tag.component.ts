import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

type TagColor = 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'gray';
type TagVariant = 'solid' | 'soft' | 'outline';
type TagSize = 'sm' | 'md';

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center rounded-full font-medium select-none"
          [ngClass]="classes()">
      {{ label }}
    </span>
  `
})
export class TagComponent {
  @Input() label = '';
  @Input() color: TagColor = 'gray';
  @Input() variant: TagVariant = 'soft';
  @Input() size: TagSize = 'sm';

  classes = computed(() => {
    const base = [
      this.size === 'sm' ? 'text-sm px-2 py-0.5' : 'text-base px-3 py-1',
    ];

    const map: Record<TagVariant, Record<TagColor, string>> = {
      solid: {
        primary: 'bg-primary-600 text-white',
        accent: 'bg-accent-600 text-white',
        warn: 'bg-warn-600 text-white',
        success: 'bg-green-600 text-white',
        info: 'bg-sky-600 text-white',
        gray: 'bg-gray-600 text-white',
      },
      soft: {
        primary: 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-100',
        accent: 'bg-accent-50 text-accent-700 dark:bg-accent-500/20 dark:text-accent-100',
        warn: 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100',
        success: 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-100',
        info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100',
      },
      outline: {
        primary: 'text-primary-700 ring-1 ring-inset ring-primary-300',
        accent: 'text-accent-700 ring-1 ring-inset ring-accent-300',
        warn: 'text-amber-800 ring-1 ring-inset ring-amber-300',
        success: 'text-green-700 ring-1 ring-inset ring-green-300',
        info: 'text-sky-700 ring-1 ring-inset ring-sky-300',
        gray: 'text-gray-700 ring-1 ring-inset ring-gray-300',
      },
    };

    return [base.join(' '), map[this.variant][this.color]].join(' ');
  });
}
