import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
    MatButtonToggleChange,
    MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { ProyectosService } from '../proyectos-service';
import { Subscription, filter, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RegistroProyectoComponent } from '../registro-proyectos/registro-proyecto.component';
import { UserService } from 'app/core/user/user.service';
import { ProyectoCardComponent } from 'app/shared/proyecto-card/proyecto-card.component';
import { MatDivider } from "@angular/material/divider";

@Component({
    selector: 'app-listado-proyectos',
    templateUrl: 'listado-proyectos.component.html',
    imports: [
    CommonModule, MatButtonModule, MatIconModule, FormsModule, MatButtonToggleModule,
    ProyectoCardComponent,
    MatDivider
]
})

export class ListadoProyectosComponent implements OnInit, OnDestroy {
    @ViewChildren('proyectoCard', { read: ElementRef })
    private _cards: QueryList<ElementRef>;

    filters: string[] = ['Todos'];

    numberOfCards: any = {};
    selectedFilter: string = 'Todos';

    proyectos$ = this._proyectosService.proyectos$;

    private _sub = new Subscription();

    constructor(
        private _proyectosService: ProyectosService,
        private _route: ActivatedRoute,
        private _dialog: MatDialog,
        private _userService: UserService,
    ) { }

    ngOnInit() {
        const onlyMine = this._route.snapshot.data?.['onlyMine'] === true;
        if (onlyMine) {
            // Cargar proyectos del usuario logueado
            this._userService.usuarioLogueado$
                .pipe(filter(Boolean), take(1))
                .subscribe((u: any) => {
                    const usuarioId = (u?.userId ?? u?.sub) as number;
                    const params: any = { tipoEstado: 'P', usuarioId };
                    this._proyectosService.loadProyectos(params);
                });
        } else {
            // Cargar todos los proyectos
            this._proyectosService.loadProyectos({ tipoEstado: 'P' });
        }
        this._sub.add(
            this.proyectos$.subscribe((proyectos) => {
                const statuses = Array.from(
                    new Set(
                        (proyectos || [])
                            .map((p) => (p?.estado?.nombre || p?.estado?.descripcion)?.toLowerCase())
                            .filter((s): s is string => !!s)
                    )
                );
                this.filters = ['Todos', ...statuses];
                setTimeout(() => {
                    this._calcNumberOfCards();
                    this._filterCards();
                });
            })
        );
    }

    openRegistroProyecto(): void {
        this._dialog.open(RegistroProyectoComponent, {
            panelClass: ['w-full', 'md:w-7/12', 'mx-0'],
            maxHeight: 'calc(100vh - 4rem)',
            disableClose: true,
        }).afterClosed().subscribe((ok) => {
            if (ok) {
                // recargar listado tras crear
                const onlyMine = this._route.snapshot.data?.['onlyMine'] === true;
                if (onlyMine) {
                    this._userService.usuarioLogueado$
                        .pipe(filter(Boolean), take(1))
                        .subscribe((u: any) => {
                            const usuarioId = (u?.userId ?? u?.sub) as number;
                            this._proyectosService.loadProyectos({ tipoEstado: 'P', usuarioId });
                        });
                } else {
                    this._proyectosService.loadProyectos({ tipoEstado: 'P' });
                }
            }
        });
    }

    ngOnDestroy(): void {
        this._sub.unsubscribe();
    }

    onFilterChange(change: MatButtonToggleChange): void {
        // Set the filter
        this.selectedFilter = change.value;

        // Filter the cards
        this._filterCards();
    }

    ngAfterViewInit(): void {
        // Defer calculations to next tick to avoid NG0100
        setTimeout(() => {
            this._calcNumberOfCards();
            this._filterCards();
        });
    }


    private _calcNumberOfCards(): void {
        if (!this._cards) {
            this.numberOfCards = {};
            return;
        }
        // Prepare the numberOfCards object
        this.numberOfCards = {};

        // Prepare the count
        let count = 0;

        // Go through the filters
        this.filters.forEach((filter) => {
            // For each filter, calculate the card count
            if (filter === 'Todos') {
                count = this._cards.length;
            } else {
                count = this.numberOfCards[filter] = this._cards.filter(
                    (el) =>
                        el.nativeElement.classList.contains('filter-' + filter)
                ).length;
            }

            // Fill the numberOfCards object with the counts
            this.numberOfCards[filter] = count;
        });
    }

    private _filterCards(): void {
        if (!this._cards) {
            return;
        }
        // Go through all fuse-cards
        this._cards.forEach((el) => {
            // If the 'all' filter is selected...
            if (this.selectedFilter === 'Todos') {
                // Remove hidden class from all cards
                el.nativeElement.classList.remove('hidden');
            }
            // Otherwise...
            else {
                // If the card has the class name that matches the selected filter...
                if (el.nativeElement.classList.contains('filter-' + this.selectedFilter)) {
                    // Remove the hidden class
                    el.nativeElement.classList.remove('hidden');
                }
                // Otherwise
                else {
                    // Add the hidden class
                    el.nativeElement.classList.add('hidden');
                }
            }
        });
    }
}
