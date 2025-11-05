import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { HomeComponent } from './modules/home/home.component';
import { RegistroBeneficiarioComponent } from './modules/beneficiarios/registro-beneficiarios/registro-beneficiario.component';
import { ListadoUsuariosComponent } from './modules/admin/listado-usuarios/listado-usuarios.component';
import { ListadoBeneficiosComponent } from './modules/beneficios/listado-beneficios/listado-beneficios.component';
import { ListadoBeneficiariosComponent } from './modules/beneficiarios/listado-beneficiarios/listado-beneficiarios.component';
import { PerfilBeneficiarioComponent } from './modules/beneficiarios/perfil-beneficiario/perfil-beneficiario.component';
import { ListadoProyectosComponent } from './modules/proyectos/listado-proyectos/listado-proyectos.component';
import { DetalleProyectoComponent } from './modules/proyectos/detalle-proyecto/detalle-proyecto.component';
import { ReporteBeneficiariosComponent } from './modules/reportes/reporte-beneficiarios/reporte-beneficiarios.component';
import { ReporteProyectosComponent } from './modules/reportes/reporte-proyectos/reporte-proyectos.component';
import { ReporteBeneficiariosProyectoComponent } from './modules/reportes/reporte-beneficiarios-proyecto/reporte-beneficiarios-proyecto.component';
import { ReporteBeneficiariosAggComponent } from './modules/reportes/reporte-beneficiarios-agg/reporte-beneficiarios-agg.component';
import { ActividadDetalleComponent } from './modules/proyectos/actividad-detalle/actividad-detalle.component';
import { PerfilUsuarioComponent } from './modules/admin/perfil-usuario/perfil-usuario.component';


// prettier-ignore
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    // Redirect empty path to '/dashboards/project'
    {path: '', pathMatch : 'full', redirectTo: 'home'},

    // Redirect signed-in user to the '/dashboards/project'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {
        path: 'signed-in-redirect',
        pathMatch : 'full',
        redirectTo: 'home'
    },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes')},
            {path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes')},
            {path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes')},
            {path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes')},
            {path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes')}
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes')},
            {path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes')}
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
        ]
    },



    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [

            {path: 'home', component: HomeComponent},
            {path: 'registro-beneficiario', component: RegistroBeneficiarioComponent},
            {path: 'beneficiarios', component: ListadoBeneficiariosComponent},
            {
                path: 'beneficiarios/perfil/:id',
                component: PerfilBeneficiarioComponent,
                children: [
                    { path: 'editar', loadComponent: () => import('./modules/beneficiarios/editar-beneficiario/editar-beneficiario.component').then(m => m.EditarBeneficiarioComponent) }
                ]
            },


            //usuarios
            {path: 'usuarios', component: ListadoUsuariosComponent},
            {path: 'perfil/:userId', component: PerfilUsuarioComponent},

            // roles y permisos
            { path: 'roles-y-permisos', loadComponent: () => import('./modules/admin/roles-permisos/roles-permisos.component').then(m => m.RolesPermisosComponent) },

            // beneficios (vista general)
            {path: 'beneficios', component: ListadoBeneficiosComponent},

            //proyectos
            {path: 'listado-proyectos', component: ListadoProyectosComponent},
            {path: 'mis-proyectos', component: ListadoProyectosComponent, data: { onlyMine: true }},
            { path: 'proyectos/nuevo', loadComponent: () => import('./modules/proyectos/registro-proyectos/registro-proyecto.component').then(m => m.RegistroProyectoComponent) },
            // reportes
            {path: 'reporte/beneficiarios', component: ReporteBeneficiariosComponent},
            {path: 'reporte/proyectos', component: ReporteProyectosComponent},
            {path: 'reporte/beneficiarios-proyecto', component: ReporteBeneficiariosProyectoComponent},
            {path: 'reporte/beneficiarios-agg', component: ReporteBeneficiariosAggComponent},
            {
                path: 'proyectos/:id',
                component: DetalleProyectoComponent,
                children: [
                    { path: 'editar', loadComponent: () => import('./modules/proyectos/detalle-proyecto/editar-proyecto/editar-proyecto.component').then(m => m.EditarProyectoComponent) },
                    { path: 'actividades/nueva', loadComponent: () => import('./modules/proyectos/detalle-proyecto/actividades-proyecto/agregar-actividad-dialog.component').then(m => m.AgregarActividadDialogComponent) },
                    { path: 'actividades/:actividadId', component: ActividadDetalleComponent },
                    { path: 'actividades/:actividadId/editar', loadComponent: () => import('./modules/proyectos/detalle-proyecto/actividades-proyecto/agregar-actividad-dialog.component').then(m => m.AgregarActividadDialogComponent) }
                    ,{ path: 'beneficios/nuevo', loadComponent: () => import('./modules/proyectos/detalle-proyecto/beneficios/registro-beneficio.component').then(m => m.RegistroBeneficioComponent) }
                    ,{ path: 'entregas/nueva', loadComponent: () => import('app/modules/proyectos/detalle-proyecto/entrega-beneficios/registro-entrega/registro-entrega.component').then(m => m.RegistroEntregaComponent) }
                    ,{ path: 'entregas/:eventoId', loadComponent: () => import('app/modules/proyectos/entrega-detalle/entrega-detalle.component').then(m => m.EntregaDetalleComponent) }
                ]
            },

            {path: '**', redirectTo: '404-not-found'}
        ]
    }
];
