export interface ReporteResponse<T> {
  items: T[];
  total?: number;
}

// Estructuras basadas en el endpoint /beneficiarios-detalle
export interface BeneficiarioDetalleItem {
  beneficiarioId: number;
  personaId: number;
  nombreCompleto: string;
  genero: string;
  fechaNacimiento?: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  estadoBeneficiario: number;
  fechaInicio: string; // ISO date string
  latitud: string;
  longitud: string;
  edad?: string;
  esMayorEdad: boolean;
}

export interface BeneficiariosReporteFilters {
  municipioId?: number;
  departamentoId?: number;
  estadoBeneficiario?: number;
  q?: string | null; // busca en nombre_completo
  mayorEdad?: boolean | null; // true => es_mayor_edad = 1; false => 0
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
}
