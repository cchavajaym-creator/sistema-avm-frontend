export interface BeneficiarioAggItem {
  beneficiarioId: number;
  personaId: number;
  nombreCompleto: string;
  genero: string;
  fechaNacimiento: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  estadoBeneficiario: number;
  fechaInicio: string;
  latitud: string;
  longitud: string;
  edad: number;
  esMayorEdad: boolean;
  proyectosIds: any;
  proyectosNombres: any;
}

export interface BeneficiariosAggFilters {
  municipioId?: number;
  departamentoId?: number;
  estadoBeneficiario?: number;
  mayorEdad?: boolean | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
}

