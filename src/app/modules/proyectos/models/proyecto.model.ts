import { ProyectoEstado } from "./proyecto-estado.model";

export interface Proyecto {
    proyectoId: number;
    nombreProyecto: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string | null;
    estado: ProyectoEstado;
}
