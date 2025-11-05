import { FuseNavigationItem } from "@fuse/components/navigation";

export const NavigationData: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Inicio',
        type : 'basic',
        tooltip:'Inicio',
        icon : 'heroicons_outline:home',
        link : '/home'
    },
    {
        id   : 'Beneficiarios',
        title: 'Beneficiarios',
        type : 'aside',
        tooltip:'solicitudes',
        icon : 'heroicons_outline:user-group',
        children: [
            {
                id: 'Registro',
                title: 'Registro Beneficiarios',
                type: 'group',
                children: [
                    {
                        id: 'Registro de beneficiario',
                        type: 'basic',
                        title: 'Registro de Beneficiarios',
                        icon: 'heroicons_outline:user-plus',
                        link: `/registro-beneficiario`,
                        exactMatch: true
                    }
                ]
            },
            {
                id: 'Beleficiarios',
                title: 'seccion',
                type: 'group',
                children: [
                    {
                        id: 'Listado General',
                        type: 'basic',
                        title: 'Listado General',
                        icon: 'heroicons_outline:queue-list',
                        link: `/beneficiarios`

                    }
                ]
            },


        ]
    },
    {
        id   : 'Proyectos',
        title: 'proyectos',
        type : 'aside',
        tooltip:'proyectos',
        icon : 'heroicons_outline:folder-open',
        children: [
            {
                id: 'proyectos_personales',
                title: 'Mis Proyectos',
                type: 'group',
                children: [
                    {
                        id: 'mis_proyectos_listado',
                        type: 'basic',
                        title: 'Mis Proyectos',
                        icon: 'heroicons_outline:folder',
                        link: `/mis-proyectos`,
                        exactMatch: true
                    }

                ]
            },
            {
                id: 'proyectos_general',
                title: 'Listado General',
                type: 'group',
                children: [
                     /*{
                        id: 'proyectos_listado',
                        type: 'basic',
                        title: 'Listado de proyectos',
                        icon: 'heroicons_outline:queue-list',
                        link: `/listado-proyectos`,
                        exactMatch: true
                    },*/
                    {
                        id: 'proyectos_nuevo',
                        type: 'basic',
                        title: 'Nuevo proyecto',
                        icon: 'heroicons_outline:plus-circle',
                        link: `/proyectos/nuevo`,
                        exactMatch: true
                    }
                ]
            }
        ]
    },

    // Beneficios (sección general)
    {
        id   : 'Beneficios',
        title: 'Beneficios',
        type : 'basic',
        tooltip:'Beneficios',
        icon : 'heroicons_outline:banknotes',
        link : '/beneficios',
        exactMatch: true
    },

    {
        id   : 'menu_administrar',
        title: 'Administrador',
        type : 'aside',
        tooltip:'Administrar',
        icon : 'heroicons_outline:cog-8-tooth',
        children:[
            {
                id: 'usuarios_menu',
                title: 'Usuarios',
                type: 'group',
                children: [
                    {
                        id   : 'listado_general_usuarios',
                        title: 'Listado General',
                        type : 'basic',
                        icon : 'heroicons_outline:users',
                        link : '/usuarios'
                    }
                ]
            }
        ]
    },
    {
        id: 'menu_reportes',
        title: 'Reportes',
        type: 'aside',
        tooltip:'Reportes',
        icon : 'heroicons_outline:presentation-chart-bar',
        children: [
             {
                id: 'reportes_seccion',
                title: 'Sección',
                type: 'group',
                children: [
                    {
                        id: 'reportes_seccion_prehispanica',
                        type: 'basic',
                        title: 'Proyectos',
                        icon: 'heroicons_outline:chart-bar',
                        link: `/reporte/proyectos`

                    },
                    {
                        id: 'reportes_beneficiarios',
                        type: 'basic',
                        title: 'Beneficiarios',
                        icon: 'heroicons_outline:users',
                        link: `/reporte/beneficiarios`
                    },
                    {
                        id: 'reportes_beneficiarios_proyecto',
                        type: 'basic',
                        title: 'Beneficiarios por Proyecto',
                        icon: 'heroicons_outline:users',
                        link: `/reporte/beneficiarios-proyecto`
                    },
                    {
                        id: 'reportes_beneficiarios_agg',
                        type: 'basic',
                        title: 'Proyectos por Beneficiario',
                        icon: 'heroicons_outline:users',
                        link: `/reporte/beneficiarios-agg`
                    }
                ]
            },
        ]
    },
    {
        id   : 'logout',
        title: 'Salir',
        type : 'basic',
        icon : 'heroicons_outline:arrow-right-on-rectangle',
        tooltip: 'Salir',
        link: '/sign-out'
    }
];
