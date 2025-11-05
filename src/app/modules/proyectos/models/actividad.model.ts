export interface Actividad {
  actividadId: number;
  proyectoId: number;
  nombreActividad: string;
  tipoActividad: string;
  descripcion: string;
  fechaActividad: string; // ISO string
  lugar: string;
}

