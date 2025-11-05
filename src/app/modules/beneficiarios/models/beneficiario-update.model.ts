export interface BeneficiarioUpdateDTO {
  primerNombre: string; // requerido
  segundoNombre?: string | null;
  tercerNombre?: string | null;
  primerApellido: string; // requerido
  segundoApellido?: string | null;
  fechaNacimiento?: string | null; // YYYY-MM-DD
  genero?: string | null;
  tipoDocumento: string; // requerido
  numeroDocumento: string; // requerido
  direccionDetalle?: string | null;
  municipioId: number; // requerido
  locacionId?: number | null;
  telefono?: string | null;

  estadoId: number; // requerido (1=Activo, 2=Inactivo)
  fechaInicio: string; // requerido, YYYY-MM-DD
  latitud: string; // requerido
  longitud: string; // requerido
}

