export interface AsistenciaActividad {
  asistenciaId: number;
  actividadId: number;
  beneficiarioId: number;
  fechaRegistro: string; // ISO string e.g., 2025-09-21T06:00:00.000Z
  estadoId: number; // 1 = asistió, 2 = inasistencia (según backend)
  observaciones: string | null;
  beneficiario?: {
    beneficiarioId: number;
    persona?: {
      primerNombre: string;
      segundoNombre?: string | null;
      tercerNombre?: string | null;
      primerApellido: string;
      segundoApellido?: string | null;
      departamento?: string | null;
      municipio?: string | null;
    };
  };
}
